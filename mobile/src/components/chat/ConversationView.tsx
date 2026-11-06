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
} from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { theme } from '../../theme/tokens';

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
        });
        if (res.data) {
          setMessages((prev) => [...prev, res.data]);
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
        });
        if (res.data) {
          setMessages((prev) => [...prev, res.data]);
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
            data={messages}
            keyExtractor={(item, index) => item._id || `msg-${index}`}
            contentContainerStyle={styles.messagesList}
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

              return (
                <View style={[styles.bubbleRow, isMe ? styles.rowMe : styles.rowOther]}>
                  <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                    {/* If group chat and not me, show sender name */}
                    {!isMe && !!activeGroup && !!senderName && (
                      <Text style={styles.senderHeaderName}>{senderName}</Text>
                    )}

                    <Text style={[styles.bubbleText, isMe ? styles.textMe : styles.textOther]}>
                      {item.content}
                    </Text>

                    <View style={styles.metaRow}>
                      {isMe && <CheckCheck size={13} color={theme.colors.gold[300]} />}
                      <Text style={[styles.timeText, isMe ? styles.timeMe : styles.timeOther]}>
                        {formatTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Layers size={44} color={theme.colors.brand[300]} />
              <Text style={styles.emptyTitle}>لا توجد مجموعات متاحة</Text>
              <Text style={styles.emptySubtitle}>
                لا توجد قنوات رسمية مسندة لحسابك حالياً.
              </Text>
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
});
