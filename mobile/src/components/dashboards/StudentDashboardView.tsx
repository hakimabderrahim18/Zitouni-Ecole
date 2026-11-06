import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  Sparkles,
  Download,
  GraduationCap,
  FileText,
  CheckCircle,
} from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { theme } from '../../theme/tokens';
import { DashboardHeader } from '../DashboardHeader';
import { NavigationDrawer } from '../NavigationDrawer';
import { SchoolFeedView } from '../feed/SchoolFeedView';
import { ConversationView } from '../chat/ConversationView';

interface StudentDashboardViewProps {
  onOpenDrawer: () => void;
  currentRoute: string;
  setCurrentRoute: (r: string) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  onOpenDrawer,
  currentRoute,
  setCurrentRoute,
}) => {
  const { user } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [courses, setCourses] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [lessonsList, setLessonsList] = useState<any[]>([]);

  const fetchStudentData = useCallback(async () => {
    try {
      const [coursesRes, attendanceRes, schedulesRes, lessonsRes] = await Promise.all([
        apiClient.get('/api/students/courses').catch(() => ({ data: [] })),
        apiClient.get('/api/students/attendance').catch(() => ({ data: [] })),
        apiClient.get('/api/students/schedules').catch(() => ({ data: [] })),
        apiClient.get('/api/lessons').catch(() => ({ data: [] })),
      ]);

      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      setAttendance(Array.isArray(attendanceRes.data) ? attendanceRes.data : []);
      setSchedules(Array.isArray(schedulesRes.data) ? schedulesRes.data : []);
      setLessonsList(Array.isArray(lessonsRes.data) ? lessonsRes.data : []);
    } catch (err: any) {
      console.warn('Student data load error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudentData();
    setRefreshing(false);
  };

  const totalAbsences = attendance.filter((a) => a.status === 'Absent').length;

  return (
    <View style={styles.container}>
      {/* 1. Header */}
      <DashboardHeader onOpenDrawer={() => setIsDrawerOpen(true)} />

      {/* 2. Side Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeId={currentRoute}
        onSelect={(id) => setCurrentRoute(id)}
      />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={theme.colors.brand[500]} />
          <Text style={styles.loadingText}>جاري تحميل فضاء التلميذ من الخادم...</Text>
        </View>
      ) : currentRoute === 'feed' ? (
        <View style={{ flex: 1 }}>
          <View style={styles.activeRouteSubHeader}>
            <TouchableOpacity
              style={styles.backToOverviewBtn}
              onPress={() => setCurrentRoute('overview')}
            >
              <Text style={styles.backToOverviewText}>← العودة للرئيسية</Text>
            </TouchableOpacity>
            <Text style={styles.activeRouteSubText}>إعلانات المدرسة</Text>
          </View>
          <SchoolFeedView />
        </View>
      ) : currentRoute === 'chat' ? (
        <View style={{ flex: 1 }}>
          <View style={styles.activeRouteSubHeader}>
            <TouchableOpacity
              style={styles.backToOverviewBtn}
              onPress={() => setCurrentRoute('overview')}
            >
              <Text style={styles.backToOverviewText}>← العودة للرئيسية</Text>
            </TouchableOpacity>
            <Text style={styles.activeRouteSubText}>المراسلة والتواصل</Text>
          </View>
          <ConversationView onBackToOverview={() => setCurrentRoute('overview')} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.brand[500]}
              colors={[theme.colors.brand[500]]}
            />
          }
        >
          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeTexts}>
              <View style={styles.roleTag}>
                <Sparkles size={12} color={theme.colors.gold[500]} />
                <Text style={styles.roleTagText}>فضاء التلميذ</Text>
              </View>
              <Text style={styles.welcomeTitle}>
                أهلاً بك يا {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.welcomeSub}>
                متابعة الدروس المقررة، كراس الواجبات، وجدول التوقيت الأسبوعي
              </Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{courses.length}</Text>
              <Text style={styles.statLabel}>الدروس والواجبات</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalAbsences}</Text>
              <Text style={styles.statLabel}>الغيابات المسجلة</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{lessonsList.length}</Text>
              <Text style={styles.statLabel}>كراس الدروس</Text>
            </View>
          </View>

          {/* Subview 1: Overview */}
          {currentRoute === 'overview' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>آخر الدروس والواجبات المنشورة</Text>
              </View>

              {courses.length === 0 ? (
                <View style={styles.emptyCard}>
                  <BookOpen size={36} color={theme.colors.brand[300]} />
                  <Text style={styles.emptyTitle}>لا توجد دروس منشورة حالياً</Text>
                </View>
              ) : (
                courses.slice(0, 3).map((item) => (
                  <View key={item._id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.subject || 'مادة'}</Text>
                      </View>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                    </View>
                    <Text style={styles.cardDesc}>{item.description || 'لا يوجد وصف ملحق'}</Text>
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardMeta}>
                        الأستاذ: {item.teacher?.user?.firstName || 'أستاذ المادة'}
                      </Text>
                      {item.fileUrl && (
                        <TouchableOpacity
                          onPress={() => {
                            if (item.fileUrl) Linking.openURL(item.fileUrl).catch(() => {});
                          }}
                          style={styles.downloadLink}
                        >
                          <Download size={13} color={theme.colors.brand[500]} />
                          <Text style={styles.downloadText}>تحميل المرفق</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Subview 2: All Courses */}
          {currentRoute === 'courses' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>مستودع الدروس والمذكرات الدراسية</Text>
              {courses.map((item) => (
                <View key={item._id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.subject}</Text>
                    </View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.cardDesc}>{item.description}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardMeta}>
                      تاريخ النشر:{' '}
                      {new Date(item.createdAt || Date.now()).toLocaleDateString('ar-DZ')}
                    </Text>
                    {item.fileUrl && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(item.fileUrl).catch(() => {})}
                        style={styles.downloadLink}
                      >
                        <Download size={13} color={theme.colors.brand[500]} />
                        <Text style={styles.downloadText}>تحميل الملف</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Subview 3: Attendance */}
          {currentRoute === 'attendance' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>سجل المواظبة والغيابات والتأخيرات</Text>
              {attendance.length === 0 ? (
                <View style={styles.emptyCard}>
                  <CheckCircle size={36} color={theme.colors.status.success} />
                  <Text style={styles.emptyTitle}>سجل الحضور نظيف تماماً</Text>
                  <Text style={styles.emptySub}>لا توجد أي غيابات أو تأخيرات مسجلة بحقك.</Text>
                </View>
              ) : (
                attendance.map((record) => (
                  <View key={record._id} style={styles.attRow}>
                    <View
                      style={[
                        styles.attBadge,
                        record.status === 'Absent'
                          ? styles.attBadgeAbsent
                          : record.status === 'Late'
                          ? styles.attBadgeLate
                          : styles.attBadgePresent,
                      ]}
                    >
                      <Text style={styles.attBadgeText}>
                        {record.status === 'Absent'
                          ? 'غياب'
                          : record.status === 'Late'
                          ? 'تأخر'
                          : 'حاضر'}
                      </Text>
                    </View>
                    <View style={styles.attTexts}>
                      <Text style={styles.attDate}>
                        {new Date(record.date).toLocaleDateString('ar-DZ')}
                      </Text>
                      <Text style={styles.attRemarks}>
                        {record.remarks || (record.status === 'Absent' ? 'غير مبرر' : 'عادي')}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Subview 4: Lessons Notebook */}
          {currentRoute === 'lessons' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>كراس الدروس والواجبات اليومية</Text>
              {lessonsList.map((lesson) => (
                <View key={lesson._id} style={styles.card}>
                  <Text style={styles.cardTitle}>{lesson.title || lesson.subject}</Text>
                  <Text style={styles.cardDesc}>{lesson.content || lesson.summary}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardMeta}>
                      القسم: {lesson.class?.name || 'القسم العام'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Subview 5: Timetable */}
          {currentRoute === 'timetable' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>جدول توقيت القسم والحصص</Text>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>مخطط الحصص الأسبوعي</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>2026-2027</Text>
                  </View>
                </View>
                <Text style={styles.cardDesc}>
                  جدول الحصص الأسبوعي معتمد وفق توقيت وزارة التربية الوطنية.
                </Text>
              </View>
            </View>
          )}

          {/* Subview 6: Re-enrollment */}
          {currentRoute === 're-enrollment' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>استمارة إعادة التسجيل</Text>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>حالة التسجيل السنوي</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>مسجل</Text>
                  </View>
                </View>
                <Text style={styles.cardDesc}>
                  تم تأكيد تسجيلك بنجاح في السنة الدراسية الحالية.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface.background },
  scrollArea: { flex: 1 },
  scrollContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.muted,
  },
  welcomeCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    ...theme.shadows.card,
    marginBottom: theme.spacing.md,
  },
  welcomeTexts: { alignItems: 'flex-end' },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surface.elevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  roleTagText: { fontSize: 11, fontWeight: '800', color: theme.colors.brand[500] },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.brand[500],
    textAlign: 'right',
  },
  welcomeSub: {
    fontSize: 12,
    color: theme.colors.text.muted,
    textAlign: 'right',
    marginTop: 2,
  },
  statsRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  statNumber: { fontSize: 20, fontWeight: '800', color: theme.colors.brand[500] },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  section: { marginBottom: theme.spacing.lg },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.brand[500],
    marginBottom: 8,
    textAlign: 'right',
  },
  emptyCard: {
    backgroundColor: theme.colors.surface.card,
    padding: theme.spacing.xl,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.brand[500],
    marginTop: theme.spacing.sm,
  },
  emptySub: { fontSize: 12, color: theme.colors.text.muted, textAlign: 'center', marginTop: 4 },
  card: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    backgroundColor: theme.colors.surface.elevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: theme.colors.brand[500] },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  cardDesc: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    lineHeight: 18,
    marginVertical: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
    paddingTop: 6,
  },
  cardMeta: { fontSize: 11, fontWeight: '700', color: theme.colors.text.muted },
  downloadLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  downloadText: { fontSize: 11, fontWeight: '700', color: theme.colors.brand[500] },
  attRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface.card,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginBottom: 6,
  },
  attBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  attBadgeAbsent: { backgroundColor: '#FEE2E2' },
  attBadgeLate: { backgroundColor: '#FEF3C7' },
  attBadgePresent: { backgroundColor: '#D1FAE5' },
  attBadgeText: { fontSize: 11, fontWeight: '800' },
  attTexts: { alignItems: 'flex-end' },
  attDate: { fontSize: 12, fontWeight: '700', color: theme.colors.text.primary },
  attRemarks: { fontSize: 11, color: theme.colors.text.muted },
  activeRouteSubHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(123, 30, 58, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeRouteSubText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  backToOverviewBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.colors.surface.card,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  backToOverviewText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
});
