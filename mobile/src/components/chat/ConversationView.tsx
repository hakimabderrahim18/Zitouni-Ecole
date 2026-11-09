import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Send,
  User,
  CheckCheck,
  Check,
  Search,
  MessageSquare,
  Users,
  Layers,
  ArrowRight,
  GraduationCap,
  ShieldAlert,
  Clock,
  Sparkles,
  Phone,
  RefreshCw,
  X,
  CornerDownLeft,
  Smile,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Edit3,
} from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { theme } from '../../theme/tokens';
import {
  connectSocket,
  joinConversationRoom,
  leaveConversationRoom,
  joinGroupChannelRoom,
  leaveGroupChannelRoom,
} from '../../services/socket';

export interface ChatUser {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePic?: string;
  phoneNumber?: string;
  email?: string;
}

export interface ConversationItem {
  user: ChatUser;
  lastMessage: string;
  lastUpdated: string;
  lastStatus?: string;
  unreadCount?: number;
}

export interface GroupItem {
  channelId: string;
  title: string;
  groupType: string;
  description?: string;
  targetAudience?: string[];
  isDefault?: boolean;
  classId?: any;
  groupId?: any;
  lastMessage?: string;
  lastUpdated?: string;
  unreadCount?: number;
}

export interface MessageItem {
  _id: string;
  sender:
    | {
        _id: string;
        firstName?: string;
        lastName?: string;
        role?: string;
        profilePic?: string;
      }
    | string;
  receiver?:
    | {
        _id: string;
        firstName?: string;
        lastName?: string;
        role?: string;
        profilePic?: string;
      }
    | string;
  groupChannelId?: string;
  content: string;
  createdAt: string;
  isRead?: boolean;
  status?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  mediaType?: string;
  isHidden?: boolean;
  isDeleted?: boolean;
  reactions?: any[];
  seenBy?: any[];
  readAt?: string;
  replyTo?: {
    _id: string;
    content?: string;
    sender?: {
      _id?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
    };
  } | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير المؤسسة',
  school: 'الإدارة العامة',
  teacher: 'أستاذ(ة)',
  general_supervisor: 'مراقب عام',
  pedagogical_supervisor: 'مشرف تربوي',
  receptionist: 'موظف الاستقبال',
  parent: 'ولي أمر',
  student: 'تلميذ(ة)',
};

interface ConversationViewProps {
  onBackToOverview?: () => void;
  initialPartnerId?: string;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  onBackToOverview,
  initialPartnerId,
}) => {
  const { user } = useAuthStore();
  const currentUserId = user?.id || (user as any)?._id || '';

  // Tab State: 'conversations' | 'groups' | 'contacts'
  const [activeTab, setActiveTab] = useState<'conversations' | 'groups' | 'contacts'>('conversations');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Target for Active Chat
  const [activePartner, setActivePartner] = useState<ChatUser | null>(null);
  const [activeGroup, setActiveGroup] = useState<GroupItem | null>(null);

  // Data Collections
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [contacts, setContacts] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);

  // Loading States
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Input State
  const [inputText, setInputText] = useState('');

  // User privileges & Message Actions State
  const currentUserRole = user?.role || '';
  const isPrivileged = ['admin', 'school', 'general_supervisor', 'pedagogical_supervisor'].includes(
    currentUserRole
  );
  const [activeActionsMsgId, setActiveActionsMsgId] = useState<string | null>(null);
  const [showEmojiPickerMsgId, setShowEmojiPickerMsgId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<MessageItem | null>(null);

  // Message Action Handlers
  const handleReactToMessage = async (messageId: string, emoji: string) => {
    try {
      const res = await apiClient.post(`/api/messages/${messageId}/react`, { emoji });
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(messageId) ? { ...m, reactions: res.data.reactions } : m
        )
      );
      setShowEmojiPickerMsgId(null);
      setActiveActionsMsgId(null);
    } catch (err: any) {
      console.warn('Failed to react:', err.message);
    }
  };

  const handleToggleHideMessage = async (messageId: string) => {
    try {
      const res = await apiClient.patch(`/api/messages/${messageId}/hide`);
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(messageId) ? { ...m, isHidden: res.data.isHidden } : m
        )
      );
      setActiveActionsMsgId(null);
    } catch (err: any) {
      console.warn('Failed to toggle hide message:', err.message);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const executeDelete = async () => {
      try {
        await apiClient.delete(`/api/messages/${messageId}`);
        setMessages((prev) =>
          prev.map((m) =>
            String(m._id) === String(messageId)
              ? { ...m, isDeleted: true, content: 'تم حذف هذه الرسالة من قبل الإدارة' }
              : m
          )
        );
        setActiveActionsMsgId(null);
      } catch (err: any) {
        console.warn('Failed to delete message:', err.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
        executeDelete();
      }
    } else {
      Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذه الرسالة نهائياً؟', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  // Group Management State (Creation & Edition Modals)
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [editGroupModalVisible, setEditGroupModalVisible] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<GroupItem | null>(null);

  const [groupFormTitle, setGroupFormTitle] = useState('');
  const [groupFormDesc, setGroupFormDesc] = useState('');
  const [groupFormAudience, setGroupFormAudience] = useState<string[]>(['all']);
  const [groupFormType, setGroupFormType] = useState('custom'); // 'custom' | 'class' | 'class_group' | 'class_parents'
  const [groupFormClassId, setGroupFormClassId] = useState('');
  const [groupFormGroupId, setGroupFormGroupId] = useState('');
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [availableClassGroups, setAvailableClassGroups] = useState<any[]>([]);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);

  // Messages FlatList ref for reliable auto-scrolling
  const flatListRef = React.useRef<FlatList>(null);

  useEffect(() => {
    if (isPrivileged) {
      apiClient.get('/api/admin/classes')
        .then((r) => Array.isArray(r.data) && setAvailableClasses(r.data))
        .catch(() => {});
      apiClient.get('/api/admin/groups')
        .then((r) => Array.isArray(r.data) && setAvailableClassGroups(r.data))
        .catch(() => {});
    }
  }, [isPrivileged]);

  const openCreateGroup = () => {
    setGroupFormType('custom');
    setGroupFormClassId('');
    setGroupFormGroupId('');
    setGroupFormTitle('');
    setGroupFormDesc('');
    setGroupFormAudience(['all']);
    setCreateGroupModalVisible(true);
  };

  const openEditGroup = (group: GroupItem) => {
    setSelectedGroupForEdit(group);
    setGroupFormType(group.groupType || 'custom');
    setGroupFormClassId(group.classId?._id || group.classId || '');
    setGroupFormGroupId(group.groupId?._id || group.groupId || '');
    setGroupFormTitle(group.title || '');
    setGroupFormDesc(group.description || '');
    setGroupFormAudience(
      Array.isArray(group.targetAudience) && group.targetAudience.length > 0
        ? group.targetAudience
        : ['all']
    );
    setEditGroupModalVisible(true);
  };

  const handleSelectClass = (cId: string) => {
    setGroupFormClassId(cId);
    setGroupFormGroupId('');
    const cls = availableClasses.find((c) => String(c._id) === String(cId));
    if (cls) {
      if (groupFormType === 'class') {
        setGroupFormTitle(`مجموعة قسم: ${cls.name}`);
        setGroupFormDesc(`قناة التواصل والمتابعة الأكاديمية لقسم ${cls.name}`);
      } else if (groupFormType === 'class_parents') {
        setGroupFormTitle(`أولياء أمور قسم: ${cls.name}`);
        setGroupFormDesc(`قناة التواصل مع أولياء تلاميذ قسم ${cls.name}`);
      }
    }
  };

  const handleSelectClassGroup = (gId: string) => {
    setGroupFormGroupId(gId);
    const grp = availableClassGroups.find((g) => String(g._id) === String(gId));
    const cls = availableClasses.find((c) => String(c._id) === String(groupFormClassId));
    if (grp) {
      const clsName = cls ? cls.name : (grp.class?.name || '');
      setGroupFormTitle(`فوج: ${grp.name} - ${clsName}`);
      setGroupFormDesc(`قناة العمل والأنشطة الخاصة بفوج ${grp.name}`);
    }
  };

  const toggleAudienceTag = (tag: string) => {
    if (tag === 'all') {
      setGroupFormAudience(['all']);
      return;
    }
    setGroupFormAudience((prev) => {
      const filtered = prev.filter((t) => t !== 'all');
      if (filtered.includes(tag)) {
        const next = filtered.filter((t) => t !== tag);
        return next.length === 0 ? ['all'] : next;
      } else {
        return [...filtered, tag];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupFormTitle.trim() || isSubmittingGroup) return;
    setIsSubmittingGroup(true);
    try {
      await apiClient.post('/api/messages/groups', {
        title: groupFormTitle.trim(),
        description: groupFormDesc.trim(),
        targetAudience: groupFormAudience,
        groupType: groupFormType,
        classId: groupFormClassId || undefined,
        groupId: groupFormGroupId || undefined,
      });
      setCreateGroupModalVisible(false);
      setGroupFormTitle('');
      setGroupFormDesc('');
      setGroupFormClassId('');
      setGroupFormGroupId('');
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'فشل إنشاء المجموعة.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('خطأ', msg);
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroupForEdit || !groupFormTitle.trim() || isSubmittingGroup) return;
    setIsSubmittingGroup(true);
    try {
      await apiClient.put(`/api/messages/groups/${selectedGroupForEdit.channelId}`, {
        title: groupFormTitle.trim(),
        description: groupFormDesc.trim(),
        targetAudience: groupFormAudience,
        groupType: groupFormType,
        classId: groupFormClassId || undefined,
        groupId: groupFormGroupId || undefined,
      });
      setEditGroupModalVisible(false);
      setSelectedGroupForEdit(null);
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'فشل تحديث المجموعة.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('خطأ', msg);
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const handleDeleteGroup = (channelId: string, groupTitle?: string) => {
    const executeDelete = async () => {
      try {
        await apiClient.delete(`/api/messages/groups/${channelId}`);
        setGroups((prev) => prev.filter((g) => g.channelId !== channelId));
        if (activeGroup?.channelId === channelId) {
          closeChatThread();
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || 'فشل حذف المجموعة.';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('خطأ', msg);
      }
    };

    const confirmMsg = `هل أنت متأكد من حذف مجموعة "${groupTitle || 'هذه المجموعة'}" نهائياً؟`;
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        executeDelete();
      }
    } else {
      Alert.alert('تأكيد الحذف', confirmMsg, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  // 1. Fetch Conversations, Groups, and Contacts
  const fetchData = useCallback(async () => {
    try {
      const [convRes, grpRes, contRes] = await Promise.all([
        apiClient.get('/api/messages/conversations').catch(() => ({ data: [] })),
        apiClient.get('/api/messages/groups').catch(() => ({ data: [] })),
        apiClient.get('/api/messages/contacts').catch(() => ({ data: [] })),
      ]);

      const convList: ConversationItem[] = Array.isArray(convRes.data) ? convRes.data : [];
      const grpList: GroupItem[] = Array.isArray(grpRes.data) ? grpRes.data : [];
      const contList: ChatUser[] = Array.isArray(contRes.data) ? contRes.data : [];

      setConversations(convList);
      setGroups(grpList);
      setContacts(contList);

      // Handle initial partner if requested
      if (initialPartnerId && !activePartner && !activeGroup) {
        const found = contList.find((c) => c._id === initialPartnerId);
        if (found) {
          setActivePartner(found);
        }
      }
    } catch (err: any) {
      console.warn('Error loading chat data:', err.message);
    } finally {
      setLoadingData(false);
    }
  }, [initialPartnerId, activePartner, activeGroup]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Fetch Messages History when partner or group is selected
  const fetchMessagesHistory = useCallback(async () => {
    if (activePartner?._id) {
      setLoadingMessages(true);
      try {
        const res = await apiClient.get(`/api/messages/history/${activePartner._id}`);
        const data: MessageItem[] = Array.isArray(res.data) ? res.data : [];
        setMessages(data);
      } catch (err: any) {
        console.warn('Could not fetch direct messages history:', err.message);
      } finally {
        setLoadingMessages(false);
      }
    } else if (activeGroup?.channelId) {
      setLoadingMessages(true);
      try {
        const res = await apiClient.get(`/api/messages/groups/${activeGroup.channelId}`);
        const data: MessageItem[] = Array.isArray(res.data) ? res.data : [];
        setMessages(data);
      } catch (err: any) {
        console.warn('Could not fetch group messages history:', err.message);
      } finally {
        setLoadingMessages(false);
      }
    } else {
      setMessages([]);
    }
  }, [activePartner, activeGroup]);

  useEffect(() => {
    fetchMessagesHistory();
  }, [fetchMessagesHistory]);

  // Real-time: Join/Leave direct conversation room
  useEffect(() => {
    if (activePartner?._id && currentUserId) {
      joinConversationRoom(currentUserId, activePartner._id);
      return () => {
        leaveConversationRoom(currentUserId, activePartner._id);
      };
    }
  }, [activePartner?._id, currentUserId]);

  // Real-time: Join/Leave group channel room
  useEffect(() => {
    if (activeGroup?.channelId) {
      joinGroupChannelRoom(activeGroup.channelId);
      return () => {
        leaveGroupChannelRoom(activeGroup.channelId);
      };
    }
  }, [activeGroup?.channelId]);

  // Real-time Socket Event Listeners
  useEffect(() => {
    if (!currentUserId) return;
    const socket = connectSocket(currentUserId);

    const handleReceiveDirectMessage = (newMsg: any) => {
      const msgSenderId = String(newMsg.sender?._id || newMsg.sender || '');
      const msgReceiverId = String(newMsg.receiver?._id || newMsg.receiver || '');
      const currentActivePartnerId = String(activePartner?._id || '');

      // 1. If currently in the direct chat with this person, append message
      if (
        currentActivePartnerId &&
        (msgSenderId === currentActivePartnerId || msgReceiverId === currentActivePartnerId)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(newMsg._id))) return prev;
          return [...prev, newMsg];
        });

        // Mark as seen immediately if we received it
        if (msgSenderId === currentActivePartnerId && newMsg._id) {
          apiClient.post(`/api/messages/${newMsg._id}/seen`).catch(() => {});
        }
      }

      // 2. Update conversations list in real-time
      setConversations((prev) => {
        const otherUserId = msgSenderId === String(currentUserId) ? msgReceiverId : msgSenderId;
        const exists = prev.some((c) => String(c.user?._id) === otherUserId);

        if (exists) {
          return prev
            .map((c) => {
              if (String(c.user?._id) === otherUserId) {
                const isCurrentlyOpen = currentActivePartnerId === otherUserId;
                return {
                  ...c,
                  lastMessage: newMsg.content || (newMsg.attachmentUrl ? 'مرفق' : ''),
                  lastUpdated: newMsg.createdAt || new Date().toISOString(),
                  unreadCount: isCurrentlyOpen
                    ? 0
                    : (c.unreadCount || 0) + (msgSenderId !== String(currentUserId) ? 1 : 0),
                };
              }
              return c;
            })
            .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        } else {
          apiClient
            .get('/api/messages/conversations')
            .then((r) => Array.isArray(r.data) && setConversations(r.data))
            .catch(() => {});
          return prev;
        }
      });
    };

    const handleReceiveGroupMessage = (newMsg: any) => {
      const groupChannelId = String(newMsg.groupChannelId || '');
      const currentActiveGroupId = String(activeGroup?.channelId || '');

      if (currentActiveGroupId && groupChannelId === currentActiveGroupId) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(newMsg._id))) return prev;
          return [...prev, newMsg];
        });
      }

      setGroups((prev) =>
        prev
          .map((g) => {
            if (String(g.channelId) === groupChannelId) {
              return {
                ...g,
                lastMessage: newMsg.content || (newMsg.attachmentUrl ? 'مرفق' : ''),
                lastUpdated: newMsg.createdAt || new Date().toISOString(),
              };
            }
            return g;
          })
          .sort((a, b) => new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime())
      );
    };

    const handleReactionUpdated = ({ messageId, reactions }: any) => {
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(messageId) ? { ...m, reactions } : m))
      );
    };

    const handleSeenUpdated = ({ messageId, seenBy, readAt }: any) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(messageId)
            ? { ...m, seenBy, isRead: true, status: 'read', readAt }
            : m
        )
      );
    };

    const handleMessageModerated = ({ messageId, isHidden, isDeleted, content }: any) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (String(m._id) !== String(messageId)) return m;
          const updated = { ...m };
          if (typeof isHidden === 'boolean') updated.isHidden = isHidden;
          if (typeof isDeleted === 'boolean') updated.isDeleted = isDeleted;
          if (content) updated.content = content;
          return updated;
        })
      );
    };

    const handleGroupCreated = () => {
      fetchData();
    };
    const handleGroupUpdated = () => {
      fetchData();
    };
    const handleGroupDeleted = ({ channelId }: any) => {
      fetchData();
      if (activeGroup?.channelId === channelId) {
        closeChatThread();
      }
    };

    const handleConversationMessagesSeen = ({ readerId, readAt }: any) => {
      setMessages((prev) =>
        prev.map((m) => {
          const sId = typeof m.sender === 'object' ? m.sender?._id : m.sender;
          if (String(sId) !== String(readerId)) {
            return { ...m, isRead: true, status: 'read', readAt };
          }
          return m;
        })
      );
    };

    const handleGroupMessagesSeen = ({ channelId, readerId, seenAt }: any) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.groupChannelId === channelId) {
            const seenList = m.seenBy || [];
            if (!seenList.some((s) => String(s.user?._id || s.user) === String(readerId))) {
              return {
                ...m,
                seenBy: [...seenList, { user: readerId, seenAt }],
              };
            }
          }
          return m;
        })
      );
    };

    socket.on('receive_direct_message', handleReceiveDirectMessage);
    socket.on('receive_group_message', handleReceiveGroupMessage);
    socket.on('message_reaction_updated', handleReactionUpdated);
    socket.on('message_seen_updated', handleSeenUpdated);
    socket.on('conversation_messages_seen', handleConversationMessagesSeen);
    socket.on('group_messages_seen', handleGroupMessagesSeen);
    socket.on('message_moderated', handleMessageModerated);
    socket.on('group_channel_created', handleGroupCreated);
    socket.on('group_channel_updated', handleGroupUpdated);
    socket.on('group_channel_deleted', handleGroupDeleted);

    return () => {
      socket.off('receive_direct_message', handleReceiveDirectMessage);
      socket.off('receive_group_message', handleReceiveGroupMessage);
      socket.off('message_reaction_updated', handleReactionUpdated);
      socket.off('message_seen_updated', handleSeenUpdated);
      socket.off('conversation_messages_seen', handleConversationMessagesSeen);
      socket.off('group_messages_seen', handleGroupMessagesSeen);
      socket.off('message_moderated', handleMessageModerated);
      socket.off('group_channel_created', handleGroupCreated);
      socket.off('group_channel_updated', handleGroupUpdated);
      socket.off('group_channel_deleted', handleGroupDeleted);
    };
  }, [currentUserId, activePartner?._id, activeGroup?.channelId]);

  // Reliable auto-scroll to bottom on opening a conversation & on message updates
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 40);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages, activePartner?._id, activeGroup?.channelId]);

  // Automatically mark incoming messages as seen when reading a conversation
  useEffect(() => {
    if (messages.length > 0 && currentUserId && (activePartner?._id || activeGroup?.channelId)) {
      messages.forEach((msg) => {
        const sId = typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
        if (sId && String(sId) !== String(currentUserId)) {
          const alreadySeen = (msg as any).seenBy?.some(
            (s: any) => String(s.user?._id || s.user) === String(currentUserId)
          );
          if (!alreadySeen) {
            apiClient.post(`/api/messages/${msg._id}/seen`).catch(() => {});
          }
        }
      });
    }
  }, [messages, currentUserId, activePartner?._id, activeGroup?.channelId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchMessagesHistory()]);
    setRefreshing(false);
  };

  // 3. Send Message Handler
  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;
    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      if (activePartner?._id) {
        const res = await apiClient.post('/api/messages', {
          receiverId: activePartner._id,
          content: text,
          replyTo: replyingTo?._id || undefined,
        });
        setReplyingTo(null);
        if (res.data) {
          setMessages((prev) =>
            prev.some((m) => String(m._id) === String(res.data._id)) ? prev : [...prev, res.data]
          );
        } else {
          await fetchMessagesHistory();
        }
        // Refresh conversations list in background
        apiClient.get('/api/messages/conversations').then((r) => {
          if (Array.isArray(r.data)) setConversations(r.data);
        }).catch(() => {});
      } else if (activeGroup?.channelId) {
        const res = await apiClient.post(`/api/messages/groups/${activeGroup.channelId}`, {
          content: text,
          groupTitle: activeGroup.title || '',
          groupType: activeGroup.groupType || 'class',
          replyTo: replyingTo?._id || undefined,
        });
        setReplyingTo(null);
        if (res.data) {
          setMessages((prev) =>
            prev.some((m) => String(m._id) === String(res.data._id)) ? prev : [...prev, res.data]
          );
        } else {
          await fetchMessagesHistory();
        }
        // Refresh groups in background
        apiClient.get('/api/messages/groups').then((r) => {
          if (Array.isArray(r.data)) setGroups(r.data);
        }).catch(() => {});
      }
    } catch (err: any) {
      console.warn('Failed to send message:', err.message);
      setInputText(text); // Restore text on failure
    } finally {
      setIsSending(false);
    }
  };

  // Filtered lists according to search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const name = `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.toLowerCase();
      const lastMsg = (c.lastMessage || '').toLowerCase();
      return name.includes(q) || lastMsg.includes(q);
    });
  }, [conversations, searchQuery]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter((g) => {
      const title = (g.title || '').toLowerCase();
      const desc = (g.description || '').toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [groups, searchQuery]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter((c) => {
      const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
      const roleLabel = (ROLE_LABELS[c.role] || c.role).toLowerCase();
      return name.includes(q) || roleLabel.includes(q);
    });
  }, [contacts, searchQuery]);

  const closeChatThread = () => {
    setActivePartner(null);
    setActiveGroup(null);
    setMessages([]);
  };

  const getInitials = (first?: string, last?: string) => {
    const f = first?.[0] || '';
    const l = last?.[0] || '';
    return `${f}${l}` || 'م';
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // ===========================================================================
  // RENDER 1: ACTIVE CHAT THREAD (DIRECT OR GROUP)
  // ===========================================================================
  if (activePartner || activeGroup) {
    const title = activePartner
      ? `${activePartner.firstName} ${activePartner.lastName}`
      : activeGroup?.title || 'محادثة المجموعة';
    const subtitle = activePartner
      ? `${ROLE_LABELS[activePartner.role] || activePartner.role} • متصل عبر المنصة`
      : activeGroup?.description || 'مجموعة رسمية';

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.container}
      >
        {/* Active Chat Header with Back Button */}
        <View style={styles.activeHeaderBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={closeChatThread}
            activeOpacity={0.7}
          >
            <ArrowRight size={20} color={theme.colors.brand[500]} />
            <Text style={styles.backButtonText}>المحادثات</Text>
          </TouchableOpacity>

          <View style={styles.activeTitleContainer}>
            <Text style={styles.activeTitleText} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.activeSubtitleText} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshIconBtn}
            onPress={fetchMessagesHistory}
            disabled={loadingMessages}
            activeOpacity={0.7}
          >
            <RefreshCw
              size={18}
              color={theme.colors.text.secondary}
              style={loadingMessages ? { opacity: 0.5 } : {}}
            />
          </TouchableOpacity>
        </View>

        {/* Message Feed */}
        {loadingMessages ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={theme.colors.brand[500]} />
            <Text style={styles.loadingText}>جاري استرجاع الرسائل من الخادم...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item._id || `msg-${index}`}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
            onLayout={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.brand[500]}
                colors={[theme.colors.brand[500]]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MessageSquare size={44} color={theme.colors.brand[300]} />
                <Text style={styles.emptyTitle}>المحادثة جديدة</Text>
                <Text style={styles.emptySubtitle}>
                  ابدأ التواصل الأكاديمي الآن بإرسال رسالتك الأولى أدناه.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const senderId =
                typeof item.sender === 'object' && item.sender !== null
                  ? item.sender._id
                  : String(item.sender || '');
              const isMe = senderId === currentUserId;
              const senderName =
                typeof item.sender === 'object' && item.sender !== null
                  ? `${item.sender.firstName || ''} ${item.sender.lastName || ''}`.trim()
                  : '';

              const showActions = activeActionsMsgId === item._id;
              const showEmoji = showEmojiPickerMsgId === item._id;

              // Aggregate reaction counts
              const reactionCounts: Record<string, number> = {};
              (item.reactions || []).forEach((r: any) => {
                if (r?.emoji) {
                  reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
                }
              });
              const reactionEntries = Object.entries(reactionCounts);

              return (
                <View style={[styles.bubbleWrapper, isMe ? styles.wrapperMe : styles.wrapperOther]}>
                  {/* Floating Action Bar Pill (Matching user's screenshot: [Trash2] [EyeOff] [Smile] [CornerDownLeft]) */}
                  {showActions && !item.isDeleted && (
                    <View
                      style={[
                        styles.floatingActionBar,
                        isMe ? styles.actionBarMe : styles.actionBarOther,
                      ]}
                    >
                      {/* 1. Delete (Trash2) */}
                      {(isMe || isPrivileged) && (
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() => handleDeleteMessage(item._id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={16} color="#7B1E3A" />
                        </TouchableOpacity>
                      )}

                      {/* 2. Hide / Unhide (EyeOff) */}
                      {isPrivileged && (
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() => handleToggleHideMessage(item._id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          {item.isHidden ? (
                            <Eye size={16} color="#C9A24D" />
                          ) : (
                            <EyeOff size={16} color="#7B1E3A" />
                          )}
                        </TouchableOpacity>
                      )}

                      {/* 3. React (Smile) */}
                      <TouchableOpacity
                        style={[
                          styles.actionIconBtn,
                          showEmoji && styles.actionIconBtnActive,
                        ]}
                        onPress={() =>
                          setShowEmojiPickerMsgId(showEmoji ? null : item._id)
                        }
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Smile size={16} color="#C9A24D" />
                      </TouchableOpacity>

                      {/* 4. Reply (CornerDownLeft) */}
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => {
                          setReplyingTo(item);
                          setActiveActionsMsgId(null);
                          setShowEmojiPickerMsgId(null);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <CornerDownLeft size={16} color="#7B1E3A" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Emoji Picker row */}
                  {showEmoji && !item.isDeleted && (
                    <View
                      style={[
                        styles.emojiPickerPill,
                        isMe ? styles.actionBarMe : styles.actionBarOther,
                      ]}
                    >
                      {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                        <TouchableOpacity
                          key={emoji}
                          style={styles.emojiBtn}
                          onPress={() => handleReactToMessage(item._id, emoji)}
                        >
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      if (!item.isDeleted) {
                        setActiveActionsMsgId(showActions ? null : item._id);
                        setShowEmojiPickerMsgId(null);
                      }
                    }}
                    style={[styles.bubbleRow, isMe ? styles.rowMe : styles.rowOther]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        isMe ? styles.bubbleMe : styles.bubbleOther,
                        item.isHidden && styles.bubbleHidden,
                        item.isDeleted && styles.bubbleDeleted,
                      ]}
                    >
                      {/* Quoted Reply if message was a reply */}
                      {item.replyTo && (
                        <View
                          style={[
                            styles.quotedBox,
                            isMe ? styles.quotedBoxMe : styles.quotedBoxOther,
                          ]}
                        >
                          <Text style={styles.quotedAuthor} numberOfLines={1}>
                            {item.replyTo.sender?.firstName || 'مستخدم'}
                          </Text>
                          <Text style={styles.quotedText} numberOfLines={2}>
                            {item.replyTo.content || 'مرفق'}
                          </Text>
                        </View>
                      )}

                      {/* If group chat and not me, show sender name */}
                      {!isMe && !!activeGroup && !!senderName && (
                        <Text style={styles.senderHeaderName}>{senderName}</Text>
                      )}

                      <Text
                        style={[
                          styles.bubbleText,
                          isMe ? styles.textMe : styles.textOther,
                          item.isDeleted && styles.textDeleted,
                          item.isHidden && styles.textHidden,
                        ]}
                      >
                        {item.content}
                      </Text>

                      {item.isHidden && !item.isDeleted && (
                        <Text style={styles.hiddenNoticeText}>(مخفي للمراجعة الإدارية)</Text>
                      )}

                      <View style={styles.metaRow}>
                        {isMe && (
                          <CheckCheck
                            size={13}
                            color={
                              item.isRead || item.status === 'read'
                                ? '#38BDF8'
                                : theme.colors.gold[300]
                            }
                          />
                        )}
                        <Text style={[styles.timeText, isMe ? styles.timeMe : styles.timeOther]}>
                          {formatTime(item.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Reaction chips at bottom of bubble */}
                  {reactionEntries.length > 0 && (
                    <View
                      style={[
                        styles.reactionContainer,
                        isMe ? styles.reactionContainerMe : styles.reactionContainerOther,
                      ]}
                    >
                      {reactionEntries.map(([emoji, count]) => (
                        <View key={emoji} style={styles.reactionChip}>
                          <Text style={styles.reactionChipText}>
                            {emoji} {count > 1 ? count : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}

        {/* Reply Bar preview above input */}
        {replyingTo && (
          <View style={styles.replyingBar}>
            <View style={styles.replyingContent}>
              <CornerDownLeft size={14} color={theme.colors.brand[500]} />
              <Text style={styles.replyingText} numberOfLines={1}>
                الرد على{' '}
                <Text style={styles.replyingAuthor}>
                  {typeof replyingTo.sender === 'object'
                    ? `${replyingTo.sender.firstName || ''} ${replyingTo.sender.lastName || ''}`.trim() || 'المستخدم'
                    : 'المستخدم'}
                </Text>
                : {replyingTo.content || 'مرفق'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setReplyingTo(null)}
              style={styles.cancelReplyBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={15} color={theme.colors.text.muted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            activeOpacity={0.85}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="اكتب رسالتك التربوية هنا..."
            placeholderTextColor={theme.colors.text.subtle}
            style={styles.textInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ===========================================================================
  // RENDER 2: CONVERSATION HUB (CHATS, GROUPS, CONTACTS TABS)
  // ===========================================================================
  return (
    <View style={styles.container}>
      {/* 1. Header Banner & Sub-Tabs */}
      <View style={styles.hubHeader}>
        {/* Navigation Tabs (Conversations | Groups | Contacts) */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'conversations' && styles.tabButtonActive]}
            onPress={() => setActiveTab('conversations')}
            activeOpacity={0.8}
          >
            <MessageSquare
              size={16}
              color={activeTab === 'conversations' ? '#FFFFFF' : theme.colors.brand[700]}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'conversations' && styles.tabButtonTextActive,
              ]}
            >
              المحادثات ({conversations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'groups' && styles.tabButtonActive]}
            onPress={() => setActiveTab('groups')}
            activeOpacity={0.8}
          >
            <Layers
              size={16}
              color={activeTab === 'groups' ? '#FFFFFF' : theme.colors.brand[700]}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'groups' && styles.tabButtonTextActive]}
            >
              المجموعات ({groups.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'contacts' && styles.tabButtonActive]}
            onPress={() => setActiveTab('contacts')}
            activeOpacity={0.8}
          >
            <Users
              size={16}
              color={activeTab === 'contacts' ? '#FFFFFF' : theme.colors.brand[700]}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'contacts' && styles.tabButtonTextActive]}
            >
              جهات الاتصال ({contacts.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={16} color={theme.colors.text.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              activeTab === 'groups'
                ? 'ابحث في المجموعات والأفواج...'
                : activeTab === 'contacts'
                ? 'ابحث في قائمة الأساتذة والإدارة...'
                : 'ابحث في المحادثات النشطة...'
            }
            placeholderTextColor={theme.colors.text.subtle}
            style={styles.searchInput}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={theme.colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. Main Content Lists */}
      {loadingData ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={theme.colors.brand[500]} />
          <Text style={styles.loadingText}>جاري تحميل سجل المحادثات من السيرفر...</Text>
        </View>
      ) : activeTab === 'conversations' ? (
        // TAB 1: CONVERSATIONS LIST
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.user?._id || String(Math.random())}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.brand[500]}
              colors={[theme.colors.brand[500]]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MessageSquare size={44} color={theme.colors.brand[300]} />
              <Text style={styles.emptyTitle}>لا توجد محادثات نشطة</Text>
              <Text style={styles.emptySubtitle}>
                لم تبدأ محادثات مباشرة بعد. انتقل إلى تبويب "جهات الاتصال" لبدء مراسلة فورية.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setActiveTab('contacts')}
                activeOpacity={0.8}
              >
                <Users size={16} color="#FFFFFF" />
                <Text style={styles.emptyActionBtnText}>استعراض جهات الاتصال</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const partner = item.user;
            if (!partner) return null;
            const initials = getInitials(partner.firstName, partner.lastName);
            const roleLabel = ROLE_LABELS[partner.role] || partner.role;

            return (
              <TouchableOpacity
                style={styles.conversationCard}
                onPress={() => setActivePartner(partner)}
                activeOpacity={0.75}
              >
                <View style={styles.cardAvatar}>
                  {partner.profilePic ? (
                    <Image source={{ uri: partner.profilePic }} style={styles.cardAvatarImg} />
                  ) : (
                    <Text style={styles.cardAvatarText}>{initials}</Text>
                  )}
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {partner.firstName} {partner.lastName}
                    </Text>
                    <Text style={styles.cardTime}>{formatTime(item.lastUpdated)}</Text>
                  </View>

                  <View style={styles.cardRoleRow}>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{roleLabel}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBottomRow}>
                    <Text style={styles.lastMessageText} numberOfLines={1}>
                      {item.lastMessage || 'مرفق وسائط'}
                    </Text>

                    {Number(item.unreadCount) > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : activeTab === 'groups' ? (
        // TAB 2: GROUPS LIST
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.channelId || String(Math.random())}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.brand[500]}
              colors={[theme.colors.brand[500]]}
            />
          }
          ListHeaderComponent={
            isPrivileged ? (
              <TouchableOpacity
                style={styles.createGroupHeaderBtn}
                onPress={openCreateGroup}
                activeOpacity={0.85}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.createGroupHeaderBtnText}>إضافة مجموعة / قناة جديدة</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Layers size={44} color={theme.colors.brand[300]} />
              <Text style={styles.emptyTitle}>لا توجد مجموعات متاحة</Text>
              <Text style={styles.emptySubtitle}>
                لا توجد قنوات رسمية مسندة لحسابك حالياً.
              </Text>
              {isPrivileged && (
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={openCreateGroup}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.emptyActionBtnText}>إنشاء أول مجموعة الآن</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const isTeacherGrp = item.groupType === 'teachers';
            const isSupervisorGrp = item.groupType === 'supervisors';

            return (
              <TouchableOpacity
                style={styles.conversationCard}
                onPress={() => setActiveGroup(item)}
                activeOpacity={0.75}
              >
                <View style={styles.groupIconWrapper}>
                  {isTeacherGrp ? (
                    <GraduationCap size={22} color={theme.colors.brand[500]} />
                  ) : isSupervisorGrp ? (
                    <ShieldAlert size={22} color={theme.colors.gold[600]} />
                  ) : (
                    <Users size={22} color="#047857" />
                  )}
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {!!item.lastUpdated && (
                      <Text style={styles.cardTime}>{formatTime(item.lastUpdated)}</Text>
                    )}
                  </View>

                  <Text style={styles.groupDescText} numberOfLines={1}>
                    {item.lastMessage || item.description || 'مجموعة رسمية للمؤسسة'}
                  </Text>
                </View>

                {/* Administration Action Buttons (Edit, Delete) */}
                {isPrivileged && (
                  <View style={styles.groupCardActionGroup}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        openEditGroup(item);
                      }}
                      style={styles.groupCardActionBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Edit3 size={15} color={theme.colors.gold[600]} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(item.channelId, item.title);
                      }}
                      style={styles.groupCardActionBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={15} color="#BE123C" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        // TAB 3: CONTACTS DIRECTORY
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item._id || String(Math.random())}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.brand[500]}
              colors={[theme.colors.brand[500]]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={44} color={theme.colors.brand[300]} />
              <Text style={styles.emptyTitle}>لا توجد جهات اتصال</Text>
              <Text style={styles.emptySubtitle}>
                لم يتم العثور على أي حساب يطابق عملية البحث.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const initials = getInitials(item.firstName, item.lastName);
            const roleLabel = ROLE_LABELS[item.role] || item.role;

            return (
              <TouchableOpacity
                style={styles.contactCard}
                onPress={() => setActivePartner(item)}
                activeOpacity={0.75}
              >
                <View style={styles.cardAvatar}>
                  {item.profilePic ? (
                    <Image source={{ uri: item.profilePic }} style={styles.cardAvatarImg} />
                  ) : (
                    <Text style={styles.cardAvatarText}>{initials}</Text>
                  )}
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.firstName} {item.lastName}
                    </Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{roleLabel}</Text>
                    </View>
                  </View>

                  {!!item.phoneNumber && (
                    <View style={styles.phoneRow}>
                      <Phone size={12} color={theme.colors.text.muted} />
                      <Text style={styles.phoneText}>{item.phoneNumber}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.startChatBtn}>
                  <MessageSquare size={16} color={theme.colors.brand[500]} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* =========================================================================
          MODAL: CREATE GROUP CHANNEL (Administration)
      ========================================================================= */}
      <Modal
        visible={createGroupModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateGroupModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إضافة مجموعة / قناة جديدة</Text>
              <TouchableOpacity
                onPress={() => setCreateGroupModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>نوع المجموعة / القناة</Text>
              <View style={styles.audienceChipsContainer}>
                {[
                  { id: 'custom', label: 'مجموعة مخصصة' },
                  { id: 'class', label: 'قسم كامل' },
                  { id: 'class_group', label: 'فوج قسم' },
                  { id: 'class_parents', label: 'أولياء قسم' },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.audienceChip,
                      groupFormType === t.id && styles.audienceChipSelected,
                    ]}
                    onPress={() => {
                      setGroupFormType(t.id);
                      if (t.id === 'class_parents') setGroupFormAudience(['all']);
                    }}
                  >
                    <Text
                      style={[
                        styles.audienceChipText,
                        groupFormType === t.id && styles.audienceChipTextSelected,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {groupFormType !== 'custom' && (
                <>
                  <Text style={styles.inputLabel}>اختر القسم الدراسي *</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.classChipsScroll}
                  >
                    {availableClasses.map((cls) => {
                      const isSel = String(cls._id) === String(groupFormClassId);
                      return (
                        <TouchableOpacity
                          key={cls._id}
                          style={[
                            styles.audienceChip,
                            isSel && styles.audienceChipSelected,
                          ]}
                          onPress={() => handleSelectClass(cls._id)}
                        >
                          <Text
                            style={[
                              styles.audienceChipText,
                              isSel && styles.audienceChipTextSelected,
                            ]}
                          >
                            {cls.name} {cls.division ? `(${cls.division})` : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {groupFormType === 'class_group' && (
                <>
                  <Text style={styles.inputLabel}>اختر الفوج الدراسي *</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.classChipsScroll}
                  >
                    {availableClassGroups
                      .filter((g) => !groupFormClassId || String(g.class?._id || g.class) === String(groupFormClassId))
                      .map((grp) => {
                        const isSel = String(grp._id) === String(groupFormGroupId);
                        return (
                          <TouchableOpacity
                            key={grp._id}
                            style={[
                              styles.audienceChip,
                              isSel && styles.audienceChipSelected,
                            ]}
                            onPress={() => handleSelectClassGroup(grp._id)}
                          >
                            <Text
                              style={[
                                styles.audienceChipText,
                                isSel && styles.audienceChipTextSelected,
                              ]}
                            >
                              {grp.name} {grp.class?.name ? `(${grp.class.name})` : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>
                </>
              )}

              <Text style={styles.inputLabel}>اسم المجموعة *</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="مثال: إعلانات الإدارة والأساتذة"
                placeholderTextColor={theme.colors.text.muted}
                value={groupFormTitle}
                onChangeText={setGroupFormTitle}
                textAlign="right"
              />

              <Text style={styles.inputLabel}>وصف المجموعة (اختياري)</Text>
              <TextInput
                style={[styles.modalTextInput, styles.modalTextArea]}
                placeholder="اكتب نبذة أو هدف هذه المجموعة..."
                placeholderTextColor={theme.colors.text.muted}
                value={groupFormDesc}
                onChangeText={setGroupFormDesc}
                multiline
                numberOfLines={3}
                textAlign="right"
              />

              <Text style={styles.inputLabel}>الجمهور المستهدف</Text>
              <View style={styles.audienceChipsContainer}>
                {[
                  { id: 'all', label: 'الجميع' },
                  { id: 'teachers', label: 'الأساتذة' },
                  { id: 'students', label: 'الطلاب' },
                  { id: 'parents', label: 'أولياء الأمور' },
                  { id: 'supervisors', label: 'المشرفين والإدارة' },
                ].map((aud) => {
                  const isSelected = groupFormAudience.includes(aud.id);
                  return (
                    <TouchableOpacity
                      key={aud.id}
                      style={[
                        styles.audienceChip,
                        isSelected && styles.audienceChipSelected,
                      ]}
                      onPress={() => toggleAudienceTag(aud.id)}
                    >
                      <Text
                        style={[
                          styles.audienceChipText,
                          isSelected && styles.audienceChipTextSelected,
                        ]}
                      >
                        {aud.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCreateGroupModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  (!groupFormTitle.trim() || isSubmittingGroup) && styles.modalSubmitBtnDisabled,
                ]}
                onPress={handleCreateGroup}
                disabled={!groupFormTitle.trim() || isSubmittingGroup}
              >
                {isSubmittingGroup ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>إنشاء المجموعة</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* =========================================================================
          MODAL: EDIT GROUP CHANNEL (Administration)
      ========================================================================= */}
      <Modal
        visible={editGroupModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setEditGroupModalVisible(false);
          setSelectedGroupForEdit(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تعديل بيانات المجموعة</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditGroupModalVisible(false);
                  setSelectedGroupForEdit(null);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>نوع المجموعة / القناة</Text>
              <View style={styles.audienceChipsContainer}>
                {[
                  { id: 'custom', label: 'مجموعة مخصصة' },
                  { id: 'class', label: 'قسم كامل' },
                  { id: 'class_group', label: 'فوج قسم' },
                  { id: 'class_parents', label: 'أولياء قسم' },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.audienceChip,
                      groupFormType === t.id && styles.audienceChipSelected,
                    ]}
                    onPress={() => {
                      setGroupFormType(t.id);
                      if (t.id === 'class_parents') setGroupFormAudience(['all']);
                    }}
                  >
                    <Text
                      style={[
                        styles.audienceChipText,
                        groupFormType === t.id && styles.audienceChipTextSelected,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {groupFormType !== 'custom' && (
                <>
                  <Text style={styles.inputLabel}>اختر القسم الدراسي *</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.classChipsScroll}
                  >
                    {availableClasses.map((cls) => {
                      const isSel = String(cls._id) === String(groupFormClassId);
                      return (
                        <TouchableOpacity
                          key={cls._id}
                          style={[
                            styles.audienceChip,
                            isSel && styles.audienceChipSelected,
                          ]}
                          onPress={() => handleSelectClass(cls._id)}
                        >
                          <Text
                            style={[
                              styles.audienceChipText,
                              isSel && styles.audienceChipTextSelected,
                            ]}
                          >
                            {cls.name} {cls.division ? `(${cls.division})` : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {groupFormType === 'class_group' && (
                <>
                  <Text style={styles.inputLabel}>اختر الفوج الدراسي *</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.classChipsScroll}
                  >
                    {availableClassGroups
                      .filter((g) => !groupFormClassId || String(g.class?._id || g.class) === String(groupFormClassId))
                      .map((grp) => {
                        const isSel = String(grp._id) === String(groupFormGroupId);
                        return (
                          <TouchableOpacity
                            key={grp._id}
                            style={[
                              styles.audienceChip,
                              isSel && styles.audienceChipSelected,
                            ]}
                            onPress={() => handleSelectClassGroup(grp._id)}
                          >
                            <Text
                              style={[
                                styles.audienceChipText,
                                isSel && styles.audienceChipTextSelected,
                              ]}
                            >
                              {grp.name} {grp.class?.name ? `(${grp.class.name})` : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>
                </>
              )}

              <Text style={styles.inputLabel}>اسم المجموعة *</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="اسم المجموعة"
                placeholderTextColor={theme.colors.text.muted}
                value={groupFormTitle}
                onChangeText={setGroupFormTitle}
                textAlign="right"
              />

              <Text style={styles.inputLabel}>وصف المجموعة</Text>
              <TextInput
                style={[styles.modalTextInput, styles.modalTextArea]}
                placeholder="وصف المجموعة..."
                placeholderTextColor={theme.colors.text.muted}
                value={groupFormDesc}
                onChangeText={setGroupFormDesc}
                multiline
                numberOfLines={3}
                textAlign="right"
              />

              <Text style={styles.inputLabel}>الجمهور المستهدف</Text>
              <View style={styles.audienceChipsContainer}>
                {[
                  { id: 'all', label: 'الجميع' },
                  { id: 'teachers', label: 'الأساتذة' },
                  { id: 'students', label: 'الطلاب' },
                  { id: 'parents', label: 'أولياء الأمور' },
                  { id: 'supervisors', label: 'المشرفين والإدارة' },
                ].map((aud) => {
                  const isSelected = groupFormAudience.includes(aud.id);
                  return (
                    <TouchableOpacity
                      key={aud.id}
                      style={[
                        styles.audienceChip,
                        isSelected && styles.audienceChipSelected,
                      ]}
                      onPress={() => toggleAudienceTag(aud.id)}
                    >
                      <Text
                        style={[
                          styles.audienceChipText,
                          isSelected && styles.audienceChipTextSelected,
                        ]}
                      >
                        {aud.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setEditGroupModalVisible(false);
                  setSelectedGroupForEdit(null);
                }}
              >
                <Text style={styles.modalCancelBtnText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  (!groupFormTitle.trim() || isSubmittingGroup) && styles.modalSubmitBtnDisabled,
                ]}
                onPress={handleUpdateGroup}
                disabled={!groupFormTitle.trim() || isSubmittingGroup}
              >
                {isSubmittingGroup ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>حفظ التغييرات</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.background,
  },
  hubHeader: {
    backgroundColor: theme.colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  tabBar: {
    flexDirection: 'row-reverse',
    gap: 6,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.surface.background,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.brand[500],
    borderColor: theme.colors.brand[500],
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
  listContent: {
    padding: 12,
    gap: 8,
  },
  conversationCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    gap: 12,
  },
  contactCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    gap: 12,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(123, 30, 58, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    overflow: 'hidden',
  },
  cardAvatarImg: {
    width: '100%',
    height: '100%',
  },
  cardAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  groupIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'right',
    maxWidth: '70%',
  },
  cardTime: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
  cardRoleRow: {
    flexDirection: 'row-reverse',
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(123, 30, 58, 0.2)',
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  cardBottomRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessageText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    flex: 1,
  },
  groupDescText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: theme.colors.brand[500],
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  phoneRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  phoneText: {
    fontSize: 11,
    color: theme.colors.text.muted,
  },
  startChatBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123, 30, 58, 0.2)',
  },
  // Active Thread Styles
  activeHeaderBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  backButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
    borderRadius: 6,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  activeTitleContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  activeTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  activeSubtitleText: {
    fontSize: 10,
    color: theme.colors.text.muted,
    marginTop: 1,
  },
  refreshIconBtn: {
    padding: 6,
  },
  messagesList: {
    padding: 12,
    gap: 8,
  },
  bubbleWrapper: {
    marginVertical: 4,
    paddingHorizontal: 8,
    width: '100%',
  },
  wrapperMe: {
    alignItems: 'flex-start',
  },
  wrapperOther: {
    alignItems: 'flex-end',
  },
  floatingActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#C9A24D',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  actionBarMe: {
    alignSelf: 'flex-start',
  },
  actionBarOther: {
    alignSelf: 'flex-end',
  },
  actionIconBtn: {
    padding: 3,
  },
  actionIconBtnActive: {
    backgroundColor: 'rgba(201, 162, 77, 0.2)',
    borderRadius: 6,
  },
  emojiPickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emojiBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  emojiText: {
    fontSize: 16,
  },
  quotedBox: {
    borderRightWidth: 3,
    borderRightColor: '#C9A24D',
    paddingRight: 8,
    paddingLeft: 4,
    paddingVertical: 3,
    marginBottom: 6,
    borderRadius: 4,
  },
  quotedBoxMe: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  quotedBoxOther: {
    backgroundColor: 'rgba(201, 162, 77, 0.12)',
  },
  quotedAuthor: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C9A24D',
    textAlign: 'right',
  },
  quotedText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'right',
  },
  bubbleHidden: {
    opacity: 0.75,
    borderWidth: 1,
    borderColor: '#D97706',
  },
  bubbleDeleted: {
    opacity: 0.6,
  },
  textDeleted: {
    fontStyle: 'italic',
    color: '#94A3B8',
  },
  textHidden: {
    fontStyle: 'italic',
  },
  hiddenNoticeText: {
    fontSize: 9,
    color: '#D97706',
    marginTop: 2,
    textAlign: 'right',
  },
  reactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -4,
    marginBottom: 2,
  },
  reactionContainerMe: {
    alignSelf: 'flex-start',
    marginLeft: 6,
  },
  reactionContainerOther: {
    alignSelf: 'flex-end',
    marginRight: 6,
  },
  reactionChip: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#C9A24D',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  reactionChipText: {
    fontSize: 11,
  },
  replyingBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF9',
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 162, 77, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  replyingContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  replyingText: {
    fontSize: 11,
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
  replyingAuthor: {
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  cancelReplyBtn: {
    padding: 4,
  },
  bubbleRow: {
    width: '100%',
    flexDirection: 'row',
    marginVertical: 3,
  },
  rowMe: {
    justifyContent: 'flex-start',
  },
  rowOther: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  bubbleMe: {
    backgroundColor: theme.colors.brand[500],
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: theme.colors.surface.card,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  senderHeaderName: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.brand[500],
    marginBottom: 2,
    textAlign: 'right',
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
  },
  textMe: {
    color: '#FFFFFF',
  },
  textOther: {
    color: theme.colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  timeText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  timeMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeOther: {
    color: theme.colors.text.muted,
  },
  inputContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.surface.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 12,
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.brand[500],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  classChipsScroll: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  createGroupHeaderBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.brand[500],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: theme.colors.brand[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  createGroupHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  groupCardActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 6,
  },
  groupCardActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    marginBottom: 6,
    marginTop: 10,
    textAlign: 'right',
  },
  modalTextInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  audienceChipsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  audienceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  audienceChipSelected: {
    backgroundColor: theme.colors.brand[50],
    borderColor: theme.colors.brand[500],
  },
  audienceChipText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  audienceChipTextSelected: {
    color: theme.colors.brand[600],
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    gap: 12,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: theme.colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnDisabled: {
    opacity: 0.5,
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
