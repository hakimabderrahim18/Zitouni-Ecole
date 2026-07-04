import { create } from 'zustand';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useNotificationStore } from './useNotificationStore';

export const useChatStore = create((set, get) => ({
  socket: null,
  activeChatPartner: null,
  conversations: [],
  contacts: [],
  messages: [],
  isConnecting: false,

  connectSocket: (userId) => {
    if (get().socket) return;

    set({ isConnecting: true });
    // Establish connection with the backend (VITE_API_URL in production,
    // proxied origin '/' in development).
    const socket = io(import.meta.env.VITE_API_URL || '/', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      socket.emit('register_user', userId);
      set({ socket, isConnecting: false });
    });

    socket.on('receive_direct_message', (message) => {
      const activePartner = get().activeChatPartner;
      if (activePartner && (message.sender === activePartner._id || message.receiver === activePartner._id)) {
        set((state) => {
          if (state.messages.some(m => m._id === message._id)) return {};
          return { messages: [...state.messages, message] };
        });
      }
      get().fetchConversations();
    });

    socket.on('new_notification', (notification) => {
      useNotificationStore.getState().addNotification(notification);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      set({ socket: null });
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  setActiveChatPartner: (partner) => {
    set({ activeChatPartner: partner, messages: [] });
    if (partner) {
      get().fetchMessageHistory(partner._id);
      const socket = get().socket;
      const currentUser = JSON.parse(localStorage.getItem('zitouni_user'));
      if (socket && currentUser) {
        socket.emit('join_conversation', {
          senderId: currentUser.id,
          receiverId: partner._id,
        });
      }
    }
  },

  fetchConversations: async () => {
    try {
      const response = await axios.get('/api/messages/conversations');
      set({ conversations: response.data });
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  },

  fetchContacts: async () => {
    try {
      const response = await axios.get('/api/messages/contacts');
      set({ contacts: response.data });
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  },

  fetchMessageHistory: async (partnerId) => {
    try {
      const response = await axios.get(`/api/messages/history/${partnerId}`);
      set({ messages: response.data });
    } catch (error) {
      console.error('Error fetching message history:', error);
    }
  },

  sendDirectMessage: async (receiverId, content, attachmentUrl = '', attachmentName = '') => {
    try {
      const response = await axios.post('/api/messages', {
        receiverId,
        content,
        attachmentUrl,
        attachmentName,
      });

      const message = response.data;
      set((state) => {
        if (state.messages.some((m) => m._id === message._id)) return {};
        return { messages: [...state.messages, message] };
      });

      get().fetchConversations();
    } catch (error) {
      console.error('Error sending direct message:', error);
    }
  },
}));
