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
  
  // Admin credentials
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "admin123";
  
  // User routes
  app.post('/api/users/register', async (req, res) => {
    try {
      const { username, password, nickname } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Foydalanuvchi nomi va parol talab qilinadi" });
      }
      
      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Bu foydalanuvchi nomi allaqachon mavjud" });
      }
      
      // Determine if this is the admin account
      const isAdmin = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
      
      // Create user (in real app, password should be hashed)
      const user = await storage.createUser({
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: username.trim(),
        nickname: nickname?.trim() || username.trim(),
        isAdmin,
        password, // In real app, this would be hashed
      });
      
      console.log("New user created:", { id: user.id, username: user.username, nickname: user.nickname });
      
      res.status(201).json({ message: "Foydalanuvchi muvaffaqiyatli yaratildi", user });
    } catch (error: any) {
      console.error("Error creating user:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ 
        message: "Foydalanuvchi yaratishda xatolik yuz berdi",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });
  
  app.post('/api/users/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log("Login attempt:", { username, hasPassword: !!password });
      
      // Special case for admin
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        console.log("Admin login attempt");
        // Check if admin already exists
        let adminUser = await storage.getUserByUsername(username);
        console.log("Admin user found:", !!adminUser);
        
        // If admin doesn't exist yet, create admin account
        if (!adminUser) {
          console.log("Creating admin user");
          adminUser = await storage.createUser({
            id: `admin_${Date.now()}`,
            username: ADMIN_USERNAME,
            nickname: "Administrator",
            password: ADMIN_PASSWORD,
            isAdmin: true
          });
          console.log("Admin user created:", adminUser.id);
        } else if (!adminUser.isAdmin) {
          // Update user to admin if account exists but is not admin
          console.log("Updating user to admin");
          adminUser.isAdmin = true;
          adminUser = await storage.upsertUser(adminUser);
        }
        
        // Create session for admin
        console.log("Creating session for admin");
        if (req.session) {
          const userSession = {
            claims: {
              sub: adminUser.id,
              username: adminUser.username,
              isAdmin: true,
            }
          };
          (req.session as any).passport = { user: userSession };
          console.log("Session created, saving...");
          await new Promise<void>((resolve, reject) => {
            req.session!.save((err) => {
              if (err) {
                console.error("Session save error:", err);
                reject(err);
              } else {
                console.log("Session saved successfully");
                resolve();
              }
            });
          });
        }
        
        return res.json({ message: "Admin muvaffaqiyatli login", user: adminUser });
      }
      
      // Regular user login
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
        await new Promise<void>((resolve, reject) => {
          req.session!.save((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      
      res.json({ message: "Muvaffaqiyatli login", user });
    } catch (error: any) {
      console.error("Error logging in:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ 
        message: "Login qilishda xatolik yuz berdi",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  // User routes
  app.get('/api/users/search', async (req: any, res) => {
    try {
      // Check authentication - support both methods
      const session = req.session as any;
      let userId;
      
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else if (session?.passport?.user?.claims?.sub) {
        userId = session.passport.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const query = (req.query.q as string)?.trim();
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      console.log("Searching users with query:", query, "for user:", userId);
      const foundUsers = await storage.searchUsers(query, userId);
      console.log("Search results:", foundUsers.length, "users found");
      
      // Log found users for debugging
      if (foundUsers.length > 0) {
        console.log("Found users:", foundUsers.map((u: any) => ({ 
          id: u.id, 
          username: u.username, 
          nickname: u.nickname 
        })));
      }
      
      res.json(foundUsers);
    } catch (error: any) {
      console.error("Error searching users:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ 
        message: "Foydalanuvchilarni qidirishda xatolik",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  // Get all users (for testing/search purposes)
  app.get('/api/users/all', async (req: any, res) => {
    try {
      const session = req.session as any;
      let userId;
      
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else if (session?.passport?.user?.claims?.sub) {
        userId = session.passport.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const allUsers = await storage.getAllUsers();
      // Filter out current user
      const otherUsers = allUsers.filter((u: any) => u.id !== userId);
      res.json(otherUsers);
    } catch (error: any) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ 
        message: "Foydalanuvchilarni olishda xatolik",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
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
      
      if (!sender) {
        return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
      }
      
      // Broadcast via websocket to all participants (except sender)
      // Import WebSocket clients from websocket module
      const { broadcastMessageToChatParticipants } = await import('./websocket');
      const participants = await storage.getChatParticipants(chatId);
      
      console.log(`Broadcasting message ${message.id} to ${participants.length} participants (excluding sender ${userId})`);
      
      // Broadcast to all participants except the sender
      for (const participant of participants) {
        if (participant.id !== userId) {
          console.log(`Sending message to participant: ${participant.id} (${participant.nickname || participant.username})`);
          const messagePayload = {
            ...message,
            sender,
            chatId: message.chatId
          };
          console.log(`Message payload:`, JSON.stringify(messagePayload, null, 2));
          broadcastMessageToChatParticipants(participant.id, {
            type: 'message',
            payload: messagePayload
          });
        }
      }
      
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
  app.get('/api/admin/stats', async (req: any, res) => {
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
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Bu amaliyot faqat adminlar uchun" });
      }
      
      console.log("Admin stats requested by user:", userId);
      
      const allUsers = await storage.getAllUsers();
      const activeUsersCount = await storage.getActiveUsersCount();
      const groupsCount = await storage.getGroupsCount();
      const messagesToday = await storage.getTotalMessagesToday();
      
      console.log("Admin stats:", {
        totalUsers: allUsers.length,
        activeUsers: activeUsersCount,
        groups: groupsCount,
        messagesToday
      });
      
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

  app.get('/api/admin/users', async (req: any, res) => {
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
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Bu amaliyot faqat adminlar uchun" });
      }
      
      console.log("Admin users list requested by user:", userId);
      
      const users = await storage.getAllUsers();
      console.log(`Retrieved ${users.length} users for admin panel`);
      
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
