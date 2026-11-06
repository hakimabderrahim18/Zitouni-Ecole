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
  Platform,
} from 'react-native';
import {
  X,
  Upload,
  Plus,
  Paperclip,
  FileText,
  Link as LinkIcon,
  Pin,
  Lock,
  AlertTriangle,
  Clock,
  Send,
  Trash2,
  Check,
  CheckSquare,
  Square,
  Image as ImageIcon,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../../api/client';
import { theme } from '../../theme/tokens';
import { PostAttachment, PedagogicalLink, PostItem } from './types';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: (post: PostItem) => void;
}

const AUDIENCE_OPTIONS = [
  { id: 'all', label: 'كامل المؤسسة (الجميع)', desc: 'تلاميذ، أولياء، أساتذة، إدارة' },
  { id: 'teachers', label: 'الأساتذة فقط', desc: 'كل الطاقم التربوي والتعليمي' },
  { id: 'parents', label: 'أولياء الأمور فقط', desc: 'كل أولياء التلاميذ المسجلين' },
  { id: 'students', label: 'التلاميذ فقط', desc: 'كل التلاميذ في المؤسسة' },
  { id: 'supervisors', label: 'المشرفون والمراقبون', desc: 'المشرف العام والمشرفون التربويون' },
  { id: 'admin_only', label: 'الإدارة العامة فقط', desc: 'الإدارة والمشرفين' },
  { id: 'level', label: 'طور تعليمي محدد', desc: 'ابتدائي، متوسط، أو ثانوي' },
  { id: 'class', label: 'قسم دراسي محدد', desc: 'قسم محدد وأولياؤه وتلاميذه' },
];

const LEVEL_OPTIONS = [
  { id: 'primaire', label: 'الطور الابتدائي' },
  { id: 'moyen', label: 'الطور المتوسط' },
  { id: 'secondaire', label: 'الطور الثانوي' },
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onPostCreated,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [targetLevel, setTargetLevel] = useState('moyen');
  const [targetClass, setTargetClass] = useState('');
  const [classesList, setClassesList] = useState<any[]>([]);

  // Advanced toggles
  const [isPinned, setIsPinned] = useState(false);
  const [commentsLocked, setCommentsLocked] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // Attachments
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Pedagogical Links
  const [pedagogicalLinks, setPedagogicalLinks] = useState<PedagogicalLink[]>([]);
  const [showAddLinkForm, setShowAddLinkForm] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Submitting
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchClasses();
    }
  }, [visible]);

  const fetchClasses = async () => {
    try {
      const res = await apiClient.get('/api/admin/classes');
      if (res.data && Array.isArray(res.data)) {
        setClassesList(res.data);
        if (res.data.length > 0 && !targetClass) {
          setTargetClass(res.data[0]._id);
        }
      }
    } catch (err) {
      console.log('Error fetching classes for targeting:', err);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setUploadingFile(true);

        const formData = new FormData();
        const fileObj = {
          uri: file.uri,
          name: file.name || 'document.pdf',
          type: file.mimeType || 'application/pdf',
        } as any;
        formData.append('files', fileObj);

        try {
          const res = await apiClient.post('/api/posts/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (res.data.attachments && res.data.attachments.length > 0) {
            setAttachments((prev) => [...prev, ...res.data.attachments]);
          } else if (res.data.url) {
            setAttachments((prev) => [
              ...prev,
              {
                url: res.data.url,
                name: file.name,
                fileType: res.data.mediaType || 'pdf',
                size: file.size,
              },
            ]);
          }
        } catch (uploadErr) {
          console.error('File upload failed:', uploadErr);
          // Fallback to local asset uri
          setAttachments((prev) => [
            ...prev,
            {
              url: file.uri,
              name: file.name,
              fileType: file.name.endsWith('.pdf') ? 'pdf' : 'file',
              size: file.size,
            },
          ]);
        } finally {
          setUploadingFile(false);
        }
      }
    } catch (err) {
      console.error('Document picker error:', err);
      setUploadingFile(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadingFile(true);

        const formData = new FormData();
        const fileName = asset.uri.split('/').pop() || 'image.jpg';
        const fileObj = {
          uri: asset.uri,
          name: fileName,
          type: 'image/jpeg',
        } as any;
        formData.append('files', fileObj);

        try {
          const res = await apiClient.post('/api/posts/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (res.data.attachments && res.data.attachments.length > 0) {
            setAttachments((prev) => [...prev, ...res.data.attachments]);
          } else {
            setAttachments((prev) => [
              ...prev,
              {
                url: res.data.url || asset.uri,
                name: fileName,
                fileType: 'image',
              },
            ]);
          }
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          setAttachments((prev) => [
            ...prev,
            {
              url: asset.uri,
              name: fileName,
              fileType: 'image',
            },
          ]);
        } finally {
          setUploadingFile(false);
        }
      }
    } catch (err) {
      console.error('Image picker error:', err);
      setUploadingFile(false);
    }
  };

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة رابط صالح.');
      return;
    }
    setPedagogicalLinks((prev) => [
      ...prev,
      { title: newLinkTitle.trim() || newLinkUrl.trim(), url: newLinkUrl.trim() },
    ]);
    setNewLinkTitle('');
    setNewLinkUrl('');
    setShowAddLinkForm(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('تنبيه', 'يرجى ملء عنوان المنشور ومحتواه أولاً.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        targetAudience,
        targetLevel: targetAudience === 'level' ? targetLevel : '',
        targetClass: targetAudience === 'class' ? targetClass : null,
        isPinned,
        commentsLocked,
        isImportant,
        scheduledPublishAt: isScheduled && scheduledDate ? scheduledDate : null,
        attachments,
        pedagogicalLinks,
      };

      const res = await apiClient.post('/api/posts', payload);
      Alert.alert('نجاح', 'تم نشر المنشور بنجاح في الشبكة المدرسية.');
      if (res.data?.post) {
        onPostCreated(res.data.post);
      }
      // Reset form
      setTitle('');
      setContent('');
      setAttachments([]);
      setPedagogicalLinks([]);
      setIsPinned(false);
      setIsImportant(false);
      setCommentsLocked(false);
      setIsScheduled(false);
      onClose();
    } catch (err: any) {
      Alert.alert(
        'خطأ في النشر',
        err.response?.data?.message || 'حدث خطأ أثناء محاولة نشر المنشور.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerTitle}>إنشاء منشور جديد في الشبكة المدرسية</Text>
              <Text style={styles.headerSubtitle}>
                تواصل موجه، مرفقات متعددة، وخيارات نشر متقدمة (المواد 10 - 13)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Form ScrollView */}
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>عنوان المنشور *</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: إعلان جدول الاختبارات الفصلية / نشاط تربوي..."
                placeholderTextColor={theme.colors.text.muted}
                value={title}
                onChangeText={setTitle}
                textAlign="right"
              />
            </View>

            {/* Content */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>نص المنشور *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="اكتب تفاصيل الإعلان أو التوجيه هنا..."
                placeholderTextColor={theme.colors.text.muted}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={5}
                textAlign="right"
                textAlignVertical="top"
              />
            </View>

            {/* Target Audience Selector (Art. 12) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                تحديد الجمهور المستهدف (إلزامي بموجب المادة 12)
              </Text>
              <View style={styles.audienceGrid}>
                {AUDIENCE_OPTIONS.map((opt) => {
                  const isSelected = targetAudience === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.audienceCard, isSelected && styles.audienceCardSelected]}
                      onPress={() => setTargetAudience(opt.id)}
                    >
                      <View style={styles.audienceCardHeader}>
                        <Text
                          style={[
                            styles.audienceCardTitle,
                            isSelected && styles.audienceCardTitleSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                        <View
                          style={[
                            styles.radioDot,
                            isSelected && styles.radioDotSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDotInner} />}
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.audienceCardDesc,
                          isSelected && styles.audienceCardDescSelected,
                        ]}
                      >
                        {opt.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Secondary Audience Filter: Level */}
            {targetAudience === 'level' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>اختر الطور التعليمي</Text>
                <View style={styles.rowChoices}>
                  {LEVEL_OPTIONS.map((lvl) => (
                    <TouchableOpacity
                      key={lvl.id}
                      style={[
                        styles.choicePill,
                        targetLevel === lvl.id && styles.choicePillSelected,
                      ]}
                      onPress={() => setTargetLevel(lvl.id)}
                    >
                      <Text
                        style={[
                          styles.choicePillText,
                          targetLevel === lvl.id && styles.choicePillTextSelected,
                        ]}
                      >
                        {lvl.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Secondary Audience Filter: Class */}
            {targetAudience === 'class' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>اختر القسم المستهدف</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row-reverse' }}>
                  <View style={styles.rowChoices}>
                    {classesList.map((cls) => (
                      <TouchableOpacity
                        key={cls._id}
                        style={[
                          styles.choicePill,
                          targetClass === cls._id && styles.choicePillSelected,
                        ]}
                        onPress={() => setTargetClass(cls._id)}
                      >
                        <Text
                          style={[
                            styles.choicePillText,
                            targetClass === cls._id && styles.choicePillTextSelected,
                          ]}
                        >
                          {cls.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Attachments Section */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionBoxHeader}>
                <Text style={styles.sectionBoxTitle}>
                  المرفقات (صور، فيديوهات، PDF، وثائق إدارية)
                </Text>
                <Paperclip size={16} color={theme.colors.gold[600]} />
              </View>

              <View style={styles.uploadBtnsRow}>
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={handlePickDocument}
                  disabled={uploadingFile}
                >
                  <FileText size={16} color={theme.colors.brand[500]} />
                  <Text style={styles.uploadBtnText}>إضافة وثيقة / PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={handlePickImage}
                  disabled={uploadingFile}
                >
                  <ImageIcon size={16} color={theme.colors.brand[500]} />
                  <Text style={styles.uploadBtnText}>إضافة صورة</Text>
                </TouchableOpacity>
              </View>

              {uploadingFile && (
                <View style={styles.uploadingIndicator}>
                  <ActivityIndicator size="small" color={theme.colors.brand[500]} />
                  <Text style={styles.uploadingText}>جاري رفع المرفق إلى الخادم...</Text>
                </View>
              )}

              {attachments.length > 0 && (
                <View style={styles.attachmentsList}>
                  {attachments.map((att, idx) => (
                    <View key={idx} style={styles.attachmentChip}>
                      <TouchableOpacity
                        onPress={() =>
                          setAttachments((prev) => prev.filter((_, i) => i !== idx))
                        }
                        style={styles.removeAttBtn}
                      >
                        <X size={14} color="#BE123C" />
                      </TouchableOpacity>
                      <Text style={styles.attName} numberOfLines={1}>
                        {att.name || att.url}
                      </Text>
                      <FileText size={14} color={theme.colors.brand[500]} />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Pedagogical Interactive Links */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionBoxHeader}>
                <Text style={styles.sectionBoxTitle}>
                  الروابط البيداغوجية والتعليمية التفاعلية
                </Text>
                <LinkIcon size={16} color={theme.colors.gold[600]} />
              </View>

              {!showAddLinkForm ? (
                <TouchableOpacity
                  style={styles.addLinkToggleBtn}
                  onPress={() => setShowAddLinkForm(true)}
                >
                  <Plus size={14} color={theme.colors.gold[700]} />
                  <Text style={styles.addLinkToggleText}>إضافة رابط</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.addLinkForm}>
                  <TextInput
                    style={styles.smallInput}
                    placeholder="عنوان الرابط (مثال: منصة الاختبار التفاعلي)"
                    placeholderTextColor={theme.colors.text.muted}
                    value={newLinkTitle}
                    onChangeText={setNewLinkTitle}
                    textAlign="right"
                  />
                  <TextInput
                    style={styles.smallInput}
                    placeholder="رابط URL (https://...)"
                    placeholderTextColor={theme.colors.text.muted}
                    value={newLinkUrl}
                    onChangeText={setNewLinkUrl}
                    textAlign="left"
                    autoCapitalize="none"
                  />
                  <View style={styles.addLinkActionsRow}>
                    <TouchableOpacity style={styles.confirmAddBtn} onPress={handleAddLink}>
                      <Text style={styles.confirmAddBtnText}>تأكيد الإضافة</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelAddBtn}
                      onPress={() => setShowAddLinkForm(false)}
                    >
                      <Text style={styles.cancelAddBtnText}>إلغاء</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {pedagogicalLinks.length > 0 && (
                <View style={styles.linksList}>
                  {pedagogicalLinks.map((link, idx) => (
                    <View key={idx} style={styles.linkItemChip}>
                      <TouchableOpacity
                        onPress={() =>
                          setPedagogicalLinks((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        <X size={14} color="#BE123C" />
                      </TouchableOpacity>
                      <Text style={styles.linkItemText} numberOfLines={1}>
                        {link.title || link.url}
                      </Text>
                      <LinkIcon size={12} color={theme.colors.gold[600]} />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Advanced Checkboxes */}
            <View style={styles.checkboxesGroup}>
              {/* 1. Pin Post */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsPinned(!isPinned)}
                activeOpacity={0.8}
              >
                <View style={[styles.customCheck, isPinned && styles.customCheckActive]}>
                  {isPinned && <Check size={14} color="#fff" />}
                </View>
                <View style={styles.checkTexts}>
                  <View style={styles.checkTitleRow}>
                    <Text style={styles.checkTitle}>
                      تثبيت المنشور في أعلى الصفحة (منشور رئيسي)
                    </Text>
                    <Pin size={14} color={theme.colors.gold[600]} />
                  </View>
                  <Text style={styles.checkSub}>
                    يبقى ظاهراً في المقدمة لكل المعنيين (المادة 13)
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 2. Lock Comments */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setCommentsLocked(!commentsLocked)}
                activeOpacity={0.8}
              >
                <View style={[styles.customCheck, commentsLocked && styles.customCheckActive]}>
                  {commentsLocked && <Check size={14} color="#fff" />}
                </View>
                <View style={styles.checkTexts}>
                  <View style={styles.checkTitleRow}>
                    <Text style={styles.checkTitle}>إغلاق التعليقات والردود</Text>
                    <Lock size={14} color="#E11D48" />
                  </View>
                  <Text style={styles.checkSub}>
                    منع الردود العامة لحفظ رسمية الإعلان (المادة 14)
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 3. Important Announcement requiring read confirmation */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsImportant(!isImportant)}
                activeOpacity={0.8}
              >
                <View style={[styles.customCheck, isImportant && styles.customCheckActive]}>
                  {isImportant && <Check size={14} color="#fff" />}
                </View>
                <View style={styles.checkTexts}>
                  <View style={styles.checkTitleRow}>
                    <Text style={styles.checkTitle}>
                      إعلان هام يتطلب تأكيد الاطلاع (زر اطلعت عليه)
                    </Text>
                    <AlertTriangle size={14} color="#D97706" />
                  </View>
                  <Text style={styles.checkSub}>
                    يظهر زر تأكيد رسمي للمستلمين (المادة 16)
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 4. Schedule Post */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsScheduled(!isScheduled)}
                activeOpacity={0.8}
              >
                <View style={[styles.customCheck, isScheduled && styles.customCheckActive]}>
                  {isScheduled && <Check size={14} color="#fff" />}
                </View>
                <View style={styles.checkTexts}>
                  <View style={styles.checkTitleRow}>
                    <Text style={styles.checkTitle}>جدولة النشر لتاريخ لاحق</Text>
                    <Clock size={14} color={theme.colors.gold[600]} />
                  </View>
                  <Text style={styles.checkSub}>تحديد وقت وتاريخ صدور المنشور تلقائياً</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Scheduled Date Input */}
            {isScheduled && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>تاريخ ووقت النشر (YYYY-MM-DD HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026-11-10 09:00"
                  placeholderTextColor={theme.colors.text.muted}
                  value={scheduledDate}
                  onChangeText={setScheduledDate}
                  textAlign="right"
                />
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={[styles.publishSubmitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Send size={16} color="#F3E9DC" />
                    <Text style={styles.publishSubmitText}>نشر المنشور الآن</Text>
                  </>
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
    padding: 14,
  },
  modalContainer: {
    backgroundColor: '#FDFBF7',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    maxHeight: '92%',
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
    minHeight: 90,
  },
  audienceGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  audienceCard: {
    width: '48%',
    backgroundColor: 'rgba(243, 233, 220, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    borderRadius: 14,
    padding: 10,
  },
  audienceCardSelected: {
    backgroundColor: '#fff',
    borderColor: theme.colors.brand[500],
    borderWidth: 1.5,
    shadowColor: theme.colors.brand[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  audienceCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  audienceCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'right',
    flex: 1,
  },
  audienceCardTitleSelected: {
    color: theme.colors.brand[500],
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: theme.colors.gold[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  radioDotSelected: {
    borderColor: theme.colors.brand[500],
  },
  radioDotInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: theme.colors.brand[500],
  },
  audienceCardDesc: {
    fontSize: 9,
    color: theme.colors.text.muted,
    textAlign: 'right',
  },
  audienceCardDescSelected: {
    color: theme.colors.brand[600],
  },
  rowChoices: {
    flexDirection: 'row-reverse',
    gap: 8,
    flexWrap: 'wrap',
  },
  choicePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
  },
  choicePillSelected: {
    backgroundColor: theme.colors.brand[500],
    borderColor: theme.colors.brand[500],
  },
  choicePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  choicePillTextSelected: {
    color: '#F3E9DC',
  },
  sectionBox: {
    backgroundColor: 'rgba(243, 233, 220, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  sectionBoxHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.brand[500],
    textAlign: 'right',
  },
  uploadBtnsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    borderRadius: 12,
    paddingVertical: 9,
  },
  uploadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  uploadingIndicator: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  uploadingText: {
    fontSize: 11,
    color: theme.colors.text.muted,
  },
  attachmentsList: {
    gap: 6,
    marginTop: 4,
  },
  attachmentChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  removeAttBtn: {
    padding: 4,
  },
  attName: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
  addLinkToggleBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    borderRadius: 12,
    paddingVertical: 8,
  },
  addLinkToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.gold[700],
  },
  addLinkForm: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  smallInput: {
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    color: theme.colors.text.primary,
  },
  addLinkActionsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 4,
  },
  confirmAddBtn: {
    flex: 1,
    backgroundColor: theme.colors.brand[500],
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  confirmAddBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  cancelAddBtn: {
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelAddBtnText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  linksList: {
    gap: 6,
  },
  linkItemChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  linkItemText: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.brand[500],
    textAlign: 'right',
  },
  checkboxesGroup: {
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
  checkTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
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
    marginBottom: 20,
  },
  publishSubmitBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.brand[500],
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: theme.colors.brand[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  publishSubmitText: {
    fontSize: 14,
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
