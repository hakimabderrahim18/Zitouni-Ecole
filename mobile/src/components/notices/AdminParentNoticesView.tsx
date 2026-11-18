import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {
  Megaphone,
  Plus,
  Send,
  Calendar,
  Clock,
  MapPin,
  Users,
  RotateCcw,
  Sparkles,
  X,
  Trash2,
} from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { theme } from '../../theme/tokens';

const NOTICE_TYPES = [
  { value: 'announcement', label: 'إعلان رسمي' },
  { value: 'reception', label: 'موعد استقبال' },
  { value: 'summons', label: 'استدعاء ولي' },
  { value: 'reminder', label: 'تذكير بموعد' },
  { value: 'warning', label: 'تنبيه تربوي' },
];

export function AdminParentNoticesView() {
  const [notices, setNotices] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, sent: 0, scheduled: 0 });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noticeType, setNoticeType] = useState('announcement');
  const [targetAudience, setTargetAudience] = useState<'all' | 'cycle' | 'class'>('all');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentLocation, setAppointmentLocation] = useState('مقر المؤسسة - قاعة الاستقبال');

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/parent-notices/admin/all');
      setNotices(res.data.notices || []);
      if (res.data.metrics) setMetrics(res.data.metrics);
    } catch (err) {
      console.warn('Error loading parent notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyReceptionDayTemplate = () => {
    setTitle('برمجة يوم استقبال أولياء التلاميذ');
    setNoticeType('reception');
    setContent(
      'تعلم إدارة مؤسسة حبر وألوان أولياء التلاميذ الكرام أنه سيتم استقبالهم يوم السبت المقبل، من الساعة 09:00 إلى 13:00، وذلك لمتابعة الوضعية الدراسية والتربوية الشاملة لأبنائهم. مرحباً بالجميع.'
    );
    setAppointmentDate(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
    setAppointmentLocation('مقر المؤسسة - قاعة الاستقبال الكبرى');
  };

  const handleCreateSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة عنوان الرسالة ونصها بالتفصيل.');
      return;
    }

    setCreating(true);
    try {
      await apiClient.post('/api/parent-notices', {
        title: title.trim(),
        content: content.trim(),
        noticeType,
        targetAudience,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
        appointmentLocation,
        sendType: 'immediate',
      });
      Alert.alert('نجاح', 'تم إرسال الرسالة إلى أولياء التلاميذ بنجاح.');
      setShowCreateModal(false);
      setTitle('');
      setContent('');
      fetchNotices();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل إرسال الرسالة.');
    } finally {
      setCreating(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      await apiClient.post(`/api/parent-notices/${id}/resend`);
      Alert.alert('نجاح', 'تمت إعادة إرسال الرسالة للأولياء.');
      fetchNotices();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشلت إعادة الإرسال.');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذه الرسالة من السجل؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/parent-notices/${id}`);
            fetchNotices();
          } catch (e) {}
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header and Create Button */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>مراسلات وإشعارات الأولياء</Text>
          <Text style={styles.headerSubtitle}>إرسال الاستدعاءات ومواعيد الاستقبال الرسمية</Text>
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
          <Plus size={16} color="#FFF" />
          <Text style={styles.createBtnText}>رسالة جديدة</Text>
        </TouchableOpacity>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricNum}>{metrics.total}</Text>
          <Text style={styles.metricLabel}>إجمالي الرسائل</Text>
        </View>
        <View style={[styles.metricCard, { borderColor: '#34D399' }]}>
          <Text style={[styles.metricNum, { color: '#059669' }]}>{metrics.sent}</Text>
          <Text style={styles.metricLabel}>أُرسلت بنجاح</Text>
        </View>
        <View style={[styles.metricCard, { borderColor: '#F59E0B' }]}>
          <Text style={[styles.metricNum, { color: '#D97706' }]}>{metrics.scheduled}</Text>
          <Text style={styles.metricLabel}>مجدولة</Text>
        </View>
      </View>

      {/* Notices List */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.brand[500]} style={{ marginTop: 24 }} />
      ) : notices.length === 0 ? (
        <Text style={styles.emptyText}>لا توجد مراسلات مرسلة حتى الآن.</Text>
      ) : (
        notices.map((n) => (
          <View key={n._id} style={styles.noticeCard}>
            <View style={styles.cardHeader}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {n.noticeType === 'reception' && 'موعد استقبال'}
                  {n.noticeType === 'summons' && 'استدعاء'}
                  {n.noticeType === 'announcement' && 'إعلان'}
                  {n.noticeType === 'reminder' && 'تذكير'}
                  {n.noticeType === 'warning' && 'تنبيه'}
                </Text>
              </View>

              <Text style={styles.dateText}>
                {new Date(n.sentAt || n.createdAt).toLocaleDateString('ar-DZ')}
              </Text>
            </View>

            <Text style={styles.noticeTitle}>{n.title}</Text>
            <Text style={styles.noticeContent} numberOfLines={3}>
              {n.content}
            </Text>

            {n.appointmentDate && (
              <View style={styles.appointmentBox}>
                <Text style={styles.appointText}>
                  📅 موعد اللقاء: {new Date(n.appointmentDate).toLocaleDateString('ar-DZ')}
                </Text>
                <Text style={styles.appointText}>📍 المكان: {n.appointmentLocation}</Text>
              </View>
            )}

            <View style={styles.cardFooter}>
              <Text style={styles.recipientsText}>
                المستلمون: {n.recipientCount || 0} ولي ({n.targetAudience === 'all' ? 'الكل' : 'فئة'})
              </Text>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.resendBtn} onPress={() => handleResend(n._id)}>
                  <RotateCcw size={12} color={theme.colors.brand[500]} />
                  <Text style={styles.resendBtnText}>إعادة إرسال</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(n._id)}>
                  <Trash2 size={12} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}

      {/* Create Notice Modal */}
      {showCreateModal && (
        <Modal transparent animationType="slide" visible={showCreateModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>إنشاء رسالة أو إعلان للأولياء</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <X size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Template Quick Button */}
              <TouchableOpacity style={styles.templateBtn} onPress={applyReceptionDayTemplate}>
                <Sparkles size={14} color={theme.colors.brand[500]} />
                <Text style={styles.templateBtnText}>استخدام نموذج يوم استقبال الأولياء (Art. 8.2)</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.modalInput}
                placeholder="عنوان الرسالة أو الإعلان..."
                placeholderTextColor="#A8A29E"
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                multiline
                numberOfLines={4}
                placeholder="نص الرسالة بالتفصيل..."
                placeholderTextColor="#A8A29E"
                value={content}
                onChangeText={setContent}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="تاريخ الموعد (اختياري: YYYY-MM-DD)..."
                placeholderTextColor="#A8A29E"
                value={appointmentDate}
                onChangeText={setAppointmentDate}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="مكان الاستقبال (مثال: قاعة الاستقبال الكبرى)..."
                placeholderTextColor="#A8A29E"
                value={appointmentLocation}
                onChangeText={setAppointmentLocation}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateModal(false)}>
                  <Text style={styles.cancelBtnText}>إلغاء</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={creating}
                  style={styles.confirmBtn}
                  onPress={handleCreateSubmit}
                >
                  <Send size={14} color="#FFF" />
                  <Text style={styles.confirmBtnText}>{creating ? 'جاري الإرسال...' : 'إرسال للأولياء'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface.background },
  contentContainer: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.text.primary },
  headerSubtitle: { fontSize: 11, color: theme.colors.text.secondary, marginTop: 2 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.brand[500],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  createBtnText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  metricsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.surface.card,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  metricNum: { fontSize: 18, fontWeight: '900', color: theme.colors.text.primary },
  metricLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.text.secondary, marginTop: 2 },
  emptyText: { textAlign: 'center', color: theme.colors.text.muted, paddingVertical: 24, fontSize: 13 },
  noticeCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginBottom: 10,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: theme.colors.brand[50] },
  typeBadgeText: { fontSize: 10, fontWeight: '700', color: theme.colors.brand[600] },
  dateText: { fontSize: 10, color: theme.colors.text.muted },
  noticeTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.text.primary },
  noticeContent: { fontSize: 11, color: theme.colors.text.secondary, lineHeight: 16 },
  appointmentBox: { backgroundColor: theme.colors.surface.input, padding: 8, borderRadius: 8, gap: 2 },
  appointText: { fontSize: 10, fontWeight: '700', color: theme.colors.brand[700] },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: theme.colors.surface.border },
  recipientsText: { fontSize: 10, color: theme.colors.text.muted },
  resendBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.surface.input, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  resendBtnText: { fontSize: 10, fontWeight: '700', color: theme.colors.brand[500] },
  deleteBtn: { padding: 4, borderRadius: 6, backgroundColor: '#FEE2E2' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: theme.colors.surface.card, borderRadius: 20, padding: 18, gap: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text.primary },
  templateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.brand[50], padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.brand[200] },
  templateBtnText: { fontSize: 11, fontWeight: '700', color: theme.colors.brand[600] },
  modalInput: { backgroundColor: theme.colors.surface.input, borderRadius: 10, padding: 10, fontSize: 12, color: theme.colors.text.primary, borderWidth: 1, borderColor: theme.colors.surface.border },
  modalTextarea: { height: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: theme.colors.surface.input },
  cancelBtnText: { fontSize: 11, fontWeight: '700', color: theme.colors.text.secondary },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: theme.colors.brand[500] },
  confirmBtnText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
});
