import { create } from 'zustand';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useNotificationStore } from './useNotificationStore';

export const useChatStore = create((set, get) => ({
  socket: null,
  activeChatPartner: null,
  activeGroup: null,
  chatMode: 'direct', // 'direct' | 'group'
  conversations: [],
  contacts: [],
  groups: [],
  messages: [],
  isConnecting: false,

  connectSocket: (userId) => {
    if (get().socket) return;

    set({ isConnecting: true });
    const socket = io('/', {
      transports: ['polling', 'websocket'],
      path: '/socket.io',
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      socket.emit('register_user', userId);
      set({ socket, isConnecting: false });
    });

    socket.on('receive_direct_message', (message) => {
      const activePartner = get().activeChatPartner;
      if (
        get().chatMode === 'direct' &&
        activePartner &&
        (message.sender === activePartner._id || message.receiver === activePartner._id)
      ) {
        set((state) => {
          if (state.messages.some((m) => m._id === message._id)) return {};
          return { messages: [...state.messages, message] };
        });
      }
      get().fetchConversations();
    });

    socket.on('receive_group_message', (message) => {
      const activeGroup = get().activeGroup;
      if (
        get().chatMode === 'group' &&
        activeGroup &&
        message.groupChannelId === activeGroup.channelId
      ) {
        set((state) => {
          if (state.messages.some((m) => m._id === message._id)) return {};
          return { messages: [...state.messages, message] };
        });
      }
      get().fetchGroups();
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

  setChatMode: (mode) => {
    set({ chatMode: mode });
  },

  setActiveChatPartner: (partner) => {
    set({ activeChatPartner: partner, activeGroup: null, chatMode: 'direct', messages: [] });
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

  setActiveGroup: (group) => {
    set({ activeGroup: group, activeChatPartner: null, chatMode: 'group', messages: [] });
    if (group) {
      get().fetchGroupMessages(group.channelId);
      const socket = get().socket;
      if (socket) {
        socket.emit('join_group_channel', group.channelId);
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

  fetchGroups: async () => {
    try {
      const response = await axios.get('/api/messages/groups');
      set({ groups: response.data });
    } catch (error) {
      console.error('Error fetching group channels:', error);
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

  fetchGroupMessages: async (channelId) => {
    try {
      const response = await axios.get(`/api/messages/groups/${channelId}`);
      set({ messages: response.data });
    } catch (error) {
      console.error('Error fetching group messages:', error);
    }
  },

  sendDirectMessage: async (receiverId, content, attachmentUrl = '', attachmentName = '', mediaType = 'none', replyTo = null) => {
    try {
      const response = await axios.post('/api/messages', {
        receiverId,
        content,
        attachmentUrl,
        attachmentName,
        mediaType,
        replyTo,
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

  sendGroupMessage: async (channelId, content, attachmentUrl = '', attachmentName = '', groupInfo = {}, mediaType = 'none', replyTo = null) => {
    try {
      const response = await axios.post(`/api/messages/groups/${channelId}`, {
        content,
        attachmentUrl,
        attachmentName,
        mediaType,
        replyTo,
        groupTitle: groupInfo.title || '',
        groupType: groupInfo.groupType || 'class',
        classId: groupInfo.classId || undefined,
      });

      const message = response.data;
      set((state) => {
        if (state.messages.some((m) => m._id === message._id)) return {};
        return { messages: [...state.messages, message] };
      });

      get().fetchGroups();
    } catch (error) {
      console.error('Error sending group message:', error);
    }
  },

  reactToMessage: async (messageId, emoji) => {
    try {
      const response = await axios.post(`/api/messages/${messageId}/react`, { emoji });
      set((state) => ({
        messages: state.messages.map((m) => (m._id === messageId ? { ...m, reactions: response.data.reactions } : m)),
      }));
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  },

  markMessageSeen: async (messageId) => {
    try {
      const response = await axios.post(`/api/messages/${messageId}/seen`);
      set((state) => ({
        messages: state.messages.map((m) => (m._id === messageId ? { ...m, seenBy: response.data.seenBy, status: 'read' } : m)),
      }));
    } catch (error) {
      console.error('Error marking message seen:', error);
    }
  },

  toggleHideMessage: async (messageId) => {
    try {
      const response = await axios.patch(`/api/messages/${messageId}/hide`);
      set((state) => ({
        messages: state.messages.map((m) => (m._id === messageId ? { ...m, isHidden: response.data.isHidden } : m)),
      }));
    } catch (error) {
      console.error('Error toggling hide message:', error);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axios.delete(`/api/messages/${messageId}`);
      set((state) => ({
        messages: state.messages.map((m) => (m._id === messageId ? { ...m, isDeleted: true, content: 'تم حذف هذه الرسالة' } : m)),
      }));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  },
}));
