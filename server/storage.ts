import {
  users,
  chats,
  chatParticipants,
  messages,
  messageReads,
  type User,
  type UpsertUser,
  type InsertChat,
  type Chat,
  type InsertChatParticipant,
  type InsertMessage,
  type Message,
  type ChatWithLastMessage,
  type MessageWithSender
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNotNull, count, asc, or, isNull, sql, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  searchUsers(query: string, currentUserId: string): Promise<User[]>;
  updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getActiveUsersCount(): Promise<number>;
  
  // Chat operations
  createChat(chat: InsertChat): Promise<Chat>;
  getChat(id: number): Promise<Chat | undefined>;
  addChatParticipant(participant: InsertChatParticipant): Promise<void>;
  getChatParticipants(chatId: number): Promise<User[]>;
  getUserChats(userId: string): Promise<ChatWithLastMessage[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getChatMessages(chatId: number): Promise<MessageWithSender[]>;
  markMessageAsRead(messageId: number, userId: string): Promise<void>;
  getUnreadCount(chatId: number, userId: string): Promise<number>;
  getTotalMessagesToday(): Promise<number>;
  
  // Admin
  getGroupsCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(
        and(
          or(
            sql`${users.username} ILIKE ${`%${query}%`}`,
            sql`${users.nickname} ILIKE ${`%${query}%`}`
          ),
          sql`${users.id} != ${currentUserId}`
        )
      )
      .limit(20);
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({ 
        isOnline, 
        lastSeen: isOnline ? undefined : new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getActiveUsersCount(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isOnline, true));
    
    return result[0]?.count || 0;
  }

  // Chat operations
  async createChat(chat: InsertChat): Promise<Chat> {
    const [newChat] = await db.insert(chats).values(chat).returning();
    return newChat;
  }

  async getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat;
  }

  async addChatParticipant(participant: InsertChatParticipant): Promise<void> {
    await db.insert(chatParticipants).values(participant)
      .onConflictDoNothing({
        target: [chatParticipants.chatId, chatParticipants.userId]
      });
  }

  async getChatParticipants(chatId: number): Promise<User[]> {
    const participants = await db
      .select({
        user: users
      })
      .from(chatParticipants)
      .innerJoin(users, eq(chatParticipants.userId, users.id))
      .where(eq(chatParticipants.chatId, chatId));

    return participants.map(p => p.user);
  }

  async getUserChats(userId: string): Promise<ChatWithLastMessage[]> {
    // Get all chats the user is part of
    const userChats = await db
      .select({
        chat: chats
      })
      .from(chatParticipants)
      .innerJoin(chats, eq(chatParticipants.chatId, chats.id))
      .where(eq(chatParticipants.userId, userId));

    const chatIds = userChats.map(c => c.chat.id);
    
    if (chatIds.length === 0) {
      return [];
    }

    // Get the latest message for each chat
    const latestMessages = await db
      .select({
        chatId: messages.chatId,
        lastMessage: messages
      })
      .from(messages)
      .where(inArray(messages.chatId, chatIds))
      .orderBy(desc(messages.createdAt))
      .groupBy(messages.chatId, messages.id);

    // Get unread counts
    const unreadCounts = await Promise.all(
      chatIds.map(chatId => this.getUnreadCount(chatId, userId))
    );

    // Get participants for each chat
    const participants = await Promise.all(
      chatIds.map(chatId => this.getChatParticipants(chatId))
    );

    // Combine the data
    return userChats.map((chat, index) => {
      const lastMessageEntry = latestMessages.find(
        msg => msg.chatId === chat.chat.id
      );

      return {
        ...chat.chat,
        lastMessage: lastMessageEntry?.lastMessage,
        unreadCount: unreadCounts[index] || 0,
        participants: participants[index] || []
      };
    }).sort((a, b) => {
      // Sort by latest message, or creation date if no messages
      const aTime = a.lastMessage?.createdAt || a.createdAt;
      const bTime = b.lastMessage?.createdAt || b.createdAt;
      return bTime.getTime() - aTime.getTime();
    });
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    
    // Update chat updatedAt
    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, message.chatId));
      
    return newMessage;
  }

  async getChatMessages(chatId: number): Promise<MessageWithSender[]> {
    const messagesWithSenders = await db
      .select({
        message: messages,
        sender: users
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt));

    return messagesWithSenders.map(m => ({
      ...m.message,
      sender: m.sender
    }));
  }

  async markMessageAsRead(messageId: number, userId: string): Promise<void> {
    // Add to messageReads
    await db.insert(messageReads)
      .values({
        messageId,
        userId
      })
      .onConflictDoNothing({
        target: [messageReads.messageId, messageReads.userId]
      });

    // Update message isRead status if all participants have read it
    const message = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .then(res => res[0]);

    if (!message) return;

    const participants = await this.getChatParticipants(message.chatId);
    const reads = await db
      .select()
      .from(messageReads)
      .where(eq(messageReads.messageId, messageId));

    // If all participants except sender have read the message, mark it as read
    const allParticipantsExceptSenderHaveRead = participants
      .filter(p => p.id !== message.senderId)
      .every(p => reads.some(r => r.userId === p.id));

    if (allParticipantsExceptSenderHaveRead) {
      await db
        .update(messages)
        .set({ isRead: true })
        .where(eq(messages.id, messageId));
    }
  }

  async getUnreadCount(chatId: number, userId: string): Promise<number> {
    // Get all messages in chat
    const allMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.chatId, chatId),
          sql`${messages.senderId} != ${userId}` // Only count messages not sent by the user
        )
      );
    
    if (allMessages.length === 0) {
      return 0;
    }

    // Get all messages that the user has read
    const messageIds = allMessages.map(m => m.id);
    
    const readMessages = await db
      .select()
      .from(messageReads)
      .where(
        and(
          inArray(messageReads.messageId, messageIds),
          eq(messageReads.userId, userId)
        )
      );
    
    // Count unread messages
    return allMessages.length - readMessages.length;
  }

  async getTotalMessagesToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db
      .select({ count: count() })
      .from(messages)
      .where(sql`${messages.createdAt} >= ${today}`);
    
    return result[0]?.count || 0;
  }

  // Admin
  async getGroupsCount(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(chats)
      .where(eq(chats.isGroup, true));
    
    return result[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();
