const socketIO = require('socket.io');
const Message = require('../models/message.model');

let io;
const activeUsers = new Map(); // userId -> socketId

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register user ID with socket ID
    socket.on('register_user', (userId) => {
      activeUsers.set(userId, socket.id);
      socket.join(userId); // Join user-specific room for notifications
      console.log(`User ${userId} registered to socket ${socket.id}`);
    });

    // Real-time Chat: joining a specific conversational thread room
    socket.on('join_conversation', ({ senderId, receiverId }) => {
      const room = [senderId, receiverId].sort().join('_');
      socket.join(room);
      console.log(`Socket ${socket.id} joined conversation room: ${room}`);
    });

    // Handle incoming direct message
    socket.on('send_direct_message', async ({ senderId, receiverId, content, attachmentUrl, attachmentName }) => {
      try {
        const room = [senderId, receiverId].sort().join('_');
        
        // Save to DB
        const message = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content: content || '',
          attachmentUrl: attachmentUrl || '',
          attachmentName: attachmentName || '',
        });

        // Broadcast within room
        io.to(room).emit('receive_direct_message', message);

        // Also notify recipient using persistent notifications
        try {
          const { notifyForMessage } = require('../services/notification.service');
          await notifyForMessage(message);
        } catch (notifyErr) {
          console.error('Failed to notify for message:', notifyErr);
        }
      } catch (err) {
        console.error('Error sending socket message:', err);
      }
    });

    // Broadcast notifications (global or level specific)
    socket.on('send_announcement_notification', ({ title, isGlobal, targetClass, targetGroup }) => {
      if (isGlobal) {
        io.emit('new_announcement', { title, isGlobal: true });
      } else {
        // Broadcasters can trigger level specific broadcasts
        io.emit('new_announcement', { title, isGlobal: false, targetClass, targetGroup });
      }
    });

    socket.on('disconnect', () => {
      for (let [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };
