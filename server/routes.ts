import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { WebSocketServer } from "ws";
import { z } from "zod";
import { setupWebsocket } from "./websocket";
import { insertChatSchema, insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // HTTP Server & WebSocket setup
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  setupWebsocket(wss, storage);

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Handle both Replit auth and manual login
      let userId;
      if (req.user.claims?.sub) {
        // Replit auth
        userId = req.user.claims.sub;
      } else if (req.session?.passport?.user?.claims?.sub) {
        // Manual login
        userId = req.session.passport.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Foydalanuvchi ma'lumotlarini olishda xatolik" });
    }
  });
  
  // User routes
  app.post('/api/users/register', async (req, res) => {
    try {
      const { username, password, nickname, isAdmin } = req.body;
      
      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Bu foydalanuvchi nomi allaqachon mavjud" });
      }
      
      // Create user (in real app, password should be hashed)
      const user = await storage.createUser({
        id: `manual_${Date.now()}`,
        username,
        nickname,
        isAdmin: Boolean(isAdmin),
        password, // In real app, this would be hashed
      });
      
      res.status(201).json({ message: "Foydalanuvchi muvaffaqiyatli yaratildi", user });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Foydalanuvchi yaratishda xatolik yuz berdi" });
    }
  });
  
  app.post('/api/users/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find the user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Noto'g'ri foydalanuvchi nomi yoki parol" });
      }
      
      // Check password (in real app, you'd compare hashed passwords)
      if (user.password !== password) {
        return res.status(401).json({ message: "Noto'g'ri foydalanuvchi nomi yoki parol" });
      }
      
      // Create a manual session
      if (req.session) {
        const userSession = {
          claims: {
            sub: user.id,
            username: user.username,
            isAdmin: user.isAdmin,
          }
        };
        (req.session as any).passport = { user: userSession };
      }
      
      res.json({ message: "Muvaffaqiyatli login", user });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Login qilishda xatolik yuz berdi" });
    }
  });

  // User routes
  app.get('/api/users/search', isAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const userId = req.user.claims.sub;
      const users = await storage.searchUsers(query, userId);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Foydalanuvchilarni qidirishda xatolik" });
    }
  });

  // Create or update user profile
  app.post('/api/users/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const username = req.body.username;
      const nickname = req.body.nickname;
      
      // Check if username exists
      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Bu foydalanuvchi nomi band" });
        }
      }
      
      const user = await storage.upsertUser({
        id: userId,
        username: username || `user_${userId}`,
        nickname: nickname || username || `User ${userId}`,
        email: req.user.claims.email,
        firstName: req.user.claims.first_name,
        lastName: req.user.claims.last_name,
        profileImageUrl: req.user.claims.profile_image_url,
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Profilni yangilashda xatolik" });
    }
  });

  // Chat routes
  app.get('/api/chats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chats = await storage.getUserChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Chatlarni olishda xatolik" });
    }
  });

  app.post('/api/chats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatData = insertChatSchema.parse({
        ...req.body,
        createdBy: userId
      });
      
      const chat = await storage.createChat(chatData);
      
      // Add creator as participant
      await storage.addChatParticipant({
        chatId: chat.id,
        userId,
        isAdmin: true
      });
      
      // Add other participants if any
      if (req.body.participants && Array.isArray(req.body.participants)) {
        for (const participantId of req.body.participants) {
          if (participantId !== userId) {
            await storage.addChatParticipant({
              chatId: chat.id,
              userId: participantId,
              isAdmin: false
            });
          }
        }
      }
      
      res.status(201).json(chat);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ message: "Chat yaratishda xatolik" });
    }
  });

  app.get('/api/chats/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Noto'g'ri chat ID" });
      }
      
      const messages = await storage.getChatMessages(chatId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Xabarlarni olishda xatolik" });
    }
  });

  app.post('/api/chats/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Noto'g'ri chat ID" });
      }
      
      const userId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({
        chatId,
        senderId: userId,
        content: req.body.content
      });
      
      const message = await storage.createMessage(messageData);
      
      // Get sender info
      const sender = await storage.getUser(userId);
      
      // Send via websocket to all participants
      const participants = await storage.getChatParticipants(chatId);
      
      res.status(201).json({
        ...message,
        sender
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Xabar yuborishda xatolik" });
    }
  });

  app.post('/api/messages/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Noto'g'ri xabar ID" });
      }
      
      const userId = req.user.claims.sub;
      await storage.markMessageAsRead(messageId, userId);
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Xabarni o'qilgan deb belgilashda xatolik" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Bu amaliyot faqat adminlar uchun" });
      }
      
      const allUsers = await storage.getAllUsers();
      const activeUsersCount = await storage.getActiveUsersCount();
      const groupsCount = await storage.getGroupsCount();
      const messagesToday = await storage.getTotalMessagesToday();
      
      res.json({
        totalUsers: allUsers.length,
        activeUsers: activeUsersCount,
        groups: groupsCount,
        messagesToday,
        recentUsers: allUsers.slice(0, 10) // Get 10 most recent users
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Statistika olishda xatolik" });
    }
  });

  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Bu amaliyot faqat adminlar uchun" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users for admin:", error);
      res.status(500).json({ message: "Foydalanuvchilarni olishda xatolik" });
    }
  });

  // Make a user an admin
  app.post('/api/admin/users/:id/make-admin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Bu amaliyot faqat adminlar uchun" });
      }
      
      const targetUserId = req.params.id;
      const targetUser = await storage.getUser(targetUserId);
      
      if (!targetUser) {
        return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
      }
      
      await storage.upsertUser({
        ...targetUser,
        isAdmin: true,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error making user admin:", error);
      res.status(500).json({ message: "Foydalanuvchini admin qilishda xatolik" });
    }
  });

  return httpServer;
}
