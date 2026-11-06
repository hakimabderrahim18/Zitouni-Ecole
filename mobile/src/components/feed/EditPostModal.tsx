import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Edit3, Pin, Lock, Check } from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { theme } from '../../theme/tokens';
import { PostItem } from './types';

interface EditPostModalProps {
  visible: boolean;
  post: PostItem | null;
  onClose: () => void;
  onPostUpdated: (updatedPost: PostItem) => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  visible,
  post,
  onClose,
  onPostUpdated,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [commentsLocked, setCommentsLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setContent(post.content || '');
      setIsPinned(!!post.isPinned);
      setCommentsLocked(!!post.commentsLocked);
    }
  }, [post]);

  const handleSubmit = async () => {
    if (!post) return;
    if (!title.trim() || !content.trim()) {
      Alert.alert('تنبيه', 'يرجى ملء عنوان المنشور ومحتواه أولاً.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.put(`/api/posts/${post._id}`, {
        title: title.trim(),
        content: content.trim(),
        isPinned,
        commentsLocked,
      });

      Alert.alert('نجاح', 'تم تحديث المنشور بنجاح.');
      if (res.data?.post) {
        onPostUpdated(res.data.post);
      }
      onClose();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تحديث المنشور');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible || !post) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerTitle}>تعديل المنشور</Text>
              <Text style={styles.headerSubtitle}>تحديث البيانات والمحتوى للجمهور المستهدف</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>عنوان المنشور *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                textAlign="right"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>نص المنشور *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
                textAlign="right"
                textAlignVertical="top"
              />
            </View>

            {/* Checkboxes */}
            <View style={styles.checkboxGroup}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsPinned(!isPinned)}
                activeOpacity={0.8}
              >
                <View style={[styles.customCheck, isPinned && styles.customCheckActive]}>
                  {isPinned && <Check size={14} color="#fff" />}
                </View>
                <View style={styles.checkTexts}>
                  <Text style={styles.checkTitle}>تثبيت في أعلى الصفحة</Text>
                  <Text style={styles.checkSub}>إبقاء المنشور في مقدمة الصفحة</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setCommentsLocked(!commentsLocked)}
                activeOpacity={0.8}
              >
                <View style={[styles.customCheck, commentsLocked && styles.customCheckActive]}>
                  {commentsLocked && <Check size={14} color="#fff" />}
                </View>
                <View style={styles.checkTexts}>
                  <Text style={styles.checkTitle}>إغلاق التعليقات والردود</Text>
                  <Text style={styles.checkSub}>منع إضافة تعليقات جديدة</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>حفظ التعديلات</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FDFBF7',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(243, 233, 220, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.3)',
  },
  headerTitleGroup: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.brand[500],
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 11,
    color: theme.colors.text.muted,
    marginTop: 2,
    textAlign: 'right',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
  },
  scrollContent: {
    padding: 18,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.brand[500],
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.colors.text.primary,
  },
  textArea: {
    minHeight: 120,
  },
  checkboxGroup: {
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.25)',
    borderRadius: 16,
    padding: 14,
  },
  checkboxRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
  },
  customCheck: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: theme.colors.gold[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  customCheckActive: {
    backgroundColor: theme.colors.brand[500],
    borderColor: theme.colors.brand[500],
  },
  checkTexts: {
    flex: 1,
    alignItems: 'flex-end',
  },
  checkTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.brand[500],
    textAlign: 'right',
  },
  checkSub: {
    fontSize: 10,
    color: theme.colors.text.muted,
    marginTop: 2,
    textAlign: 'right',
  },
  bottomActions: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: theme.colors.brand[500],
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F3E9DC',
  },
  cancelBtn: {
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
});
