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
  Download,
  Calendar,
  BookOpen,
  Award,
  Sparkles,
} from 'lucide-react-native';
import { apiClient, API_BASE_URL } from '../../api/client';
import { theme } from '../../theme/tokens';

export function StudentGradesView() {
  const [data, setData] = useState<{ studentName: string; className: string; results: any[] }>({
    studentName: '',
    className: '',
    results: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/assessments/student/my-results');
      setData(res.data);
    } catch (err) {
      console.warn('Error fetching student results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (assessmentId: string) => {
    const url = `${API_BASE_URL}/api/assessments/${assessmentId}/export/pdf?type=individual`;
    Linking.openURL(url).catch(() => Alert.alert('خطأ', 'تعذر فتح ملف كشف النقاط.'));
  };

  const { studentName, className, results = [] } = data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>كشف النقاط والنتائج المدرسية</Text>
        <Text style={styles.subtitle}>القسم: {className || 'قسمي'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.brand[500]} style={{ marginTop: 24 }} />
      ) : results.length === 0 ? (
        <Text style={styles.emptyText}>لا توجد نتائج منشورة لك حتى الآن.</Text>
      ) : (
        results.map((r, i) => {
          const isPass = !r.isAbsent && r.grade != null && r.grade >= 10;
          return (
            <View key={i} style={styles.gradeCard}>
              <View style={styles.gradeHeader}>
                <Text style={styles.gradeSubject}>{r.subject}</Text>
                <Text style={styles.gradeDate}>
                  {r.assessmentDate ? new Date(r.assessmentDate).toLocaleDateString('ar-DZ') : ''}
                </Text>
              </View>

              <Text style={styles.gradeType}>{r.assessmentType}</Text>

              {/* Score box */}
              <View
                style={[
                  styles.scoreBox,
                  r.isAbsent ? styles.scoreAbsent : isPass ? styles.scorePass : styles.scoreFail,
                ]}
              >
                <View>
                  <Text style={styles.scoreLabel}>علامتي المحصل عليها:</Text>
                  <Text
                    style={[
                      styles.scoreValue,
                      r.isAbsent ? { color: '#DC2626' } : isPass ? { color: '#059669' } : { color: '#D97706' },
                    ]}
                  >
                    {r.isAbsent ? 'غائب / Absent' : `${r.grade != null ? r.grade : '--'} / ${r.maxGrade || 20}`}
                  </Text>
                </View>

                <View style={styles.classStatsCol}>
                  <Text style={styles.statMiniText}>معدل القسم: {r.classAverage}</Text>
                  <Text style={styles.statMiniText}>أعلى علامة: {r.classMax}</Text>
                  <Text style={styles.statMiniText}>أدنى علامة: {r.classMin}</Text>
                </View>
              </View>

              {r.individualRemark ? (
                <Text style={styles.remarkText}>
                  ملاحظة الأستاذ: {r.individualRemark}
                </Text>
              ) : null}

              {r.classRemark ? (
                <Text style={styles.classRemarkText}>
                  ملاحظة القسم: {r.classRemark}
                </Text>
              ) : null}

              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() => handleDownloadPDF(r.assessmentId)}
              >
                <Download size={14} color={theme.colors.brand[500]} />
                <Text style={styles.downloadBtnText}>كشف النقاط الرسمي (PDF)</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface.background },
  contentContainer: { padding: 16, paddingBottom: 40, gap: 10 },
  header: { marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '900', color: theme.colors.text.primary },
  subtitle: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
  emptyText: { textAlign: 'center', color: theme.colors.text.muted, paddingVertical: 24, fontSize: 13 },
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
});
