import { WebSocketServer, WebSocket } from 'ws';
import { IStorage } from './storage';

// Define message types
type MessageType = 'message' | 'typing' | 'read' | 'user_online' | 'user_offline' | 'call' | 'auth';

interface WebSocketMessage {
  type: MessageType;
  payload: any;
}

// Keep track of connected clients by userId
const clients: Map<string, WebSocket> = new Map();

// Export function to broadcast message to chat participants
export function broadcastMessageToChat(chatId: number, message: any, sender: any, excludeUserId?: string) {
  // This will be called from routes.ts after creating a message via API
  // We need to get participants from storage, but we'll pass them as parameter
}

export function setupWebsocket(wss: WebSocketServer, storage: IStorage) {
  wss.on('connection', (ws: WebSocket & { userId?: string }) => {
    console.log('New WebSocket connection established');

    ws.on('message', async (data: string) => {
      try {
        const message: WebSocketMessage = JSON.parse(data);
        
        if (message.type === 'auth') {
          const userId = message.payload.userId;
          if (userId) {
            ws.userId = userId;
            clients.set(userId, ws);
            console.log(`User ${userId} authenticated WebSocket`);
            
            // Update user's online status
            await storage.updateUserOnlineStatus(userId, true);
            
            // Broadcast online status to other users
            broadcastToAll({
              type: 'user_online',
              payload: { userId }
            }, userId);
          }
        } else if (message.type === 'message' && ws.userId) {
          const { chatId, content } = message.payload;
          
          // Store message in database
          const newMessage = await storage.createMessage({
            chatId,
            senderId: ws.userId,
            content
          });
          
          // Get sender information
          const sender = await storage.getUser(ws.userId);
          
          if (!sender) return;
          
          // Get chat participants to broadcast the message
          const participants = await storage.getChatParticipants(chatId);
          
          // Broadcast to all participants
          for (const participant of participants) {
            if (participant.id !== ws.userId) {
              sendToUser(participant.id, {
                type: 'message',
                payload: {
                  ...newMessage,
                  sender,
                  chatId: newMessage.chatId
                }
              });
            }
          }
        } else if (message.type === 'typing' && ws.userId) {
          const { chatId, isTyping } = message.payload;
          
          // Get chat participants
          const participants = await storage.getChatParticipants(chatId);
          
          // Broadcast typing status to all participants except the sender
          for (const participant of participants) {
            if (participant.id !== ws.userId) {
              sendToUser(participant.id, {
                type: 'typing',
                payload: {
                  chatId,
                  userId: ws.userId,
                  isTyping
                }
              });
            }
          }
        } else if (message.type === 'read' && ws.userId) {
          const { messageId } = message.payload;
          
          // Mark message as read in database
          await storage.markMessageAsRead(messageId, ws.userId);
        } else if (message.type === 'call' && ws.userId) {
          const { type, targetUserId, action, chatId, offer, answer, candidate } = message.payload;
          
          // Send call signal to target user
          if (targetUserId) {
            sendToUser(targetUserId, {
              type: 'call',
              payload: {
                type,
                action,
                chatId,
                fromUserId: ws.userId,
                offer,
                answer,
                candidate,
              }
            });
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', async () => {
      if (ws.userId) {
        console.log(`WebSocket for user ${ws.userId} closed`);
        clients.delete(ws.userId);
        
        // Update user's online status
        await storage.updateUserOnlineStatus(ws.userId, false);
        
        // Broadcast offline status to other users
        broadcastToAll({
          type: 'user_offline',
          payload: { userId: ws.userId }
        }, ws.userId);
      }
    });
    
    // Send ping to keep the connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  });
}

export function sendToUser(userId: string, message: WebSocketMessage) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    try {
      client.send(JSON.stringify(message));
      console.log(`Message sent to user ${userId}:`, message.type);
    } catch (error) {
      console.error(`Error sending message to user ${userId}:`, error);
    }
  } else {
    console.warn(`User ${userId} is not connected or WebSocket is not open. Client exists: ${!!client}, ReadyState: ${client?.readyState}`);
  }
}

// Export function to broadcast message to specific user (used from routes.ts)
export function broadcastMessageToChatParticipants(userId: string, message: WebSocketMessage) {
  sendToUser(userId, message);
}

function broadcastToAll(message: WebSocketMessage, excludeUserId?: string) {
  clients.forEach((client, userId) => {
    if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
