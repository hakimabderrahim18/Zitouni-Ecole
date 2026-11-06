import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import {
  Edit3,
  EyeOff,
  Eye,
  Pin,
  Lock,
  Unlock,
  Trash2,
  X,
} from 'lucide-react-native';
import { theme } from '../../theme/tokens';
import { PostItem } from './types';

interface PostOptionsMenuModalProps {
  visible: boolean;
  post: PostItem | null;
  onClose: () => void;
  onEdit: (post: PostItem) => void;
  onToggleHide: (post: PostItem) => void;
  onTogglePin: (post: PostItem) => void;
  onToggleLockComments: (post: PostItem) => void;
  onDelete: (post: PostItem) => void;
}

export const PostOptionsMenuModal: React.FC<PostOptionsMenuModalProps> = ({
  visible,
  post,
  onClose,
  onEdit,
  onToggleHide,
  onTogglePin,
  onToggleLockComments,
  onDelete,
}) => {
  if (!visible || !post) return null;

  const handleDeleteConfirm = () => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا المنشور نهائياً من الشبكة المدرسية؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائياً',
          style: 'destructive',
          onPress: () => {
            onClose();
            onDelete(post);
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.titleGroup}>
                  <Text style={styles.title}>خيارات وإدارة المنشور</Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {post.title}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={18} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Action Buttons */}
              <View style={styles.actionsList}>
                {/* 1. Edit */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onEdit(post);
                  }}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: 'rgba(201, 162, 77, 0.15)' }]}>
                    <Edit3 size={18} color={theme.colors.gold[700]} />
                  </View>
                  <View style={styles.actionTextGroup}>
                    <Text style={styles.actionLabel}>تعديل المنشور</Text>
                    <Text style={styles.actionDesc}>تحديث العنوان، المحتوى أو الخيارات</Text>
                  </View>
                </TouchableOpacity>

                {/* 2. Hide / Unhide */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onToggleHide(post);
                  }}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: 'rgba(217, 119, 6, 0.15)' }]}>
                    {post.isHidden ? (
                      <Eye size={18} color="#D97706" />
                    ) : (
                      <EyeOff size={18} color="#D97706" />
                    )}
                  </View>
                  <View style={styles.actionTextGroup}>
                    <Text style={styles.actionLabel}>
                      {post.isHidden ? 'إلغاء الإخفاء (إظهار للجميع)' : 'إخفاء المنشور عن المستخدمين'}
                    </Text>
                    <Text style={styles.actionDesc}>
                      {post.isHidden ? 'سيعود المنشور مرئياً لكافة الفئات المستهدفة' : 'حجب المنشور مؤقتاً وحصره على الإدارة فقط'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 3. Pin / Unpin */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onTogglePin(post);
                  }}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: 'rgba(201, 162, 77, 0.15)' }]}>
                    <Pin size={18} color={theme.colors.gold[600]} />
                  </View>
                  <View style={styles.actionTextGroup}>
                    <Text style={styles.actionLabel}>
                      {post.isPinned ? 'إلغاء التثبيت من الأعلى' : 'تثبيت في أعلى الصفحة (منشور رئيسي)'}
                    </Text>
                    <Text style={styles.actionDesc}>
                      {post.isPinned ? 'إرجاع المنشور للترتيب الزمني العادي' : 'إبقاء المنشور ظاهراً في المقدمة لكل المعنيين'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 4. Lock / Unlock Comments */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onToggleLockComments(post);
                  }}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: post.commentsLocked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(225, 29, 72, 0.12)' }]}>
                    {post.commentsLocked ? (
                      <Unlock size={18} color="#059669" />
                    ) : (
                      <Lock size={18} color="#E11D48" />
                    )}
                  </View>
                  <View style={styles.actionTextGroup}>
                    <Text style={styles.actionLabel}>
                      {post.commentsLocked ? 'فتح التعليقات والردود' : 'إغلاق وحظر التعليقات'}
                    </Text>
                    <Text style={styles.actionDesc}>
                      {post.commentsLocked ? 'السماح للجمهور بالمشاركة والتعليق مجدداً' : 'منع الردود العامة لحفظ رسمية الإعلان'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* 5. Delete Permanently */}
                <TouchableOpacity
                  style={[styles.actionItem, styles.deleteItem]}
                  onPress={handleDeleteConfirm}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: 'rgba(225, 29, 72, 0.15)' }]}>
                    <Trash2 size={18} color="#BE123C" />
                  </View>
                  <View style={styles.actionTextGroup}>
                    <Text style={[styles.actionLabel, { color: '#BE123C' }]}>
                      حذف المنشور نهائياً
                    </Text>
                    <Text style={styles.actionDesc}>
                      حذف المنشور وكافة التعليقات والمرفقات بشكل لا رجعة فيه
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FDFBF7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleGroup: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.brand[500],
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.text.muted,
    marginTop: 2,
    textAlign: 'right',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(201, 162, 77, 0.2)',
    marginVertical: 10,
  },
  actionsList: {
    gap: 8,
  },
  actionItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(243, 233, 220, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.2)',
    gap: 12,
  },
  deleteItem: {
    backgroundColor: 'rgba(255, 228, 230, 0.5)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextGroup: {
    flex: 1,
    alignItems: 'flex-end',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
  actionDesc: {
    fontSize: 10,
    color: theme.colors.text.muted,
    marginTop: 2,
    textAlign: 'right',
  },
});
