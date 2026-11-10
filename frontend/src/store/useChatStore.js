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
    if (get().socket?.connected) return;

    if (get().socket) {
      get().socket.disconnect();
    }

    set({ isConnecting: true });
    const backendUrl =
      import.meta.env.VITE_API_URL ||
      (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? 'https://zitouni-ecole.onrender.com'
        : '');

    const socket = io(backendUrl || '/', {
      transports: ['websocket', 'polling'],
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      if (userId) {
        socket.emit('register_user', String(userId));
      }
      // Re-join active direct conversation if any
      const activePartner = get().activeChatPartner;
      if (activePartner && userId) {
        socket.emit('join_conversation', {
          senderId: String(userId),
          receiverId: String(activePartner._id || activePartner.id),
        });
      }
      // Re-join active group channel if any
      const activeGroup = get().activeGroup;
      if (activeGroup?.channelId) {
        socket.emit('join_group_channel', String(activeGroup.channelId));
      }
      set({ socket, isConnecting: false });
    });

    socket.on('receive_direct_message', (message) => {
      const activePartner = get().activeChatPartner;
      const msgSenderId = String(message.sender?._id || message.sender || '');
      const msgReceiverId = String(message.receiver?._id || message.receiver || '');
      const partnerId = String(activePartner?._id || activePartner?.id || '');

      if (
        get().chatMode === 'direct' &&
        activePartner &&
        (msgSenderId === partnerId || msgReceiverId === partnerId)
      ) {
        set((state) => {
          if (state.messages.some((m) => String(m._id) === String(message._id))) return {};
          return { messages: [...state.messages, message] };
        });
      }
      get().fetchConversations();
    });

    socket.on('receive_group_message', (message) => {
      const activeGroup = get().activeGroup;
      const groupChannelId = String(message.groupChannelId || '');
      const currentChannelId = String(activeGroup?.channelId || '');

      if (
        get().chatMode === 'group' &&
        activeGroup &&
        groupChannelId === currentChannelId
      ) {
        set((state) => {
          if (state.messages.some((m) => String(m._id) === String(message._id))) return {};
          return { messages: [...state.messages, message] };
        });
      }
      get().fetchGroups();
    });

    socket.on('message_reaction_updated', ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          String(m._id) === String(messageId) ? { ...m, reactions } : m
        ),
      }));
    });

    socket.on('message_seen_updated', ({ messageId, seenBy, readAt }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          String(m._id) === String(messageId)
            ? { ...m, seenBy, status: 'read', isRead: true, readAt }
            : m
        ),
      }));
    });

    socket.on('conversation_messages_seen', ({ readerId, readAt }) => {
      set((state) => ({
        messages: state.messages.map((m) => {
          const sId = String(m.sender?._id || m.sender);
          if (sId !== String(readerId)) {
            return { ...m, isRead: true, status: 'read', readAt };
          }
          return m;
        }),
      }));
    });

    socket.on('group_messages_seen', ({ channelId, readerId, seenAt }) => {
      set((state) => ({
        messages: state.messages.map((m) => {
          if (m.conversationType === 'group' && String(m.groupChannelId) === String(channelId)) {
            const seenList = m.seenBy || [];
            if (!seenList.some((s) => String(s.user?._id || s.user) === String(readerId))) {
              return {
                ...m,
                seenBy: [...seenList, { user: readerId, seenAt }],
              };
            }
          }
          return m;
        }),
      }));
    });

    socket.on('message_moderated', ({ messageId, isHidden, isDeleted, content }) => {
      set((state) => ({
        messages: state.messages.map((m) => {
          if (String(m._id) !== String(messageId)) return m;
          const updated = { ...m };
          if (typeof isHidden === 'boolean') updated.isHidden = isHidden;
          if (typeof isDeleted === 'boolean') updated.isDeleted = isDeleted;
          if (content) updated.content = content;
          return updated;
        }),
      }));
    });

    socket.on('group_channel_created', () => {
      get().fetchGroups();
    });

    socket.on('group_channel_updated', () => {
      get().fetchGroups();
    });

    socket.on('group_channel_deleted', ({ channelId }) => {
      get().fetchGroups();
      if (get().activeGroup?.channelId === channelId) {
        set({ activeGroup: null, messages: [] });
      }
    });

    socket.on('new_notification', (notification) => {
      useNotificationStore.getState().addNotification(notification);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      set({ isConnecting: false });
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
    const prevPartner = get().activeChatPartner;
    const socket = get().socket;
    const currentUser = JSON.parse(localStorage.getItem('zitouni_user') || '{}');
    const currentUserId = currentUser.id || currentUser._id;

    if (socket && prevPartner && currentUserId) {
      socket.emit('leave_conversation', {
        senderId: String(currentUserId),
        receiverId: String(prevPartner._id || prevPartner.id),
      });
    }

    set({ activeChatPartner: partner, activeGroup: null, chatMode: 'direct', messages: [] });
    if (partner) {
      get().fetchMessageHistory(partner._id || partner.id);
      if (socket && currentUserId) {
        socket.emit('join_conversation', {
          senderId: String(currentUserId),
          receiverId: String(partner._id || partner.id),
        });
      }
    }
  },

  setActiveGroup: (group) => {
    const prevGroup = get().activeGroup;
    const socket = get().socket;

    if (socket && prevGroup?.channelId) {
      socket.emit('leave_group_channel', String(prevGroup.channelId));
    }

    set({ activeGroup: group, activeChatPartner: null, chatMode: 'group', messages: [] });
    if (group?.channelId) {
      get().fetchGroupMessages(group.channelId);
      if (socket) {
        socket.emit('join_group_channel', String(group.channelId));
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

  createGroupChannel: async (groupData) => {
    try {
      const response = await axios.post('/api/messages/groups', groupData);
      get().fetchGroups();
      return response.data;
    } catch (error) {
      console.error('Error creating group channel:', error);
      throw error;
    }
  },

  updateGroupChannel: async (channelId, groupData) => {
    try {
      const response = await axios.put(`/api/messages/groups/${channelId}`, groupData);
      get().fetchGroups();
      return response.data;
    } catch (error) {
      console.error('Error updating group channel:', error);
      throw error;
    }
  },

  deleteGroupChannel: async (channelId) => {
    try {
      const response = await axios.delete(`/api/messages/groups/${channelId}`);
      get().fetchGroups();
      if (get().activeGroup?.channelId === channelId) {
        set({ activeGroup: null, messages: [] });
      }
      return response.data;
    } catch (error) {
      console.error('Error deleting group channel:', error);
      throw error;
    }
  },
}));
