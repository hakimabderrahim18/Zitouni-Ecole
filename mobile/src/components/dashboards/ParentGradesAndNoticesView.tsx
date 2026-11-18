import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import {
  GraduationCap,
  Megaphone,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Download,
  RotateCcw,
} from 'lucide-react-native';
import { apiClient, API_BASE_URL } from '../../api/client';
import { theme } from '../../theme/tokens';

export function ParentGradesAndNoticesView({ initialTab = 'grades' }: { initialTab?: 'grades' | 'notices' }) {
  const [activeTab, setActiveTab] = useState<'grades' | 'notices'>(initialTab);
  const [childrenResults, setChildrenResults] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resGrades, resNotices] = await Promise.all([
        apiClient.get('/api/assessments/parent/children-results').catch(() => ({ data: { childrenResults: [] } })),
        apiClient.get('/api/parent-notices/parent/my-notices').catch(() => ({ data: { notices: [] } })),
      ]);
      setChildrenResults(resGrades.data.childrenResults || []);
      setNotices(resNotices.data.notices || []);
    } catch (err) {
      console.warn('Error fetching parent results and notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (assessmentId: string, childId: string) => {
    const url = `${API_BASE_URL}/api/assessments/${assessmentId}/export/pdf?type=individual&studentId=${childId}`;
    Linking.openURL(url).catch(() => Alert.alert('خطأ', 'تعذر فتح ملف كشف النقاط.'));
  };

  const handleMarkNoticeRead = async (id: string) => {
    try {
      await apiClient.put(`/api/parent-notices/${id}/read`);
      setNotices((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (e) {}
  };

  const activeChild = childrenResults[selectedChildIdx] || childrenResults[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Tab Switcher */}
      <View style={styles.topTabs}>
        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'grades' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('grades')}
        >
          <GraduationCap size={16} color={activeTab === 'grades' ? '#FFF' : theme.colors.text.secondary} />
          <Text style={[styles.topTabText, activeTab === 'grades' && styles.topTabTextActive]}>
            كشوف نقاط الأبناء
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'notices' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('notices')}
        >
          <Megaphone size={16} color={activeTab === 'notices' ? '#FFF' : theme.colors.text.secondary} />
          <Text style={[styles.topTabText, activeTab === 'notices' && styles.topTabTextActive]}>
            المراسلات والاستدعاءات ({notices.filter((n) => !n.isRead).length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.brand[500]} style={{ marginTop: 24 }} />
      ) : activeTab === 'grades' ? (
        <View style={{ gap: 12 }}>
          {/* Children Selector Chips */}
          {childrenResults.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childChipsScroll}>
              {childrenResults.map((ch, idx) => (
                <TouchableOpacity
                  key={ch.childId}
                  style={[styles.childChip, selectedChildIdx === idx && styles.childChipActive]}
                  onPress={() => setSelectedChildIdx(idx)}
                >
                  <Text style={[styles.childChipText, selectedChildIdx === idx && styles.childChipTextActive]}>
                    {ch.childName} ({ch.className})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {!activeChild || activeChild.assessments?.length === 0 ? (
            <Text style={styles.emptyText}>لم يتم نشر أية نتائج لهذا التلميذ بعد.</Text>
          ) : (
            activeChild.assessments.map((a: any, i: number) => {
              const isPass = !a.isAbsent && a.grade != null && a.grade >= 10;
              return (
                <View key={i} style={styles.gradeCard}>
                  <View style={styles.gradeHeader}>
                    <Text style={styles.gradeSubject}>{a.subject}</Text>
                    <Text style={styles.gradeDate}>
                      {a.assessmentDate ? new Date(a.assessmentDate).toLocaleDateString('ar-DZ') : ''}
                    </Text>
                  </View>

                  <Text style={styles.gradeType}>{a.assessmentType}</Text>

                  {/* Score box */}
                  <View style={[styles.scoreBox, a.isAbsent ? styles.scoreAbsent : isPass ? styles.scorePass : styles.scoreFail]}>
                    <View>
                      <Text style={styles.scoreLabel}>العلامة المحصل عليها:</Text>
                      <Text style={[styles.scoreValue, a.isAbsent ? { color: '#DC2626' } : isPass ? { color: '#059669' } : { color: '#D97706' }]}>
                        {a.isAbsent ? 'غائب / Absent' : `${a.grade != null ? a.grade : '--'} / ${a.maxGrade || 20}`}
                      </Text>
                    </View>

                    <View style={styles.classStatsCol}>
                      <Text style={styles.statMiniText}>معدل القسم: {a.classAverage}</Text>
                      <Text style={styles.statMiniText}>أعلى علامة: {a.classMax}</Text>
                      <Text style={styles.statMiniText}>أدنى علامة: {a.classMin}</Text>
                    </View>
                  </View>

                  {a.individualRemark ? (
                    <Text style={styles.remarkText}>
                      ملاحظة الأستاذ: {a.individualRemark}
                    </Text>
                  ) : null}

                  {a.classRemark ? (
                    <Text style={styles.classRemarkText}>
                      ملاحظة القسم: {a.classRemark}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => handleDownloadPDF(a.assessmentId, activeChild.childId)}
                  >
                    <Download size={14} color={theme.colors.brand[500]} />
                    <Text style={styles.downloadBtnText}>كشف النقاط الرسمي (PDF)</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      ) : (
        /* Notices Tab */
        <View style={{ gap: 10 }}>
          {notices.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد رسائل أو استدعاءات موجهة إليكم حالياً.</Text>
          ) : (
            notices.map((n) => {
              const unread = !n.isRead;
              return (
                <View key={n._id} style={[styles.noticeCard, unread && styles.noticeUnread]}>
                  <View style={styles.noticeTop}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>
                        {n.noticeType === 'reception' && 'موعد استقبال'}
                        {n.noticeType === 'summons' && 'استدعاء رسمي'}
                        {n.noticeType === 'announcement' && 'إعلان إداري'}
                        {n.noticeType === 'reminder' && 'تذكير'}
                      </Text>
                    </View>
                    <Text style={styles.noticeDate}>
                      {new Date(n.sentAt || n.createdAt).toLocaleDateString('ar-DZ')}
                    </Text>
                  </View>

                  <Text style={styles.noticeTitle}>{n.title}</Text>
                  <Text style={styles.noticeBody}>{n.content}</Text>

                  {n.appointmentDate && (
                    <View style={styles.appointmentBox}>
                      <Text style={styles.appointRow}>
                        📅 موعد الحضور: {new Date(n.appointmentDate).toLocaleDateString('ar-DZ')}
                        {n.appointmentEndTime && ` (حتى ${n.appointmentEndTime})`}
                      </Text>
                      <Text style={styles.appointRow}>📍 المكان: {n.appointmentLocation}</Text>
                    </View>
                  )}

                  {unread && (
                    <TouchableOpacity
                      style={styles.readBtn}
                      onPress={() => handleMarkNoticeRead(n._id)}
                    >
                      <CheckCircle2 size={14} color="#059669" />
                      <Text style={styles.readBtnText}>تأكيد الاطلاع</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface.background },
  contentContainer: { padding: 16, paddingBottom: 40 },
  topTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  topTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  topTabBtnActive: { backgroundColor: theme.colors.brand[500] },
  topTabText: { fontSize: 12, fontWeight: '700', color: theme.colors.text.secondary },
  topTabTextActive: { color: '#FFF' },
  emptyText: { textAlign: 'center', color: theme.colors.text.muted, paddingVertical: 24, fontSize: 13 },
  childChipsScroll: { flexDirection: 'row', marginBottom: 10 },
  childChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: theme.colors.surface.card,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginRight: 8,
  },
  childChipActive: { backgroundColor: theme.colors.brand[500] },
  childChipText: { fontSize: 12, fontWeight: '700', color: theme.colors.text.primary },
  childChipTextActive: { color: '#FFF' },
  gradeCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    gap: 8,
  },
  gradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gradeSubject: { fontSize: 13, fontWeight: '800', color: theme.colors.brand[600] },
  gradeDate: { fontSize: 11, color: theme.colors.text.muted },
  gradeType: { fontSize: 14, fontWeight: '800', color: theme.colors.text.primary },
  scoreBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  scorePass: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  scoreFail: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  scoreAbsent: { backgroundColor: '#FEF2F2', borderColor: '#FECDD3' },
  scoreLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.text.muted },
  scoreValue: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  classStatsCol: { alignItems: 'flex-end', gap: 2 },
  statMiniText: { fontSize: 10, color: theme.colors.text.muted },
  remarkText: { fontSize: 11, color: theme.colors.text.secondary, backgroundColor: theme.colors.surface.input, padding: 8, borderRadius: 8 },
  classRemarkText: { fontSize: 11, color: theme.colors.text.muted, backgroundColor: theme.colors.surface.input, padding: 8, borderRadius: 8 },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surface.input,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    gap: 4,
    marginTop: 4,
  },
  downloadBtnText: { fontSize: 11, fontWeight: '700', color: theme.colors.brand[500] },
  noticeCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    gap: 6,
  },
  noticeUnread: { borderColor: theme.colors.brand[400], backgroundColor: '#FFFDFD' },
  noticeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: theme.colors.brand[50] },
  typeBadgeText: { fontSize: 10, fontWeight: '700', color: theme.colors.brand[600] },
  noticeDate: { fontSize: 10, color: theme.colors.text.muted },
  noticeTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.text.primary },
  noticeBody: { fontSize: 11, color: theme.colors.text.secondary, lineHeight: 16 },
  appointmentBox: { backgroundColor: theme.colors.surface.input, padding: 8, borderRadius: 8, gap: 2 },
  appointRow: { fontSize: 11, fontWeight: '700', color: theme.colors.brand[700] },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
    marginTop: 4,
  },
  readBtnText: { fontSize: 11, fontWeight: '700', color: '#059669' },
});
