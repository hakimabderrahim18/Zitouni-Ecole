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
  Image,
} from 'react-native';
import {
  Users,
  CreditCard,
  ShieldCheck,
  Calendar,
  BookOpen,
  CheckCircle,
  Clock,
  Sparkles,
  Search,
  Plus,
  Baby,
  Download,
  AlertCircle,
  Check,
  X,
  GraduationCap,
  FileText,
  Banknote,
  Globe,
} from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { theme } from '../../theme/tokens';
import { DashboardHeader } from '../DashboardHeader';
import { NavigationDrawer } from '../NavigationDrawer';
import { Button } from '../common/Button';

interface ParentDashboardViewProps {
  onOpenDrawer: () => void;
  currentRoute: string;
  setCurrentRoute: (r: string) => void;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({
  onOpenDrawer,
  currentRoute,
  setCurrentRoute,
}) => {
  const { user } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [exitPasses, setExitPasses] = useState<any[]>([]);
  const [lessonsList, setLessonsList] = useState<any[]>([]);

  // Child details loading
  const [loadingDetails, setLoadingDetails] = useState(false);

  // New Exit Pass Modal State
  const [showExitPassModal, setShowExitPassModal] = useState(false);
  const [exitReason, setExitReason] = useState('موعد فحص طبي مستعجل');
  const [exitTime, setExitTime] = useState('11:30');
  const [accompaniedBy, setAccompaniedBy] = useState('الأب / الأم');
  const [isSubmittingExit, setIsSubmittingExit] = useState(false);

  // Payment Modal State
  const [payingInvoice, setPayingInvoice] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch Parent core data
  const fetchParentData = useCallback(async () => {
    try {
      const [childRes, payRes, exitRes, lessonsRes] = await Promise.all([
        apiClient.get('/api/parents/children').catch(() => ({ data: [] })),
        apiClient.get('/api/parents/payments').catch(() => ({ data: [] })),
        apiClient.get('/api/parents/exit-passes').catch(() => ({ data: [] })),
        apiClient.get('/api/lessons').catch(() => ({ data: [] })),
      ]);

      const cData = Array.isArray(childRes.data) ? childRes.data : [];
      setChildren(cData);

      const pData = Array.isArray(payRes.data) ? payRes.data : [];
      setPayments(pData);

      const eData = Array.isArray(exitRes.data) ? exitRes.data : [];
      setExitPasses(eData);

      const lData = Array.isArray(lessonsRes.data) ? lessonsRes.data : [];
      setLessonsList(lData);

      if (cData.length > 0 && !selectedChild) {
        setSelectedChild(cData[0]);
        fetchChildDetails(cData[0]._id);
      }
    } catch (err: any) {
      console.warn('Parent data error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedChild]);

  // Fetch details for selected child
  const fetchChildDetails = async (childId: string) => {
    if (!childId) return;
    setLoadingDetails(true);
    try {
      const [attRes, schedRes] = await Promise.all([
        apiClient.get(`/api/parents/children/${childId}/attendance`).catch(() => ({ data: [] })),
        apiClient.get(`/api/parents/children/${childId}/schedules`).catch(() => ({ data: [] })),
      ]);
      setAttendanceRecords(Array.isArray(attRes.data) ? attRes.data : []);
      setSchedules(Array.isArray(schedRes.data) ? schedRes.data : []);
    } catch (err) {
      console.warn('Child details error:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchParentData();
  }, [fetchParentData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchParentData();
    if (selectedChild?._id) {
      await fetchChildDetails(selectedChild._id);
    }
    setRefreshing(false);
  };

  const handleSelectChild = (child: any) => {
    setSelectedChild(child);
    fetchChildDetails(child._id);
  };

  // Submit Exit Pass
  const handleCreateExitPass = async () => {
    if (!selectedChild?._id || !exitReason.trim()) {
      Alert.alert('تنبيه', 'يرجى تحديد الابن وكتابة سبب الخروج المبرر.');
      return;
    }

    setIsSubmittingExit(true);
    try {
      await apiClient.post('/api/parents/exit-pass-request', {
        studentId: selectedChild._id,
        reason: exitReason.trim(),
        exitTime: exitTime.trim() || '11:30',
        accompaniedBy: accompaniedBy.trim() || 'ولي الأمر',
      });

      Alert.alert('نجاح', 'تم إرسال طلب إذن الخروج لإدارة المدرسة للموافقة.');
      setShowExitPassModal(false);
      setExitReason('موعد فحص طبي مستعجل');
      await fetchParentData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل إرسال طلب الخروج');
    } finally {
      setIsSubmittingExit(false);
    }
  };

  // Process Online / In-app Tuition Payment
  const handlePayBill = async () => {
    if (!payingInvoice?._id) return;

    setIsProcessingPayment(true);
    try {
      await apiClient.post('/api/parents/payments/pay', {
        paymentId: payingInvoice._id,
        paymentMethod: 'Online',
      });

      Alert.alert('تم بنجاح', 'تم سداد الرسوم المدرسية بنجاح وتوليد الوصل الرقمي.');
      setPayingInvoice(null);
      await fetchParentData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل معالجة الدفع');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Summary counts
  const pendingPayments = useMemo(() => {
    return payments.filter((p) => p.status === 'Pending');
  }, [payments]);

  const totalPendingAmount = useMemo(() => {
    return pendingPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  }, [pendingPayments]);

  const totalAbsences = useMemo(() => {
    return attendanceRecords.filter((a) => a.status === 'Absent').length;
  }, [attendanceRecords]);

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
          <Text style={styles.loadingText}>جاري تحميل فضاء ولي الأمر من الخادم...</Text>
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
                <Text style={styles.roleTagText}>فضاء أولياء التلاميذ</Text>
              </View>
              <Text style={styles.welcomeTitle}>
                مرحباً بالسيد {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.welcomeSub}>
                متابعة تمدرس الأبناء، الحضور، النتائج، ودفع الرسوم المدرسية
              </Text>
            </View>
          </View>

          {/* Children Selector Carousel */}
          <Text style={styles.selectorTitle}>أبنائي المتمدرسين بالمؤسسة:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.childrenScroll}
          >
            {children.map((child) => {
              const isSelected = selectedChild?._id === child._id;
              const name = `${child.firstNameArabic || child.user?.firstName || ''} ${
                child.lastNameArabic || child.user?.lastName || ''
              }`.trim();
              const className = child.class?.name || 'قسم عام';

              return (
                <TouchableOpacity
                  key={child._id}
                  onPress={() => handleSelectChild(child)}
                  style={[styles.childCard, isSelected && styles.childCardActive]}
                  activeOpacity={0.85}
                >
                  <View style={styles.childAvatar}>
                    <Text style={styles.childAvatarText}>{child.firstNameArabic?.[0] || 'ت'}</Text>
                  </View>
                  <Text style={[styles.childName, isSelected && styles.childNameActive]}>
                    {name}
                  </Text>
                  <View style={styles.childClassBadge}>
                    <GraduationCap size={11} color={theme.colors.brand[500]} />
                    <Text style={styles.childClassText}>{className}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Selected Child Info Badge */}
          {selectedChild && (
            <View style={styles.selectedChildBanner}>
              <View style={styles.bannerInfo}>
                <Text style={styles.bannerName}>
                  الملف التربوي: {selectedChild.firstNameArabic} {selectedChild.lastNameArabic}
                </Text>
                <Text style={styles.bannerDetails}>
                  رقم التسجيل: {selectedChild.registrationNumber || 'REG-26'} | النظام:{' '}
                  {selectedChild.regime || 'نصف داخلي'}
                </Text>
              </View>
              <View
                style={[
                  styles.tuitionPill,
                  selectedChild.tuitionPaid
                    ? styles.tuitionPillPaid
                    : styles.tuitionPillPending,
                ]}
              >
                <Text
                  style={[
                    styles.tuitionPillText,
                    selectedChild.tuitionPaid
                      ? styles.tuitionTextPaid
                      : styles.tuitionTextPending,
                  ]}
                >
                  {selectedChild.tuitionPaid ? 'الرسوم مسددة' : 'رسوم غير مسددة'}
                </Text>
              </View>
            </View>
          )}

          {/* Subview 1: Overview */}
          {currentRoute === 'overview' && (
            <View style={styles.section}>
              {/* Quick Metrics */}
              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>{totalAbsences}</Text>
                  <Text style={styles.metricLbl}>الغيابات المسجلة</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={[styles.metricVal, { color: theme.colors.status.danger }]}>
                    {totalPendingAmount.toLocaleString()} دج
                  </Text>
                  <Text style={styles.metricLbl}>المستحقات المعلقة</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>{exitPasses.length}</Text>
                  <Text style={styles.metricLbl}>أذونات الخروج</Text>
                </View>
              </View>

              {/* Attendance Records Preview */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>آخر سجلات المواظبة والغياب</Text>
              </View>
              {loadingDetails ? (
                <ActivityIndicator size="small" color={theme.colors.brand[500]} />
              ) : attendanceRecords.length === 0 ? (
                <View style={styles.emptyCard}>
                  <CheckCircle size={32} color={theme.colors.status.success} />
                  <Text style={styles.emptyTitle}>المواظبة ممتازة</Text>
                  <Text style={styles.emptySub}>لا توجد أي غيابات مسجلة بحق التلميذ حتى الآن.</Text>
                </View>
              ) : (
                attendanceRecords.slice(0, 4).map((record) => (
                  <View key={record._id} style={styles.attendanceItem}>
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
                    <View style={styles.attInfo}>
                      <Text style={styles.attDate}>
                        {new Date(record.date).toLocaleDateString('ar-DZ')}
                      </Text>
                      <Text style={styles.attRemarks}>
                        {record.remarks || (record.status === 'Absent' ? 'غير مبرر' : 'منتظم')}
                      </Text>
                    </View>
                  </View>
                ))
              )}

              {/* Quick Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  onPress={() => setShowExitPassModal(true)}
                  style={styles.actionBtnPrimary}
                >
                  <ShieldCheck size={18} color="#FFFFFF" />
                  <Text style={styles.actionBtnPrimaryText}>طلب إذن خروج مبكر</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCurrentRoute('payments')}
                  style={styles.actionBtnSecondary}
                >
                  <CreditCard size={18} color={theme.colors.brand[500]} />
                  <Text style={styles.actionBtnSecondaryText}>عرض فواتير الرسوم المدرسية</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Subview 2: Payments & Invoices */}
          {currentRoute === 'payments' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>سجل الفواتير والمستحقات المدرسية</Text>
                <Text style={styles.pendingSumText}>
                  المجموع المعلق: {totalPendingAmount.toLocaleString()} دج
                </Text>
              </View>

              {payments.length === 0 ? (
                <View style={styles.emptyCard}>
                  <CreditCard size={36} color={theme.colors.brand[300]} />
                  <Text style={styles.emptyTitle}>لا توجد فواتير مسجلة</Text>
                </View>
              ) : (
                payments.map((p) => {
                  const isPaid = p.status === 'Paid';
                  return (
                    <View key={p._id} style={styles.paymentCard}>
                      <View style={styles.paymentHeader}>
                        <View
                          style={[
                            styles.badge,
                            isPaid ? styles.badgeApproved : styles.badgePending,
                          ]}
                        >
                          <Text style={styles.badgeText}>
                            {isPaid ? 'مسدد بالكامل' : 'قيد السداد'}
                          </Text>
                        </View>
                        <Text style={styles.paymentAmount}>
                          {p.amount?.toLocaleString()} {p.currency || 'DZD'}
                        </Text>
                      </View>

                      <View style={styles.divider} />

                      <Text style={styles.paymentType}>
                        طبيعة الرسم: {p.type === 'Tuition' ? 'قسط التمدرس السنوي' : p.type}
                      </Text>
                      <Text style={styles.paymentDate}>
                        التاريخ: {new Date(p.createdAt || Date.now()).toLocaleDateString('ar-DZ')}
                      </Text>

                      {!isPaid && (
                        <TouchableOpacity
                          onPress={() => setPayingInvoice(p)}
                          style={styles.payBtn}
                        >
                          <CreditCard size={15} color="#FFFFFF" />
                          <Text style={styles.payBtnText}>تسديد الفاتورة الآن</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* Subview 3: Exit Passes */}
          {currentRoute === 'exit-passes' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>طلبات أذونات الخروج للتلاميذ</Text>
                <TouchableOpacity
                  onPress={() => setShowExitPassModal(true)}
                  style={styles.actionBtnSmall}
                >
                  <Plus size={14} color="#FFFFFF" />
                  <Text style={styles.actionBtnSmallText}>طلب خروج</Text>
                </TouchableOpacity>
              </View>

              {exitPasses.length === 0 ? (
                <View style={styles.emptyCard}>
                  <ShieldCheck size={36} color={theme.colors.brand[300]} />
                  <Text style={styles.emptyTitle}>لا توجد أذونات خروج سابقة</Text>
                </View>
              ) : (
                exitPasses.map((pass) => (
                  <View key={pass._id} style={styles.paymentCard}>
                    <View style={styles.paymentHeader}>
                      <View
                        style={[
                          styles.badge,
                          pass.status === 'Approved'
                            ? styles.badgeApproved
                            : pass.status === 'Rejected'
                            ? styles.badgeRejected
                            : styles.badgePending,
                        ]}
                      >
                        <Text style={styles.badgeText}>
                          {pass.status === 'Approved'
                            ? 'موافق عليه'
                            : pass.status === 'Rejected'
                            ? 'مرفوض'
                            : 'قيد المعالجة'}
                        </Text>
                      </View>
                      <Text style={styles.paymentDate}>
                        وقت الخروج: {pass.exitTime || '11:30'}
                      </Text>
                    </View>
                    <Text style={styles.paymentType}>السبب: {pass.reason}</Text>
                    {pass.accompaniedBy && (
                      <Text style={styles.paymentDate}>المرافق: {pass.accompaniedBy}</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {/* Subview 4: Lessons (Cahier de texte) */}
          {currentRoute === 'lessons' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>كراس الدروس والواجبات المنزلية</Text>
              {lessonsList.length === 0 ? (
                <View style={styles.emptyCard}>
                  <BookOpen size={36} color={theme.colors.brand[300]} />
                  <Text style={styles.emptyTitle}>لا توجد واجبات منزلية مسجلة</Text>
                </View>
              ) : (
                lessonsList.map((lesson) => (
                  <View key={lesson._id} style={styles.paymentCard}>
                    <Text style={styles.lessonTitle}>{lesson.title || lesson.subject}</Text>
                    <Text style={styles.lessonDesc}>{lesson.content || lesson.summary}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal: Request Exit Pass */}
      <Modal visible={showExitPassModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>طلب إذن خروج مبكر للابن</Text>
              <TouchableOpacity onPress={() => setShowExitPassModal(false)}>
                <X size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>التلميذ المعني بالطلب</Text>
                <View style={styles.readonlyBox}>
                  <Text style={styles.readonlyText}>
                    {selectedChild?.firstNameArabic} {selectedChild?.lastNameArabic} (
                    {selectedChild?.class?.name})
                  </Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>وقت الخروج المرجو *</Text>
                <TextInput
                  value={exitTime}
                  onChangeText={setExitTime}
                  placeholder="مثال: 11:30"
                  placeholderTextColor={theme.colors.text.subtle}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>المرافق عند الخروج *</Text>
                <TextInput
                  value={accompaniedBy}
                  onChangeText={setAccompaniedBy}
                  placeholder="مثال: الأب، الأم، أو الوصي الشرعي"
                  placeholderTextColor={theme.colors.text.subtle}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>السبب المبرر للمغادرة *</Text>
                <TextInput
                  value={exitReason}
                  onChangeText={setExitReason}
                  placeholder="وضح سبب الخروج (موعد طبي، طارئ عائلي...)"
                  placeholderTextColor={theme.colors.text.subtle}
                  multiline
                  numberOfLines={3}
                  style={[styles.textInput, styles.textArea]}
                />
              </View>

              <Button
                label={isSubmittingExit ? 'جاري الإرسال...' : 'إرسال طلب إذن الخروج'}
                onPress={handleCreateExitPass}
                isLoading={isSubmittingExit}
                style={{ marginTop: theme.spacing.md }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Confirm Payment */}
      <Modal visible={!!payingInvoice} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تأكيد دفع الرسوم المدرسية</Text>
              <TouchableOpacity onPress={() => setPayingInvoice(null)}>
                <X size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.invoiceSummaryBox}>
              <Text style={styles.invoiceSummaryTitle}>تفاصيل الفاتورة:</Text>
              <Text style={styles.invoiceSummaryAmount}>
                {payingInvoice?.amount?.toLocaleString()} دج
              </Text>
              <Text style={styles.invoiceSummarySub}>
                طبيعة الرسم: {payingInvoice?.type} | الموسم الدراسي 2026-2027
              </Text>
            </View>

            <Button
              label={isProcessingPayment ? 'جاري معالجة السداد...' : 'تأكيد الدفع واستلام الوصل'}
              onPress={handlePayBill}
              isLoading={isProcessingPayment}
              style={{ marginTop: theme.spacing.lg }}
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
  selectorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'right',
    marginBottom: 8,
  },
  childrenScroll: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  childCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.surface.border,
    width: 125,
  },
  childCardActive: {
    borderColor: theme.colors.brand[500],
    backgroundColor: '#FCF8F2',
  },
  childAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  childAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  childName: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  childNameActive: {
    color: theme.colors.brand[500],
  },
  childClassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.surface.elevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  childClassText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  selectedChildBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.card,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginBottom: theme.spacing.md,
  },
  bannerInfo: {
    alignItems: 'flex-start',
    flex: 1,
  },
  bannerName: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  bannerDetails: {
    fontSize: 11,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  tuitionPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  tuitionPillPaid: { backgroundColor: '#DEF7EC' },
  tuitionPillPending: { backgroundColor: '#FEE2E2' },
  tuitionPillText: { fontSize: 10, fontWeight: '800' },
  tuitionTextPaid: { color: '#03543F' },
  tuitionTextPending: { color: '#9B1C1C' },
  section: {
    marginBottom: theme.spacing.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  metricLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  pendingSumText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.status.danger,
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
  },
  attendanceItem: {
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
  attBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  attBadgeAbsent: { backgroundColor: '#FEE2E2' },
  attBadgeLate: { backgroundColor: '#FEF3C7' },
  attBadgePresent: { backgroundColor: '#D1FAE5' },
  attBadgeText: { fontSize: 11, fontWeight: '800' },
  attInfo: { alignItems: 'flex-end' },
  attDate: { fontSize: 12, fontWeight: '700', color: theme.colors.text.primary },
  attRemarks: { fontSize: 11, color: theme.colors.text.muted },
  actionsContainer: {
    marginTop: theme.spacing.md,
    gap: 8,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.brand[500],
    paddingVertical: 12,
    borderRadius: theme.radii.md,
  },
  actionBtnPrimaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface.card,
    borderWidth: 1,
    borderColor: theme.colors.brand[500],
    paddingVertical: 12,
    borderRadius: theme.radii.md,
  },
  actionBtnSecondaryText: {
    color: theme.colors.brand[500],
    fontWeight: '800',
    fontSize: 13,
  },
  paymentCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginBottom: theme.spacing.sm,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.surface.border,
    marginVertical: 6,
  },
  paymentType: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
  paymentDate: {
    fontSize: 11,
    color: theme.colors.text.muted,
    textAlign: 'right',
    marginTop: 2,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.brand[500],
    paddingVertical: 8,
    borderRadius: theme.radii.sm,
    marginTop: 8,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeApproved: { backgroundColor: '#DEF7EC' },
  badgePending: { backgroundColor: '#FEF08A' },
  badgeRejected: { backgroundColor: '#FDE8E8' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  actionBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.brand[500],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.sm,
  },
  actionBtnSmallText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  lessonTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.brand[500],
    textAlign: 'right',
  },
  lessonDesc: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: 2,
  },
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
  formGroup: { marginBottom: theme.spacing.md },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'right',
    marginBottom: 6,
  },
  readonlyBox: {
    backgroundColor: theme.colors.surface.elevated,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  readonlyText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'right',
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
  invoiceSummaryBox: {
    backgroundColor: theme.colors.surface.elevated,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  invoiceSummaryTitle: { fontSize: 12, color: theme.colors.text.muted },
  invoiceSummaryAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.brand[500],
    marginVertical: 4,
  },
  invoiceSummarySub: { fontSize: 11, color: theme.colors.text.secondary },
});
