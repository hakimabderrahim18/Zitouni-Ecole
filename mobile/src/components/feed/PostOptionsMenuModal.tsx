import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
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
  AlertTriangle,
} from 'lucide-react-native';
import { theme } from '../../theme/tokens';
import { PostItem } from './types';

interface PostOptionsMenuModalProps {
  visible: boolean;
  post: PostItem | null;
  onClose: () => void;
  onEdit: (post: PostItem) => void;
  onToggleHide: (post: PostItem) => Promise<void> | void;
  onTogglePin: (post: PostItem) => Promise<void> | void;
  onToggleLockComments: (post: PostItem) => Promise<void> | void;
  onDelete: (post: PostItem) => Promise<void> | void;
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
  const [confirmDeleteMode, setConfirmDeleteMode] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (!visible || !post) return null;

  const handleEditPress = () => {
    onClose();
    setTimeout(() => {
      onEdit(post);
    }, 120);
  };

  const handleHidePress = async () => {
    setLoadingAction('hide');
    try {
      await onToggleHide(post);
    } finally {
      setLoadingAction(null);
      onClose();
    }
  };

  const handlePinPress = async () => {
    setLoadingAction('pin');
    try {
      await onTogglePin(post);
    } finally {
      setLoadingAction(null);
      onClose();
    }
  };

  const handleLockPress = async () => {
    setLoadingAction('lock');
    try {
      await onToggleLockComments(post);
    } finally {
      setLoadingAction(null);
      onClose();
    }
  };

  const handleDeletePress = async () => {
    if (!confirmDeleteMode) {
      if (Platform.OS === 'web') {
        const ok = window.confirm('هل أنت متأكد من حذف هذا المنشور نهائياً من قاعدة البيانات؟');
        if (ok) {
          setLoadingAction('delete');
          try {
            await onDelete(post);
          } finally {
            setLoadingAction(null);
            onClose();
          }
        }
      } else {
        setConfirmDeleteMode(true);
      }
      return;
    }

    setLoadingAction('delete');
    try {
      await onDelete(post);
    } finally {
      setLoadingAction(null);
      setConfirmDeleteMode(false);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop Touchable to dismiss when tapping outside */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Bottom Sheet Container */}
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
              <X size={20} color={theme.colors.brand[500]} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Action Buttons List */}
          <View style={styles.actionsList}>
            {/* 1. Edit Post */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleEditPress}
              activeOpacity={0.75}
            >
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(201, 162, 77, 0.2)' }]}>
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
              onPress={handleHidePress}
              disabled={!!loadingAction}
              activeOpacity={0.75}
            >
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(217, 119, 6, 0.18)' }]}>
                {loadingAction === 'hide' ? (
                  <ActivityIndicator size="small" color="#D97706" />
                ) : post.isHidden ? (
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
                  {post.isHidden
                    ? 'سيعود المنشور مرئياً لكافة الفئات المستهدفة'
                    : 'حجب المنشور مؤقتاً وحصره على الإدارة فقط'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 3. Pin / Unpin */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handlePinPress}
              disabled={!!loadingAction}
              activeOpacity={0.75}
            >
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(201, 162, 77, 0.2)' }]}>
                {loadingAction === 'pin' ? (
                  <ActivityIndicator size="small" color={theme.colors.gold[600]} />
                ) : (
                  <Pin size={18} color={theme.colors.gold[600]} />
                )}
              </View>
              <View style={styles.actionTextGroup}>
                <Text style={styles.actionLabel}>
                  {post.isPinned
                    ? 'إلغاء التثبيت من الأعلى'
                    : 'تثبيت في أعلى الصفحة (منشور رئيسي)'}
                </Text>
                <Text style={styles.actionDesc}>
                  {post.isPinned
                    ? 'إرجاع المنشور للترتيب الزمني العادي'
                    : 'إبقاء المنشور ظاهراً في المقدمة لكل المعنيين'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 4. Lock / Unlock Comments */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleLockPress}
              disabled={!!loadingAction}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.iconWrapper,
                  {
                    backgroundColor: post.commentsLocked
                      ? 'rgba(16, 185, 129, 0.18)'
                      : 'rgba(225, 29, 72, 0.15)',
                  },
                ]}
              >
                {loadingAction === 'lock' ? (
                  <ActivityIndicator size="small" color={post.commentsLocked ? '#059669' : '#E11D48'} />
                ) : post.commentsLocked ? (
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
                  {post.commentsLocked
                    ? 'السماح للجمهور بالمشاركة والتعليق مجدداً'
                    : 'منع الردود العامة لحفظ رسمية الإعلان'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* 5. Delete Permanently (with inline confirm safeguard) */}
            {confirmDeleteMode ? (
              <View style={styles.confirmDeleteBox}>
                <View style={styles.confirmDeleteTextRow}>
                  <AlertTriangle size={18} color="#BE123C" />
                  <Text style={styles.confirmDeleteTitle}>
                    هل أنت متأكد من رغبتك في حذف هذا المنشور؟
                  </Text>
                </View>
                <Text style={styles.confirmDeleteSub}>
                  سيتم حذف المنشور وكافة التعليقات والمرفقات نهائياً من قاعدة البيانات.
                </Text>
                <View style={styles.confirmDeleteBtnsRow}>
                  <TouchableOpacity
                    style={styles.finalDeleteBtn}
                    onPress={handleDeletePress}
                    disabled={!!loadingAction}
                  >
                    {loadingAction === 'delete' ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.finalDeleteBtnText}>نعم، احذف المنشور نهائياً</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelDeleteBtn}
                    onPress={() => setConfirmDeleteMode(false)}
                  >
                    <Text style={styles.cancelDeleteBtnText}>إلغاء</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.actionItem, styles.deleteItem]}
                onPress={handleDeletePress}
                disabled={!!loadingAction}
                activeOpacity={0.75}
              >
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(225, 29, 72, 0.18)' }]}>
                  {loadingAction === 'delete' ? (
                    <ActivityIndicator size="small" color="#BE123C" />
                  ) : (
                    <Trash2 size={18} color="#BE123C" />
                  )}
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
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  sheetContainer: {
    backgroundColor: '#FDFBF7',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    shadowColor: theme.colors.brand[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    backgroundColor: 'rgba(201, 162, 77, 0.25)',
    marginVertical: 10,
  },
  actionsList: {
    gap: 9,
  },
  actionItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(243, 233, 220, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.25)',
    gap: 12,
  },
  deleteItem: {
    backgroundColor: 'rgba(255, 228, 230, 0.55)',
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextGroup: {
    flex: 1,
    alignItems: 'flex-end',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
  actionDesc: {
    fontSize: 10,
    color: theme.colors.text.muted,
    marginTop: 2,
    textAlign: 'right',
  },
  confirmDeleteBox: {
    backgroundColor: '#FFE4E6',
    borderWidth: 1.5,
    borderColor: '#F43F5E',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  confirmDeleteTextRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  confirmDeleteTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9F1239',
    textAlign: 'right',
    flex: 1,
  },
  confirmDeleteSub: {
    fontSize: 11,
    color: '#BE123C',
    textAlign: 'right',
    lineHeight: 16,
  },
  confirmDeleteBtnsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 6,
  },
  finalDeleteBtn: {
    flex: 1,
    backgroundColor: '#BE123C',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  finalDeleteBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelDeleteBtn: {
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelDeleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
});
