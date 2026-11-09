const socketIO = require('socket.io');
const Message = require('../models/message.model');

let io;
const activeUsers = new Map(); // userId -> socketId

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register user ID with socket ID and personal room
    socket.on('register_user', (userId) => {
      if (!userId) return;
      const uId = String(userId);
      activeUsers.set(uId, socket.id);
      socket.join(uId); // Join user-specific room for notifications & direct events
      console.log(`User ${uId} registered to socket ${socket.id}`);
    });

    // Real-time Chat: joining a specific conversational thread room
    socket.on('join_conversation', ({ senderId, receiverId }) => {
      if (!senderId || !receiverId) return;
      const room = [String(senderId), String(receiverId)].sort().join('_');
      socket.join(room);
      console.log(`Socket ${socket.id} joined conversation room: ${room}`);
    });

    socket.on('leave_conversation', ({ senderId, receiverId }) => {
      if (!senderId || !receiverId) return;
      const room = [String(senderId), String(receiverId)].sort().join('_');
      socket.leave(room);
    });

    // Real-time Chat: joining a school group channel room (Art. 18-19)
    socket.on('join_group_channel', (channelId) => {
      if (!channelId) return;
      socket.join(String(channelId));
      console.log(`Socket ${socket.id} joined group channel room: ${channelId}`);
    });

    socket.on('leave_group_channel', (channelId) => {
      if (!channelId) return;
      socket.leave(String(channelId));
    });

    // Handle incoming direct message via socket
    socket.on('send_direct_message', async ({ senderId, receiverId, content, attachmentUrl, attachmentName }) => {
      try {
        if (!senderId || !receiverId) return;
        const sId = String(senderId);
        const rId = String(receiverId);
        const room = [sId, rId].sort().join('_');
        
        // Save to DB
        const message = await Message.create({
          sender: sId,
          receiver: rId,
          content: content || '',
          attachmentUrl: attachmentUrl || '',
          attachmentName: attachmentName || '',
        });

        const populatedMsg = await Message.findById(message._id)
          .populate('sender', 'firstName lastName role profilePic')
          .populate('receiver', 'firstName lastName role profilePic');

        // Broadcast within room & individual user rooms
        io.to(room).emit('receive_direct_message', populatedMsg);
        io.to(rId).emit('receive_direct_message', populatedMsg);
        io.to(sId).emit('receive_direct_message', populatedMsg);

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
