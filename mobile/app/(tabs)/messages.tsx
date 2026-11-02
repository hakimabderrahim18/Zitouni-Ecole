import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Send, User, CheckCheck, Clock, Search } from 'lucide-react-native';
import { theme } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/store/useAuthStore';

interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
  isRead: boolean;
}

export default function MessagesScreen() {
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: 'school_admin',
      text: 'السلام عليكم ورحمة الله، نود تذكيركم بموعد اللقاء التربوي الدوري لأولياء التلاميذ نهاية هذا الأسبوع.',
      time: '08:30',
      isRead: true,
    },
    {
      id: '2',
      senderId: user?.id || 'me',
      text: 'وعليكم السلام ورحمة الله، تم استلام التبليغ وسأكون حاضراً بإذن الله في الموعد المحدد.',
      time: '08:34',
      isRead: true,
    },
    {
      id: '3',
      senderId: 'school_admin',
      text: 'بارك الله فيكم. يمكنكم الاطلاع على بطاقة التقييم الأسبوعية للتلميذ عبر تبويب الملف الشخصي.',
      time: '08:36',
      isRead: true,
    },
  ]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: user?.id || 'me',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.container}
    >
      {/* Contact Header Card */}
      <View style={styles.contactBar}>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>إدارة المدرسة — الشؤون التربوية</Text>
          <View style={styles.statusIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>متصل الآن عبر المنصة</Text>
          </View>
        </View>
        <View style={styles.avatarCrest}>
          <Text style={styles.avatarCrestText}>إم</Text>
        </View>
      </View>

      {/* Messages Bubbles: STRICT OPPOSITE SIDES */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isMe = item.senderId === (user?.id || 'me');

          return (
            <View
              style={[
                styles.bubbleRow,
                isMe ? styles.rowMe : styles.rowOther, // Opposite sides
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
                  {item.text}
                </Text>

                <View style={styles.metaRow}>
                  {isMe && (
                    <CheckCheck size={12} color={theme.colors.gold[300]} />
                  )}
                  <Text
                    style={[
                      styles.timeText,
                      isMe ? styles.timeMe : styles.timeOther,
                    ]}
                  >
                    {item.time}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Bottom Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim()}
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
        >
          <Send size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="اكتب رسالتك التربوية هنا..."
          placeholderTextColor={theme.colors.text.subtle}
          style={styles.textInput}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.background, // Beige Crème #F3E9DC
  },
  contactBar: {
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
    color: theme.colors.brand[500], // Bordeaux #7B1E3A
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
  },
  avatarCrestText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  list: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  bubbleRow: {
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    width: '100%',
  },
  // My messages on the right
  rowMe: {
    justifyContent: 'flex-end',
  },
  // Other party messages on the left
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    ...theme.shadows.card,
  },
  // Prestige Bordeaux for sender
  bubbleMe: {
    backgroundColor: theme.colors.brand[500], // #7B1E3A
    borderBottomRightRadius: 2,
  },
  // Warm Card Cream for receiver
  bubbleOther: {
    backgroundColor: theme.colors.surface.card, // #FCF8F2
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderBottomLeftRadius: 2,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  textMe: {
    color: '#FFFFFF',
  },
  textOther: {
    color: theme.colors.text.primary, // #2B2022
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 6,
  },
  timeText: {
    fontSize: 10,
  },
  timeMe: {
    color: theme.colors.gold[100],
  },
  timeOther: {
    color: theme.colors.text.subtle,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface.card, // #FCF8F2
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: theme.colors.surface.input, // #FAF4EB
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text.primary,
    textAlign: 'right',
    fontSize: 13,
  },
  sendButton: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.brand[500], // Bordeaux #7B1E3A
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
