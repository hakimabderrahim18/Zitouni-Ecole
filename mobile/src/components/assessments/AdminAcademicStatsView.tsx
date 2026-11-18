import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  BarChart2,
  TrendingUp,
  Award,
  Users,
  RotateCcw,
} from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { theme } from '../../theme/tokens';

export function AdminAcademicStatsView() {
  const [data, setData] = useState<{ assessmentStats: any[]; teacherProgress: any[] }>({
    assessmentStats: [],
    teacherProgress: [],
  });
  const [activeTab, setActiveTab] = useState<'classes' | 'teachers'>('classes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/assessments/admin/statistics?minPassingGrade=10');
      setData(res.data);
    } catch (err) {
      console.warn('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const { assessmentStats = [], teacherProgress = [] } = data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Switcher Tab */}
      <View style={styles.topTabs}>
        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'classes' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('classes')}
        >
          <BarChart2 size={16} color={activeTab === 'classes' ? '#FFF' : theme.colors.text.secondary} />
          <Text style={[styles.topTabText, activeTab === 'classes' && styles.topTabTextActive]}>
            إحصائيات الفروض والأقسام
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'teachers' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('teachers')}
        >
          <Users size={16} color={activeTab === 'teachers' ? '#FFF' : theme.colors.text.secondary} />
          <Text style={[styles.topTabText, activeTab === 'teachers' && styles.topTabTextActive]}>
            نسب إنجاز الأساتذة
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.brand[500]} style={{ marginTop: 24 }} />
      ) : activeTab === 'classes' ? (
        <View style={{ gap: 10 }}>
          {assessmentStats.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد إحصائيات تقييمات مسجلة.</Text>
          ) : (
            assessmentStats.map((item) => (
              <View key={item._id} style={styles.statCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.classTitle}>{item.className}</Text>
                  <Text style={styles.subjectTitle}>{item.subject} - {item.assessmentType}</Text>
                </View>

                <View style={styles.gridStats}>
                  <View style={styles.gridBox}>
                    <Text style={styles.gridLabel}>معدل القسم</Text>
                    <Text style={styles.gridVal}>{item.average.toFixed(2)}</Text>
                  </View>
                  <View style={styles.gridBox}>
                    <Text style={styles.gridLabel}>أعلى علامة</Text>
                    <Text style={[styles.gridVal, { color: '#059669' }]}>{item.maxScore.toFixed(2)}</Text>
                  </View>
                  <View style={styles.gridBox}>
                    <Text style={styles.gridLabel}>أدنى علامة</Text>
                    <Text style={[styles.gridVal, { color: '#DC2626' }]}>{item.minScore.toFixed(2)}</Text>
                  </View>
                  <View style={styles.gridBox}>
                    <Text style={styles.gridLabel}>نسبة النجاح (≥10)</Text>
                    <Text style={[styles.gridVal, { color: theme.colors.brand[500] }]}>
                      {item.passRate}%
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {teacherProgress.map((t) => (
            <View key={t.teacherId} style={styles.teacherCard}>
              <View style={styles.teacherHeader}>
                <Text style={styles.teacherName}>{t.teacherName}</Text>
                <Text style={styles.rateBadge}>{t.completionRate}% إنجاز</Text>
              </View>

              <Text style={styles.teacherSubjects}>المواد: {t.subjects.join('، ') || '-'}</Text>

              <View style={styles.progressRow}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${t.completionRate}%` }]} />
                </View>
              </View>

              <View style={styles.teacherStatsRow}>
                <Text style={styles.tStatText}>معتمدة: {t.approvedCount}</Text>
                <Text style={styles.tStatText}>مرسلة: {t.submittedCount}</Text>
                <Text style={styles.tStatText}>مسودة: {t.draftCount}</Text>
              </View>
            </View>
          ))}
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
    marginBottom: 16,
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
  statCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  classTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text.primary },
  subjectTitle: { fontSize: 12, fontWeight: '700', color: theme.colors.brand[600] },
  gridStats: { flexDirection: 'row', gap: 6 },
  gridBox: {
    flex: 1,
    backgroundColor: theme.colors.surface.input,
    padding: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  gridLabel: { fontSize: 9, fontWeight: '700', color: theme.colors.text.muted },
  gridVal: { fontSize: 14, fontWeight: '900', color: theme.colors.text.primary, marginTop: 2 },
  teacherCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    gap: 8,
  },
  teacherHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teacherName: { fontSize: 14, fontWeight: '800', color: theme.colors.text.primary },
  rateBadge: { fontSize: 11, fontWeight: '800', color: theme.colors.brand[600] },
  teacherSubjects: { fontSize: 11, color: theme.colors.text.secondary },
  progressRow: { marginTop: 2 },
  progressBarBg: { height: 6, backgroundColor: theme.colors.surface.input, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.brand[500] },
  teacherStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  tStatText: { fontSize: 10, fontWeight: '600', color: theme.colors.text.muted },
});
