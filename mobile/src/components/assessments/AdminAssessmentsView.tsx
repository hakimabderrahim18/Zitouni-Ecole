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
  Linking,
} from 'react-native';
import {
  GraduationCap,
  CheckCircle2,
  Clock,
  RotateCcw,
  Globe,
  Lock,
  Eye,
  X,
  Send,
  Calendar,
  BookOpen,
  Users,
} from 'lucide-react-native';
import { apiClient, API_BASE_URL } from '../../api/client';
import { theme } from '../../theme/tokens';

export function AdminAssessmentsView() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, draft: 0, submitted: 0, approved: 0, returned: 0, published: 0 });
  const [loading, setLoading] = useState(true);

  // Filter
  const [statusFilter, setStatusFilter] = useState('all');

  // Review Modal State
  const [reviewingItem, setReviewingItem] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'return'>('approve');
  const [returnReason, setReturnReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Publishing Modal State
  const [publishingItem, setPublishingItem] = useState<any | null>(null);
  const [publishMode, setPublishMode] = useState<'general' | 'unpublish'>('general');
  const [submittingPublish, setSubmittingPublish] = useState(false);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/assessments/admin/all');
      setAssessments(res.data.assessments || []);
      if (res.data.metrics) setMetrics(res.data.metrics);
    } catch (err) {
      console.warn('Error loading admin assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteReview = async () => {
    if (!reviewingItem) return;
    if (reviewAction === 'return' && !returnReason.trim()) {
      Alert.alert('تنبيه', 'يجب إدخال سبب الإرجاع وملاحظات التصحيح.');
      return;
    }

    setSubmittingReview(true);
    try {
      await apiClient.put(`/api/assessments/admin/${reviewingItem._id}/review`, {
        action: reviewAction,
        returnReason: returnReason.trim(),
      });
      Alert.alert('نجاح', 'تم تحديث قرار الإدارة بخصوص الكشف.');
      setReviewingItem(null);
      fetchAssessments();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشلت معالجة القرار.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleExecutePublish = async () => {
    if (!publishingItem) return;
    setSubmittingPublish(true);
    try {
      await apiClient.put(`/api/assessments/admin/${publishingItem._id}/publish`, {
        publishMode,
        studentIds: [],
      });
      Alert.alert('نجاح', publishMode === 'unpublish' ? 'تم إخفاء النتائج وسحب النشر.' : 'تم نشر النتائج في فضاء الأولياء والتلاميذ.');
      setPublishingItem(null);
      fetchAssessments();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشلت عملية النشر.');
    } finally {
      setSubmittingPublish(false);
    }
  };

  const handleOpenPdf = (id: string) => {
    const url = `${API_BASE_URL}/api/assessments/${id}/export/pdf?type=collective`;
    Linking.openURL(url).catch(() => Alert.alert('خطأ', 'تعذر فتح ملف PDF.'));
  };

  const filtered = assessments.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Metrics Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricsScroll}>
        <View style={styles.metricCard}>
          <Text style={styles.metricNum}>{metrics.total}</Text>
          <Text style={styles.metricLabel}>إجمالي الكشوفات</Text>
        </View>
        <View style={[styles.metricCard, { borderColor: '#38BDF8' }]}>
          <Text style={[styles.metricNum, { color: '#0284C7' }]}>{metrics.submitted}</Text>
          <Text style={styles.metricLabel}>مرسلة للمراجعة</Text>
        </View>
        <View style={[styles.metricCard, { borderColor: '#34D399' }]}>
          <Text style={[styles.metricNum, { color: '#059669' }]}>{metrics.approved}</Text>
          <Text style={styles.metricLabel}>معتمدة رسمياً</Text>
        </View>
        <View style={[styles.metricCard, { borderColor: '#F59E0B' }]}>
          <Text style={[styles.metricNum, { color: '#D97706' }]}>{metrics.returned}</Text>
          <Text style={styles.metricLabel}>معادة للتصحيح</Text>
        </View>
        <View style={[styles.metricCard, { borderColor: theme.colors.brand[400] }]}>
          <Text style={[styles.metricNum, { color: theme.colors.brand[500] }]}>{metrics.published}</Text>
          <Text style={styles.metricLabel}>منشورة للأولياء</Text>
        </View>
      </ScrollView>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {['all', 'submitted', 'approved', 'returned', 'draft'].map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
            onPress={() => setStatusFilter(st)}
          >
            <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
              {st === 'all' && 'الكل'}
              {st === 'submitted' && 'مرسلة'}
              {st === 'approved' && 'معتمدة'}
              {st === 'returned' && 'مُعادة'}
              {st === 'draft' && 'مسودات'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Assessment Cards List */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.brand[500]} style={{ marginTop: 24 }} />
      ) : filtered.length === 0 ? (
        <Text style={styles.emptyText}>لا توجد كشوفات مطابقة للتصفية.</Text>
      ) : (
        filtered.map((item) => (
          <View key={item._id} style={styles.assessmentCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.className}>{item.class?.name || 'قسم'}</Text>
                <Text style={styles.subjectText}>{item.subject} - {item.assessmentType}</Text>
              </View>

              <View style={styles.badgesCol}>
                <View
                  style={[
                    styles.statusPill,
                    item.status === 'approved' && { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                    item.status === 'submitted' && { backgroundColor: 'rgba(2, 132, 199, 0.15)' },
                    item.status === 'returned' && { backgroundColor: 'rgba(217, 119, 6, 0.15)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      item.status === 'approved' && { color: '#059669' },
                      item.status === 'submitted' && { color: '#0284C7' },
                      item.status === 'returned' && { color: '#D97706' },
                    ]}
                  >
                    {item.status === 'approved' && 'معتمد'}
                    {item.status === 'submitted' && 'مرسل'}
                    {item.status === 'returned' && 'مُعاد'}
                    {item.status === 'draft' && 'مسودة'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.publishPill,
                    item.isPublished && { backgroundColor: 'rgba(123, 30, 58, 0.15)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.publishPillText,
                      item.isPublished && { color: theme.colors.brand[600] },
                    ]}
                  >
                    {item.isPublished ? 'منشور للأولياء' : 'غير منشور'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.cardDetails}>
              <Text style={styles.detailText}>
                الأستاذ:{' '}
                {item.teacherUser
                  ? `${item.teacherUser.firstName || ''} ${item.teacherUser.lastName || ''}`
                  : 'الأستاذ'}
              </Text>
              <Text style={styles.detailText}>
                تاريخ الإجراء:{' '}
                {item.assessmentDate ? new Date(item.assessmentDate).toLocaleDateString('ar-DZ') : '-'}
              </Text>
              {item.classRemark ? (
                <Text style={styles.classRemarkText} numberOfLines={2}>
                  ملاحظة القسم: {item.classRemark}
                </Text>
              ) : null}
            </View>

            {/* Actions Bar */}
            <View style={styles.actionsBar}>
              <TouchableOpacity
                style={styles.reviewBtn}
                onPress={() => {
                  setReviewingItem(item);
                  setReviewAction('approve');
                  setReturnReason('');
                }}
              >
                <Eye size={14} color="#0284C7" />
                <Text style={styles.reviewBtnText}>مراجعة واعتماد</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.publishBtn}
                onPress={() => {
                  setPublishingItem(item);
                  setPublishMode(item.isPublished ? 'unpublish' : 'general');
                }}
              >
                <Globe size={14} color={theme.colors.brand[500]} />
                <Text style={styles.publishBtnText}>التحكم بالنشر</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pdfBtn} onPress={() => handleOpenPdf(item._id)}>
                <Text style={styles.pdfBtnText}>PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Review & Decision Modal */}
      {reviewingItem && (
        <Modal transparent animationType="fade" visible={Boolean(reviewingItem)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>مراجعة واعتماد الكشف</Text>
                <TouchableOpacity onPress={() => setReviewingItem(null)}>
                  <X size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                {reviewingItem.assessmentType} - {reviewingItem.subject} ({reviewingItem.class?.name})
              </Text>

              {reviewingItem.classRemark && (
                <Text style={styles.modalClassRemark}>
                  ملاحظة الأستاذ: {reviewingItem.classRemark}
                </Text>
              )}

              {/* Decision Selector */}
              <View style={styles.decisionRow}>
                <TouchableOpacity
                  style={[styles.decisionBtn, reviewAction === 'approve' && styles.decisionBtnApprove]}
                  onPress={() => setReviewAction('approve')}
                >
                  <Text style={[styles.decisionBtnText, reviewAction === 'approve' && { color: '#FFF' }]}>
                    اعتماد الكشف نهائياً
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.decisionBtn, reviewAction === 'return' && styles.decisionBtnReturn]}
                  onPress={() => setReviewAction('return')}
                >
                  <Text style={[styles.decisionBtnText, reviewAction === 'return' && { color: '#FFF' }]}>
                    إرجاع للتصحيح
                  </Text>
                </TouchableOpacity>
              </View>

              {reviewAction === 'return' && (
                <TextInput
                  style={styles.returnInput}
                  multiline
                  numberOfLines={3}
                  placeholder="اكتب سبب الإرجاع وملاحظات التصحيح للأستاذ..."
                  placeholderTextColor="#A8A29E"
                  value={returnReason}
                  onChangeText={setReturnReason}
                />
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setReviewingItem(null)}>
                  <Text style={styles.cancelBtnText}>إلغاء</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={submittingReview}
                  style={[
                    styles.confirmBtn,
                    reviewAction === 'return' && { backgroundColor: theme.colors.gold[600] },
                  ]}
                  onPress={handleExecuteReview}
                >
                  <Text style={styles.confirmBtnText}>
                    {submittingReview ? 'جاري التأكيد...' : 'تأكيد القرار'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Publishing Modal */}
      {publishingItem && (
        <Modal transparent animationType="fade" visible={Boolean(publishingItem)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>التحكم في نشر النتائج</Text>
                <TouchableOpacity onPress={() => setPublishingItem(null)}>
                  <X size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.publishNoticeText}>
                قرار النشر قرار إداري حصري. اعتماد الكشف لا ينشره تلقائياً للأولياء والتلاميذ.
              </Text>

              <View style={styles.decisionRow}>
                <TouchableOpacity
                  style={[styles.decisionBtn, publishMode === 'general' && styles.decisionBtnApprove]}
                  onPress={() => setPublishMode('general')}
                >
                  <Text style={[styles.decisionBtnText, publishMode === 'general' && { color: '#FFF' }]}>
                    نشر عام للقسم
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.decisionBtn, publishMode === 'unpublish' && styles.decisionBtnReturn]}
                  onPress={() => setPublishMode('unpublish')}
                >
                  <Text style={[styles.decisionBtnText, publishMode === 'unpublish' && { color: '#FFF' }]}>
                    سحب النشر (إخفاء)
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setPublishingItem(null)}>
                  <Text style={styles.cancelBtnText}>إلغاء</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={submittingPublish}
                  style={styles.confirmBtn}
                  onPress={handleExecutePublish}
                >
                  <Text style={styles.confirmBtnText}>
                    {submittingPublish ? 'جاري التنفيذ...' : 'تأكيد قرار النشر'}
                  </Text>
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
  metricsScroll: { flexDirection: 'row', marginBottom: 14 },
  metricCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    minWidth: 105,
    marginRight: 8,
    alignItems: 'center',
  },
  metricNum: { fontSize: 20, fontWeight: '900', color: theme.colors.text.primary },
  metricLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.text.secondary, marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: theme.colors.surface.card,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  filterChipActive: { backgroundColor: theme.colors.brand[500], borderColor: theme.colors.brand[600] },
  filterChipText: { fontSize: 11, fontWeight: '700', color: theme.colors.text.secondary },
  filterChipTextActive: { color: '#FFF' },
  emptyText: { textAlign: 'center', color: theme.colors.text.muted, paddingVertical: 24, fontSize: 13 },
  assessmentCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginBottom: 10,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  className: { fontSize: 14, fontWeight: '800', color: theme.colors.text.primary },
  subjectText: { fontSize: 12, fontWeight: '700', color: theme.colors.brand[600], marginTop: 1 },
  badgesCol: { alignItems: 'flex-end', gap: 4 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#E5E7EB' },
  statusPillText: { fontSize: 10, fontWeight: '700', color: '#4B5563' },
  publishPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#F3F4F6' },
  publishPillText: { fontSize: 10, fontWeight: '600', color: '#6B7280' },
  cardDetails: { gap: 2 },
  detailText: { fontSize: 11, color: theme.colors.text.secondary },
  classRemarkText: { fontSize: 11, color: theme.colors.text.muted, backgroundColor: theme.colors.surface.input, padding: 6, borderRadius: 6, marginTop: 4 },
  actionsBar: { flexDirection: 'row', gap: 8, marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.surface.border },
  reviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brand[50],
    borderWidth: 1,
    borderColor: theme.colors.brand[200],
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  reviewBtnText: { fontSize: 11, fontWeight: '700', color: theme.colors.brand[500] },
  publishBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gold[50],
    borderWidth: 1,
    borderColor: theme.colors.gold[200],
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  publishBtnText: { fontSize: 11, fontWeight: '700', color: theme.colors.gold[700] },
  pdfBtn: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  pdfBtnText: { fontSize: 11, fontWeight: '800', color: theme.colors.text.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: theme.colors.surface.card, borderRadius: 24, padding: 20, gap: 14, borderWidth: 1, borderColor: theme.colors.surface.borderGold },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.text.primary },
  modalSubtitle: { fontSize: 12, color: theme.colors.text.secondary },
  modalClassRemark: { fontSize: 11, color: theme.colors.text.primary, backgroundColor: theme.colors.surface.input, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.surface.border },
  publishNoticeText: { fontSize: 11, color: theme.colors.gold[800], backgroundColor: theme.colors.gold[50], borderWidth: 1, borderColor: theme.colors.gold[200], padding: 10, borderRadius: 10, lineHeight: 17 },
  decisionRow: { flexDirection: 'row', gap: 8 },
  decisionBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: theme.colors.surface.input, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.surface.border },
  decisionBtnApprove: { backgroundColor: theme.colors.brand[500], borderColor: theme.colors.brand[600] },
  decisionBtnReturn: { backgroundColor: theme.colors.gold[600], borderColor: theme.colors.gold[700] },
  decisionBtnText: { fontSize: 12, fontWeight: '700', color: theme.colors.text.primary },
  returnInput: { backgroundColor: theme.colors.surface.input, borderRadius: 12, padding: 12, fontSize: 12, color: theme.colors.text.primary, borderWidth: 1, borderColor: theme.colors.gold[300], textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: theme.colors.surface.input, borderWidth: 1, borderColor: theme.colors.surface.border },
  cancelBtnText: { fontSize: 12, fontWeight: '700', color: theme.colors.text.secondary },
  confirmBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: theme.colors.brand[500] },
  confirmBtnText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
});
