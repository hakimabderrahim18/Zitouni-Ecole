import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  BookOpen,
  Users,
  CheckSquare,
  Calendar,
  FileText,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Search,
  Check,
  X,
  AlertCircle,
  Download,
  GraduationCap,
  Layers,
  Send,
  Eye,
} from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { theme } from '../../theme/tokens';
import { DashboardHeader } from '../DashboardHeader';
import { NavigationDrawer } from '../NavigationDrawer';
import { Button } from '../common/Button';
import { SchoolFeedView } from '../feed/SchoolFeedView';
import { ConversationView } from '../chat/ConversationView';

interface TeacherDashboardViewProps {
  onOpenDrawer: () => void;
  currentRoute: string;
  setCurrentRoute: (r: string) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  onOpenDrawer,
  currentRoute,
  setCurrentRoute,
}) => {
  const { user } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core data states
  const [courses, setCourses] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [lessonsList, setLessonsList] = useState<any[]>([]);
  const [requestsList, setRequestsList] = useState<any[]>([]);

  // Attendance recording sheet state
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [attendanceRemarks, setAttendanceRemarks] = useState<Record<string, string>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Upload course modal state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSubject, setCourseSubject] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseClassId, setCourseClassId] = useState('');
  const [isUploadingCourse, setIsUploadingCourse] = useState(false);

  // New admin request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState('شهادة عمل (Attestation de travail)');
  const [requestDetails, setRequestDetails] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const fetchTeacherData = useCallback(async () => {
    try {
      const [coursesRes, historyRes, classesRes, lessonsRes, requestsRes] = await Promise.all([
        apiClient.get('/api/teachers/courses').catch(() => ({ data: [] })),
        apiClient.get('/api/teachers/attendance/history').catch(() => ({ data: [] })),
        apiClient.get('/api/admin/classes').catch(() => ({ data: [] })),
        apiClient.get('/api/lessons').catch(() => ({ data: [] })),
        apiClient.get('/api/administrative-requests').catch(() => ({ data: [] })),
      ]);

      const cData = Array.isArray(coursesRes.data) ? coursesRes.data : [];
      setCourses(cData);

      const hData = Array.isArray(historyRes.data) ? historyRes.data : [];
      setAttendanceHistory(hData);

      const clsData = Array.isArray(classesRes.data)
        ? classesRes.data
        : classesRes.data?.classes || [];
      setAssignedClasses(clsData);

      if (clsData.length > 0 && !selectedClassId) {
        setSelectedClassId(clsData[0]._id);
        setCourseClassId(clsData[0]._id);
      }

      setLessonsList(Array.isArray(lessonsRes.data) ? lessonsRes.data : []);
      setRequestsList(Array.isArray(requestsRes.data) ? requestsRes.data : []);
    } catch (err: any) {
      console.warn('Teacher data load failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeacherData();
    setRefreshing(false);
  };

  // Load students when selecting class for attendance or roster inspection
  const fetchStudentsForClass = useCallback(async (classId: string, groupId?: string) => {
    if (!classId) return;
    setLoadingStudents(true);
    try {
      // Find students in that class (backend enforces teacher assigned classes)
      const res = await apiClient.get('/api/admin/students', { params: { classId } });
      const all = Array.isArray(res.data) ? res.data : res.data?.students || [];
      const filtered = all.filter((s: any) => {
        const cId = s.class?._id || s.class;
        return cId === classId;
      });
      setClassStudents(filtered);

      // Default all to Present
      const initial: Record<string, string> = {};
      filtered.forEach((st: any) => {
        initial[st._id] = 'Present';
      });
      setAttendanceRecords(initial);
    } catch (err) {
      console.warn('Could not load class students:', err);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudentsForClass(selectedClassId, selectedGroupId);
    }
  }, [selectedClassId, selectedGroupId, fetchStudentsForClass]);

  // Handle Mark Attendance Submission
  const handleSaveAttendance = async () => {
    if (!selectedClassId || classStudents.length === 0) {
      Alert.alert('تنبيه', 'يرجى اختيار القسم وتحديد التلاميذ أولاً.');
      return;
    }

    const isAssigned = assignedClasses.some((c) => (c._id || c) === selectedClassId);
    if (!isAssigned) {
      Alert.alert('خطأ في الصلاحيات', 'لا يمكنك تسجيل الحضور إلا للأقسام المسندة إليك فقط.');
      return;
    }

    setSavingAttendance(true);
    try {
      const records = classStudents.map((st) => ({
        studentId: st._id,
        status: attendanceRecords[st._id] || 'Present',
        remarks: attendanceRemarks[st._id] || '',
      }));

      await apiClient.post('/api/teachers/attendance', {
        classId: selectedClassId,
        groupId: selectedGroupId || null,
        date: attendanceDate,
        records,
      });

      Alert.alert('نجاح', 'تم تسجيل ورقة الحضور والغياب بنجاح في قاعدة البيانات.');
      await fetchTeacherData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل حفظ سجل الحضور');
    } finally {
      setSavingAttendance(false);
    }
  };

  // Handle Upload Course
  const handleCreateCourse = async () => {
    if (!courseTitle.trim() || !courseSubject.trim() || !courseClassId) {
      Alert.alert('تنبيه', 'يرجى ملء عنوان الدرس، المادة، والقسم.');
      return;
    }

    const isAssigned = assignedClasses.some((c) => (c._id || c) === courseClassId);
    if (!isAssigned) {
      Alert.alert('خطأ في الصلاحيات', 'لا يمكنك نشر درس إلا للأقسام المسندة إليك فقط.');
      return;
    }

    setIsUploadingCourse(true);
    try {
      const res = await apiClient.post('/api/teachers/courses', {
        title: courseTitle.trim(),
        subject: courseSubject.trim(),
        description: courseDesc.trim(),
        classId: courseClassId,
      });

      Alert.alert('نجاح', 'تم نشر الدرس وإتاحته للتلاميذ بنجاح.');
      setShowCourseModal(false);
      setCourseTitle('');
      setCourseSubject('');
      setCourseDesc('');
      await fetchTeacherData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل نشر الدرس');
    } finally {
      setIsUploadingCourse(false);
    }
  };

  // Handle Delete Course
  const handleDeleteCourse = async (courseId: string) => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد من رغبتك في حذف هذا الدرس نهائياً؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/teachers/courses/${courseId}`);
            setCourses((prev) => prev.filter((c) => c._id !== courseId));
            Alert.alert('نجاح', 'تم حذف الدرس.');
          } catch (err: any) {
            Alert.alert('خطأ', err.response?.data?.message || 'فشل حذف الدرس');
          }
        },
      },
    ]);
  };

  // Handle Admin Request
  const handleCreateRequest = async () => {
    if (!requestDetails.trim()) {
      Alert.alert('تنبيه', 'يرجى توضيح تفاصيل الطلب الإداري.');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      await apiClient.post('/api/administrative-requests', {
        requestType,
        details: requestDetails.trim(),
      });
      Alert.alert('نجاح', 'تم إرسال طلبك للإدارة العامة للمراجعة والاعتماد.');
      setShowRequestModal(false);
      setRequestDetails('');
      await fetchTeacherData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل إرسال الطلب الإداري');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

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
          <Text style={styles.loadingText}>جاري تحميل فضاء الأستاذ من الخادم...</Text>
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
            <Text style={styles.activeRouteSubText}>فضاء التواصل والشبكة المدرسية</Text>
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
            <Text style={styles.activeRouteSubText}>الرسائل والمحادثات التربوية</Text>
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
          {/* Welcome Banner */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeTexts}>
              <View style={styles.roleTag}>
                <Sparkles size={12} color={theme.colors.gold[500]} />
                <Text style={styles.roleTagText}>فضاء الأستاذ والتعليم</Text>
              </View>
              <Text style={styles.welcomeTitle}>
                مرحباً بالأستاذ {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.welcomeSub}>
                متابعة الدروس، تسجيل المواظبة اليومية، والملفات البيداغوجية
              </Text>
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statBox}
              onPress={() => setCurrentRoute('courses')}
            >
              <Text style={styles.statNumber}>{courses.length}</Text>
              <Text style={styles.statLabel}>الدروس المنشورة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statBox}
              onPress={() => setCurrentRoute('classes')}
            >
              <Text style={styles.statNumber}>{assignedClasses.length}</Text>
              <Text style={styles.statLabel}>الأقسام المسندة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statBox}
              onPress={() => setCurrentRoute('attendance')}
            >
              <Text style={styles.statNumber}>{attendanceHistory.length}</Text>
              <Text style={styles.statLabel}>جلسات الحضور</Text>
            </TouchableOpacity>
          </View>

          {/* Subview 1: Overview */}
          {currentRoute === 'overview' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>الدروس والمذكرات الحديثة</Text>
                <TouchableOpacity
                  onPress={() => setShowCourseModal(true)}
                  style={styles.actionBtnSmall}
                >
                  <Plus size={14} color="#FFFFFF" />
                  <Text style={styles.actionBtnSmallText}>درس جديد</Text>
                </TouchableOpacity>
              </View>

              {courses.length === 0 ? (
                <View style={styles.emptyCard}>
                  <BookOpen size={36} color={theme.colors.brand[300]} />
                  <Text style={styles.emptyTitle}>لم تنشر أي دروس بعد</Text>
                  <Text style={styles.emptySub}>
                    انقر على زر "درس جديد" لرفع وتوزيع الدروس والواجبات على الأقسام.
                  </Text>
                </View>
              ) : (
                courses.slice(0, 3).map((item) => (
                  <View key={item._id} style={styles.courseCard}>
                    <View style={styles.courseHeader}>
                      <View style={styles.subjectBadge}>
                        <Text style={styles.subjectBadgeText}>{item.subject || 'مادة'}</Text>
                      </View>
                      <Text style={styles.courseTitle}>{item.title}</Text>
                    </View>
                    {item.description ? (
                      <Text style={styles.courseDesc} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                    <View style={styles.courseFooter}>
                      <Text style={styles.courseClass}>
                        القسم: {item.class?.name || 'قسم عام'}
                      </Text>
                      <TouchableOpacity onPress={() => handleDeleteCourse(item._id)}>
                        <Trash2 size={16} color={theme.colors.status.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              {/* Attendance Quick Shortcut */}
              <View style={[styles.sectionHeaderRow, { marginTop: theme.spacing.lg }]}>
                <Text style={styles.sectionTitle}>تسجيل حضور وغياب اليوم</Text>
                <TouchableOpacity
                  onPress={() => setCurrentRoute('attendance')}
                  style={styles.textLinkBtn}
                >
                  <Text style={styles.textLink}>فتح السجل الكامل ←</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.infoBanner}>
                <CheckSquare size={18} color={theme.colors.brand[500]} />
                <Text style={styles.infoBannerText}>
                  يمكنك تسجيل حضور وغياب تلاميذك بدقة مع حفظ فوري في قاعدة البيانات وإشعار الأولياء
                  تلقائياً.
                </Text>
              </View>
            </View>
          )}

          {/* Subview 2: Courses Management */}
          {currentRoute === 'courses' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>مستودع الدروس والمذكرات</Text>
                <TouchableOpacity
                  onPress={() => setShowCourseModal(true)}
                  style={styles.actionBtnSmall}
                >
                  <Plus size={14} color="#FFFFFF" />
                  <Text style={styles.actionBtnSmallText}>نشر درس جديد</Text>
                </TouchableOpacity>
              </View>

              {courses.map((item) => (
                <View key={item._id} style={styles.courseCard}>
                  <View style={styles.courseHeader}>
                    <View style={styles.subjectBadge}>
                      <Text style={styles.subjectBadgeText}>{item.subject}</Text>
                    </View>
                    <Text style={styles.courseTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.courseDesc}>{item.description || 'لا يوجد وصف ملحق'}</Text>
                  <View style={styles.courseFooter}>
                    <Text style={styles.courseClass}>القسم: {item.class?.name || 'عام'}</Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteCourse(item._id)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={16} color={theme.colors.status.danger} />
                      <Text style={styles.deleteBtnText}>حذف الدرس</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Subview 3: Student Attendance Register */}
          {currentRoute === 'attendance' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>سجل حضور وغياب التلاميذ</Text>

              {/* Class Selector Chips */}
              <Text style={styles.inputLabel}>اختر القسم الدراسي:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {assignedClasses.map((cls) => {
                  const isSelected = selectedClassId === cls._id;
                  return (
                    <TouchableOpacity
                      key={cls._id}
                      onPress={() => setSelectedClassId(cls._id)}
                      style={[styles.classChip, isSelected && styles.classChipActive]}
                    >
                      <Text
                        style={[styles.classChipText, isSelected && styles.classChipTextActive]}
                      >
                        {cls.name} ({cls.level || 'ابتدائي'})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Students List in Selected Class */}
              <View style={styles.rosterHeader}>
                <Text style={styles.rosterTitle}>
                  قائمة التلاميذ ({classStudents.length} تلميذ)
                </Text>
                <Text style={styles.rosterDate}>التاريخ: {attendanceDate}</Text>
              </View>

              {loadingStudents ? (
                <ActivityIndicator size="small" color={theme.colors.brand[500]} />
              ) : classStudents.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Users size={32} color={theme.colors.brand[300]} />
                  <Text style={styles.emptyTitle}>لا يوجد تلاميذ مسجلين بهذا القسم</Text>
                </View>
              ) : (
                classStudents.map((st) => {
                  const currentStatus = attendanceRecords[st._id] || 'Present';
                  const name = `${st.firstNameArabic || st.user?.firstName || ''} ${
                    st.lastNameArabic || st.user?.lastName || ''
                  }`.trim();

                  return (
                    <View key={st._id} style={styles.studentAttendanceCard}>
                      <View style={styles.studentInfoRow}>
                        <Text style={styles.studentNameText}>{name}</Text>
                        <Text style={styles.studentRegText}>
                          {st.registrationNumber || 'REG-26'}
                        </Text>
                      </View>

                      {/* 4 Status Buttons: Present, Absent, Late, Justified */}
                      <View style={styles.statusButtonsRow}>
                        {[
                          { id: 'Present', label: 'حاضر', color: '#047857', bg: '#D1FAE5' },
                          { id: 'Absent', label: 'غائب', color: '#B91C1C', bg: '#FEE2E2' },
                          { id: 'Late', label: 'متأخر', color: '#B45309', bg: '#FEF3C7' },
                          { id: 'Justified', label: 'مبرر', color: '#4338CA', bg: '#E0E7FF' },
                        ].map((btn) => {
                          const isActive = currentStatus === btn.id;
                          return (
                            <TouchableOpacity
                              key={btn.id}
                              onPress={() =>
                                setAttendanceRecords((prev) => ({ ...prev, [st._id]: btn.id }))
                              }
                              style={[
                                styles.statusBtn,
                                { borderColor: btn.color },
                                isActive && { backgroundColor: btn.bg },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBtnText,
                                  { color: btn.color },
                                  isActive && { fontWeight: '800' },
                                ]}
                              >
                                {btn.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })
              )}

              {classStudents.length > 0 && (
                <Button
                  label={savingAttendance ? 'جاري الحفظ في الخادم...' : 'حفظ ورقة الحضور'}
                  onPress={handleSaveAttendance}
                  isLoading={savingAttendance}
                  style={{ marginTop: theme.spacing.lg }}
                />
              )}
            </View>
          )}

          {/* Subview: Assigned Classes & Students */}
          {currentRoute === 'classes' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>الأقسام المسندة إليّ ({assignedClasses.length})</Text>
              </View>

              {assignedClasses.length === 0 ? (
                <View style={styles.emptyCard}>
                  <BookOpen size={36} color={theme.colors.brand[300]} />
                  <Text style={styles.emptyTitle}>لا توجد أقسام مسندة إليك</Text>
                  <Text style={styles.emptySub}>
                    يرجى مراجعة إدارة المؤسسة لإسناد أقسامك وفصولك التعليمية.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.inputLabel}>حدد القسم لعرض تلاميذه المعتمدين:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {assignedClasses.map((cls) => {
                      const isSelected = selectedClassId === cls._id;
                      return (
                        <TouchableOpacity
                          key={cls._id}
                          onPress={() => setSelectedClassId(cls._id)}
                          style={[styles.classChip, isSelected && styles.classChipActive]}
                        >
                          <Text
                            style={[styles.classChipText, isSelected && styles.classChipTextActive]}
                          >
                            {cls.name} ({cls.level === 'secondary' ? 'ثانوي' : cls.level === 'middle' ? 'متوسط' : 'ابتدائي'})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Actions Bar for the selected class */}
                  <View style={styles.classActionBar}>
                    <TouchableOpacity
                      style={styles.classActionBtnCourse}
                      onPress={() => {
                        setCourseClassId(selectedClassId);
                        setShowCourseModal(true);
                      }}
                    >
                      <Plus size={14} color="#FFFFFF" />
                      <Text style={styles.classActionBtnText}>إضافة درس لهذا القسم</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.classActionBtnAttendance}
                      onPress={() => {
                        setCurrentRoute('attendance');
                      }}
                    >
                      <CheckSquare size={14} color="#FFFFFF" />
                      <Text style={styles.classActionBtnText}>تسجيل الحضور</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Students in Selected Class */}
                  <View style={styles.rosterHeader}>
                    <Text style={styles.rosterTitle}>
                      تلاميذ القسم ({classStudents.length} تلميذ)
                    </Text>
                  </View>

                  {loadingStudents ? (
                    <ActivityIndicator size="small" color={theme.colors.brand[500]} />
                  ) : classStudents.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Users size={32} color={theme.colors.brand[300]} />
                      <Text style={styles.emptyTitle}>لا يوجد تلاميذ مسجلون في هذا القسم</Text>
                    </View>
                  ) : (
                    classStudents.map((st) => {
                      const fullName = `${st.firstNameArabic || st.user?.firstName || ''} ${st.lastNameArabic || st.user?.lastName || ''}`.trim();
                      const parentPhone = st.parent?.user?.phoneNumber || st.user?.phoneNumber || '';

                      return (
                        <View key={st._id} style={styles.studentRosterCard}>
                          <View style={styles.studentRosterAvatar}>
                            <Text style={styles.studentRosterAvatarText}>
                              {(st.firstNameArabic?.[0] || st.user?.firstName?.[0] || 'ت')}
                            </Text>
                          </View>
                          <View style={styles.studentRosterInfo}>
                            <View style={styles.studentRosterHeaderRow}>
                              <Text style={styles.studentRosterName}>{fullName}</Text>
                              {st.group?.name && (
                                <Text style={styles.studentRosterGroupBadge}>{st.group.name}</Text>
                              )}
                            </View>
                            <View style={styles.studentRosterSubRow}>
                              <Text style={styles.studentRosterReg}>
                                رقم: {st.registrationNumber || 'REG-2026'}
                              </Text>
                              {parentPhone ? (
                                <Text style={styles.studentRosterPhone}>
                                  هاتف: {parentPhone}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}
                </>
              )}
            </View>
          )}

          {/* Subview 4: Cahier de texte (Lessons) */}
          {currentRoute === 'lessons' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>كراس الدروس والواجبات (Cahier de texte)</Text>
              {lessonsList.length === 0 ? (
                <View style={styles.emptyCard}>
                  <BookOpen size={36} color={theme.colors.brand[300]} />
                  <Text style={styles.emptyTitle}>لا توجد مذكرات دروس مسجلة</Text>
                </View>
              ) : (
                lessonsList.map((lesson) => (
                  <View key={lesson._id} style={styles.courseCard}>
                    <Text style={styles.courseTitle}>{lesson.title || lesson.subject}</Text>
                    <Text style={styles.courseDesc}>{lesson.content || lesson.summary}</Text>
                    <View style={styles.courseFooter}>
                      <Text style={styles.courseClass}>القسم: {lesson.class?.name || 'عام'}</Text>
                      <Text style={styles.courseClass}>
                        {new Date(lesson.createdAt || Date.now()).toLocaleDateString('ar-DZ')}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Subview 6: Assigned Classes */}
          {currentRoute === 'classes' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>الأقسام المسندة وتلاميذها</Text>
              </View>

              {assignedClasses.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Users size={36} color={theme.colors.brand[300]} />
                  <Text style={styles.emptyTitle}>لا توجد أقسام مسندة حالياً</Text>
                  <Text style={styles.emptySub}>
                    لم يتم إسناد أي فوج دراسي لحسابك من قبل الإدارة بعد.
                  </Text>
                </View>
              ) : (
                assignedClasses.map((cls) => (
                  <View key={cls._id} style={styles.courseCard}>
                    <View style={styles.courseHeader}>
                      <View style={[styles.badge, styles.badgeApproved]}>
                        <Text style={styles.badgeText}>{cls.level || 'طور تعليمي'}</Text>
                      </View>
                      <Text style={styles.courseTitle}>{cls.name}</Text>
                    </View>
                    <Text style={styles.courseDesc}>
                      السنة الدراسية: {cls.academicYear || '2026-2027'} • النظام التربوي المعتمد
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Subview 7: Weekly Timetable */}
          {currentRoute === 'timetable' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>جدول التوقيت والحصص الأسبوعية</Text>
              </View>

              <View style={styles.courseCard}>
                <View style={styles.courseHeader}>
                  <View style={[styles.badge, styles.badgeApproved]}>
                    <Text style={styles.badgeText}>الأحد - الخميس</Text>
                  </View>
                  <Text style={styles.courseTitle}>مخطط الحصص الأسبوعي للأستاذ</Text>
                </View>
                <Text style={styles.courseDesc}>
                  التوقيت معتمد رسمياً من الإدارة وفق النموذج الوطني والمقرر الوزاري.
                </Text>
              </View>

              {assignedClasses.map((cls, idx) => (
                <View key={`tt-${cls._id || idx}`} style={styles.courseCard}>
                  <View style={styles.courseHeader}>
                    <View style={styles.badgePending}>
                      <Text style={styles.badgeText}>08:00 - 10:00</Text>
                    </View>
                    <Text style={styles.courseTitle}>{cls.name}</Text>
                  </View>
                  <Text style={styles.courseDesc}>
                    المادة: حصة تدريس أساسية • القاعة: قاعة التدريس رقم {idx + 1}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal: Upload New Course */}
      <Modal visible={showCourseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>نشر درس أو مذكرة جديدة</Text>
              <TouchableOpacity onPress={() => setShowCourseModal(false)}>
                <X size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>عنوان الدرس *</Text>
                <TextInput
                  value={courseTitle}
                  onChangeText={setCourseTitle}
                  placeholder="مثال: العمليات على الكسور العشرية"
                  placeholderTextColor={theme.colors.text.subtle}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>المادة الدراسية *</Text>
                <TextInput
                  value={courseSubject}
                  onChangeText={setCourseSubject}
                  placeholder="مثال: الرياضيات"
                  placeholderTextColor={theme.colors.text.subtle}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>اختر القسم *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {assignedClasses.map((cls) => {
                    const isSelected = courseClassId === cls._id;
                    return (
                      <TouchableOpacity
                        key={cls._id}
                        onPress={() => setCourseClassId(cls._id)}
                        style={[styles.classChip, isSelected && styles.classChipActive]}
                      >
                        <Text
                          style={[styles.classChipText, isSelected && styles.classChipTextActive]}
                        >
                          {cls.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>الوصف والتعليمات المرفقة</Text>
                <TextInput
                  value={courseDesc}
                  onChangeText={setCourseDesc}
                  placeholder="أدخل توجيهات الدرس أو الواجب المنزلي..."
                  placeholderTextColor={theme.colors.text.subtle}
                  multiline
                  numberOfLines={3}
                  style={[styles.textInput, styles.textArea]}
                />
              </View>

              <Button
                label={isUploadingCourse ? 'جاري النشر...' : 'نشر الدرس للقسم'}
                onPress={handleCreateCourse}
                isLoading={isUploadingCourse}
                style={{ marginTop: theme.spacing.md }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: New Admin Request */}
      <Modal visible={showRequestModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تقديم طلب إداري للإدارة</Text>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <X size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>نوع الطلب *</Text>
              <TextInput
                value={requestType}
                onChangeText={setRequestType}
                placeholder="شهادة عمل، ترخيص غياب، وثيقة..."
                placeholderTextColor={theme.colors.text.subtle}
                style={styles.textInput}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>تفاصيل الطلب ومبرراته *</Text>
              <TextInput
                value={requestDetails}
                onChangeText={setRequestDetails}
                placeholder="وضح موضوع الطلب بدقة..."
                placeholderTextColor={theme.colors.text.subtle}
                multiline
                numberOfLines={4}
                style={[styles.textInput, styles.textArea]}
              />
            </View>

            <Button
              label={isSubmittingRequest ? 'جاري الإرسال...' : 'إرسال الطلب للإدارة'}
              onPress={handleCreateRequest}
              isLoading={isSubmittingRequest}
              style={{ marginTop: theme.spacing.md }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.background,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
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
  welcomeTexts: {
    alignItems: 'flex-end',
  },
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
  roleTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
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
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
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
    textAlign: 'right',
  },
  actionBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.brand[500],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.sm,
  },
  actionBtnSmallText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  textLinkBtn: {
    paddingVertical: 4,
  },
  textLink: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface.elevated,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.primary,
    textAlign: 'right',
    lineHeight: 18,
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
  emptySub: {
    fontSize: 12,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  courseCard: {
    backgroundColor: theme.colors.surface.card,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subjectBadge: {
    backgroundColor: theme.colors.surface.elevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  courseDesc: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    lineHeight: 18,
    marginVertical: 4,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
    paddingTop: 6,
  },
  courseClass: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.muted,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.status.danger,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'right',
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  classChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface.card,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginLeft: 6,
  },
  classChipActive: {
    backgroundColor: theme.colors.brand[500],
    borderColor: theme.colors.brand[500],
  },
  classChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  classChipTextActive: {
    color: '#FFFFFF',
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  rosterTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  rosterDate: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  studentAttendanceCard: {
    backgroundColor: theme.colors.surface.card,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginBottom: 8,
  },
  studentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  studentNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  studentRegText: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    backgroundColor: theme.colors.surface.background,
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeApproved: { backgroundColor: '#D1FAE5' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeRejected: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface.card,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
    paddingBottom: theme.spacing.sm,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  formGroup: {
    marginBottom: theme.spacing.md,
  },
  textInput: {
    backgroundColor: theme.colors.surface.input,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
  textArea: {
    height: 75,
    textAlignVertical: 'top',
  },
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
  classActionBar: {
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  classActionBtnCourse: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.brand[500],
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radii.md,
  },
  classActionBtnAttendance: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#047857',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radii.md,
  },
  classActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  studentRosterCard: {
    flexDirection: 'row-reverse',
    backgroundColor: theme.colors.surface.card,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    gap: 12,
    ...theme.shadows.card,
  },
  studentRosterAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface.input,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentRosterAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  studentRosterInfo: {
    flex: 1,
  },
  studentRosterHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentRosterName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
  studentRosterGroupBadge: {
    fontSize: 10,
    color: '#0369A1',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '700',
  },
  studentRosterSubRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  studentRosterReg: {
    fontSize: 11,
    color: theme.colors.text.muted,
    textAlign: 'right',
  },
  studentRosterPhone: {
    fontSize: 11,
    color: theme.colors.brand[500],
    fontWeight: '600',
    textAlign: 'right',
  },
});
