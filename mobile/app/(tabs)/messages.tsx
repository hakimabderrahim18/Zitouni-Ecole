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
  ScrollView,
  Image,
} from 'react-native';
import {
  Send,
  User,
  CheckCheck,
  Clock,
  Search,
  MessageSquare,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { theme } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/store/useAuthStore';
import { apiClient } from '../../src/api/client';
import { DashboardHeader } from '../../src/components/DashboardHeader';
import { NavigationDrawer } from '../../src/components/NavigationDrawer';
import { useRouter } from 'expo-router';

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePic?: string;
  email?: string;
  phoneNumber?: string;
}

interface MessageItem {
  _id: string;
  sender: {
    _id: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    profilePic?: string;
  } | string;
  receiver: {
    _id: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    profilePic?: string;
  } | string;
  content: string;
  createdAt: string;
  isRead?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير المؤسسة',
  school: 'إدارة المدرسة',
  teacher: 'أستاذ',
  general_supervisor: 'مراقب عام',
  pedagogical_supervisor: 'مشرف تربوي',
  receptionist: 'موظف الاستقبال',
  parent: 'ولي أمر',
  student: 'تلميذ',
};

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const currentUserId = user?.id || (user as any)?._id || '';

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [contactSearch, setContactSearch] = useState('');

  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch live contacts from MongoDB
  const fetchContacts = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/messages/contacts');
      const data: Contact[] = Array.isArray(res.data) ? res.data : [];
      setContacts(data);

      // Select first contact if none selected
      if (data.length > 0 && !selectedContact) {
        setSelectedContact(data[0]);
      }
    } catch (err: any) {
      console.warn('Could not load contacts:', err.message);
    } finally {
      setLoadingContacts(false);
    }
  }, [selectedContact]);

  // 2. Fetch live messages history with selected contact
  const fetchMessages = useCallback(async (contactId: string) => {
    if (!contactId) return;
    setLoadingMessages(true);
    try {
      const res = await apiClient.get(`/api/messages/history/${contactId}`);
      const data: MessageItem[] = Array.isArray(res.data) ? res.data : [];
      setMessages(data);
    } catch (err: any) {
      console.warn('Could not load message history:', err.message);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    if (selectedContact?._id) {
      fetchMessages(selectedContact._id);
    }
  }, [selectedContact, fetchMessages]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedContact?._id) {
      await Promise.all([fetchContacts(), fetchMessages(selectedContact._id)]);
    } else {
      await fetchContacts();
    }
    setRefreshing(false);
  };

  // 3. Send message to database
  const handleSend = async () => {
    if (!inputText.trim() || !selectedContact?._id || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const res = await apiClient.post('/api/messages', {
        receiverId: selectedContact._id,
        content: text,
      });

      const newMsg = res.data;
      if (newMsg) {
        setMessages((prev) => [...prev, newMsg]);
      } else {
        await fetchMessages(selectedContact._id);
      }
    } catch (err: any) {
      console.warn('Send message failed:', err.message);
      // Restore input text on error
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  // Filtered contacts list
  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return contacts;
    const q = contactSearch.toLowerCase();
    return contacts.filter((c) => {
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      const roleText = (ROLE_LABELS[c.role] || c.role).toLowerCase();
      return name.includes(q) || roleText.includes(q);
    });
  }, [contacts, contactSearch]);

  const selectedContactName = selectedContact
    ? `${selectedContact.firstName} ${selectedContact.lastName}`
    : 'اختر جهة اتصال';
  const selectedContactRole = selectedContact
    ? ROLE_LABELS[selectedContact.role] || selectedContact.role
    : '';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.container}
    >
      {/* 1. Header */}
      <DashboardHeader onOpenDrawer={() => setIsDrawerOpen(true)} />

      {/* 2. Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeId="messages"
        onSelect={(id) => {
          setIsDrawerOpen(false);
          router.push('/(tabs)');
        }}
      />

      {/* 3. Horizontal Contacts Bar (Real database contacts) */}
      <View style={styles.contactsBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.contactsScroll}
        >
          {loadingContacts ? (
            <ActivityIndicator size="small" color={theme.colors.brand[500]} />
          ) : contacts.length === 0 ? (
            <Text style={styles.noContactsText}>لا توجد جهات اتصال متاحة</Text>
          ) : (
            filteredContacts.map((contact) => {
              const isSelected = selectedContact?._id === contact._id;
              const initials = `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}` || 'م';

              return (
                <TouchableOpacity
                  key={contact._id}
                  onPress={() => setSelectedContact(contact)}
                  style={[
                    styles.contactPill,
                    isSelected && styles.contactPillActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.pillAvatar}>
                    {contact.profilePic ? (
                      <Image source={{ uri: contact.profilePic }} style={styles.pillAvatarImg} />
                    ) : (
                      <Text style={styles.pillAvatarText}>{initials}</Text>
                    )}
                  </View>
                  <View style={styles.pillInfo}>
                    <Text
                      style={[
                        styles.pillName,
                        isSelected && styles.pillNameActive,
                      ]}
                      numberOfLines={1}
                    >
                      {contact.firstName} {contact.lastName}
                    </Text>
                    <Text
                      style={[
                        styles.pillRole,
                        isSelected && styles.pillRoleActive,
                      ]}
                      numberOfLines={1}
                    >
                      {ROLE_LABELS[contact.role] || contact.role}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* 4. Active Contact Bar */}
      {selectedContact && (
        <View style={styles.activeContactHeader}>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{selectedContactName}</Text>
            <View style={styles.statusIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>{selectedContactRole} — متصل عبر المنصة</Text>
            </View>
          </View>
          <View style={styles.avatarCrest}>
            {selectedContact.profilePic ? (
              <Image source={{ uri: selectedContact.profilePic }} style={styles.crestImg} />
            ) : (
              <Text style={styles.avatarCrestText}>
                {`${selectedContact.firstName?.[0] || ''}${selectedContact.lastName?.[0] || ''}`}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* 5. Messages Chat Feed */}
      {loadingMessages ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={theme.colors.brand[500]} />
          <Text style={styles.loadingFeedText}>جاري استرجاع المحادثة من الخادم...</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item._id || String(Math.random())}
          contentContainerStyle={styles.list}
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
              <Text style={styles.emptyTitle}>المحادثة فارغة</Text>
              <Text style={styles.emptySubtitle}>
                ابدأ المحادثة التربوية الآن مع {selectedContactName} عبر إرسال رسالة أدناه.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const senderId =
              typeof item.sender === 'object' && item.sender !== null
                ? item.sender._id
                : String(item.sender);
            const isMe = senderId === currentUserId;

            const timeStr = item.createdAt
              ? new Date(item.createdAt).toLocaleTimeString('ar-DZ', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <View
                style={[
                  styles.bubbleRow,
                  isMe ? styles.rowMe : styles.rowOther,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isMe ? styles.bubbleMe : styles.bubbleOther,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      isMe ? styles.textMe : styles.textOther,
                    ]}
                  >
                    {item.content}
                  </Text>

                  <View style={styles.metaRow}>
                    {isMe && <CheckCheck size={12} color={theme.colors.gold[300]} />}
                    <Text
                      style={[
                        styles.timeText,
                        isMe ? styles.timeMe : styles.timeOther,
                      ]}
                    >
                      {timeStr}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* 6. Bottom Input Area */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.background,
  },
  contactsBarContainer: {
    backgroundColor: theme.colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
    paddingVertical: 8,
  },
  contactsScroll: {
    paddingHorizontal: theme.spacing.md,
    gap: 8,
    alignItems: 'center',
  },
  noContactsText: {
    fontSize: 12,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
  },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface.background,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
  },
  contactPillActive: {
    backgroundColor: theme.colors.brand[500],
    borderColor: theme.colors.brand[500],
  },
  pillAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pillAvatarImg: {
    width: '100%',
    height: '100%',
  },
  pillAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  pillInfo: {
    alignItems: 'flex-start',
  },
  pillName: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  pillNameActive: {
    color: '#FFFFFF',
  },
  pillRole: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
  pillRoleActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  activeContactHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  contactInfo: {
    alignItems: 'flex-end',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: theme.colors.status.success,
  },
  statusText: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
  avatarCrest: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.gold[500],
    overflow: 'hidden',
  },
  crestImg: {
    width: '100%',
    height: '100%',
  },
  avatarCrestText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingFeedText: {
    marginTop: theme.spacing.md,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.muted,
  },
  list: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  bubbleRow: {
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    width: '100%',
  },
  rowMe: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    ...theme.shadows.card,
  },
  bubbleMe: {
    backgroundColor: theme.colors.brand[500],
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
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
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  timeMe: {
    color: theme.colors.gold[200],
  },
  timeOther: {
    color: theme.colors.text.muted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
    gap: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.surface.input,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: theme.radii.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
