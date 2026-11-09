import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';

let socket: Socket | null = null;
let currentRegisteredUserId: string | null = null;

export const getSocket = (): Socket | null => socket;

export const connectSocket = (userId?: string): Socket => {
  if (socket?.connected) {
    if (userId && userId !== currentRegisteredUserId) {
      currentRegisteredUserId = userId;
      socket.emit('register_user', String(userId));
    }
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const socketUrl = API_BASE_URL;

  socket = io(socketUrl, {
    transports: ['websocket', 'polling'],
    path: '/socket.io',
    reconnection: true,
    reconnectionAttempts: 25,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('[Mobile Socket] Connected to', socketUrl, 'socketId:', socket?.id);
    const targetUid = userId || currentRegisteredUserId;
    if (targetUid) {
      currentRegisteredUserId = targetUid;
      socket?.emit('register_user', String(targetUid));
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[Mobile Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.warn('[Mobile Socket] Connection error:', error.message);
  });

  if (userId) {
    currentRegisteredUserId = userId;
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentRegisteredUserId = null;
  }
};

export const joinConversationRoom = (senderId: string, receiverId: string) => {
  if (!senderId || !receiverId) return;
  const s = socket || connectSocket(senderId);
  if (s.connected) {
    s.emit('join_conversation', {
      senderId: String(senderId),
      receiverId: String(receiverId),
    });
  } else {
    s.once('connect', () => {
      s.emit('join_conversation', {
        senderId: String(senderId),
        receiverId: String(receiverId),
      });
    });
  }
};

export const leaveConversationRoom = (senderId: string, receiverId: string) => {
  if (!senderId || !receiverId) return;
  if (socket?.connected) {
    socket.emit('leave_conversation', {
      senderId: String(senderId),
      receiverId: String(receiverId),
    });
  }
};

export const joinGroupChannelRoom = (channelId: string) => {
  if (!channelId) return;
  const s = socket || connectSocket();
  if (s.connected) {
    s.emit('join_group_channel', String(channelId));
  } else {
    s.once('connect', () => {
      s.emit('join_group_channel', String(channelId));
    });
  }
};

export const leaveGroupChannelRoom = (channelId: string) => {
  if (!channelId) return;
  if (socket?.connected) {
    socket.emit('leave_group_channel', String(channelId));
  }
};
