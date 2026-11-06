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
  ShieldAlert,
  ShieldCheck,
  CheckSquare,
  Users,
  Calendar,
  BookOpen,
  Plus,
  Clock,
  Sparkles,
  AlertTriangle,
  Check,
  X,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { theme } from '../../theme/tokens';
import { DashboardHeader } from '../DashboardHeader';
import { NavigationDrawer } from '../NavigationDrawer';
import { Button } from '../common/Button';

interface SupervisorDashboardViewProps {
  onOpenDrawer: () => void;
  currentRoute: string;
  setCurrentRoute: (r: string) => void;
}

export const SupervisorDashboardView: React.FC<SupervisorDashboardViewProps> = ({
  onOpenDrawer,
  currentRoute,
  setCurrentRoute,
}) => {
  const { user } = useAuthStore();
  const isGeneral = user?.role === 'general_supervisor';

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data
  const [dashboardData, setDashboardData] = useState<{
    staffAttendanceToday: any[];
    damagesToday: any[];
    canteenToday: any[];
    exitPassesToday: any[];
    allTeachers: any[];
    allClasses: any[];
  }>({
    staffAttendanceToday: [],
    damagesToday: [],
    canteenToday: [],
    exitPassesToday: [],
    allTeachers: [],
    allClasses: [],
  });

  const [exitPasses, setExitPasses] = useState<any[]>([]);

  // Staff Attendance Form State
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [staffAttStatus, setStaffAttStatus] = useState('Present');
  const [staffAttRemarks, setStaffAttRemarks] = useState('');
  const [isSavingStaffAtt, setIsSavingStaffAtt] = useState(false);

  // Damage Report Modal State
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [damageLocation, setDamageLocation] = useState('');
  const [damageDescription, setDamageDescription] = useState('');
  const [damageCost, setDamageCost] = useState('');
  const [isSavingDamage, setIsSavingDamage] = useState(false);

  // Canteen Modal State
  const [showCanteenModal, setShowCanteenModal] = useState(false);
  const [canteenMealType, setCanteenMealType] = useState('Lunch');
  const [canteenNotes, setCanteenNotes] = useState('');
  const [isSavingCanteen, setIsSavingCanteen] = useState(false);

  const fetchSupervisorData = useCallback(async () => {
    try {
      const [dashRes, exitRes] = await Promise.all([
        apiClient.get('/api/supervisors/dashboard').catch(() => ({ data: {} })),
        apiClient.get('/api/supervisors/exit-passes').catch(() => ({ data: [] })),
      ]);

      if (dashRes.data) {
        setDashboardData({
          staffAttendanceToday: dashRes.data.staffAttendanceToday || [],
          damagesToday: dashRes.data.damagesToday || [],
          canteenToday: dashRes.data.canteenToday || [],
          exitPassesToday: dashRes.data.exitPassesToday || [],
          allTeachers: dashRes.data.allTeachers || [],
          allClasses: dashRes.data.allClasses || [],
        });
        if (dashRes.data.allTeachers?.length > 0 && !selectedStaffId) {
          setSelectedStaffId(dashRes.data.allTeachers[0].user?._id || dashRes.data.allTeachers[0]._id);
        }
      }

      setExitPasses(Array.isArray(exitRes.data) ? exitRes.data : exitRes.data?.passes || []);
    } catch (err: any) {
      console.warn('Supervisor data error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedStaffId]);

  useEffect(() => {
    fetchSupervisorData();
  }, [fetchSupervisorData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSupervisorData();
    setRefreshing(false);
  };

  // Record Staff Attendance (with automated deduction)
  const handleRecordStaffAttendance = async () => {
    if (!selectedStaffId) {
      Alert.alert('تنبيه', 'يرجى اختيار الأستاذ أو الموظف أولاً.');
      return;
    }

    setIsSavingStaffAtt(true);
    try {
      await apiClient.post('/api/supervisors/staff-attendance', {
        staffUserId: selectedStaffId,
        status: staffAttStatus,
        remarks: staffAttRemarks,
      });

      Alert.alert(
        'تم بنجاح',
        staffAttStatus === 'Absent'
          ? 'تم تسجيل غياب الموظف بنجاح وتفعيل الخصم التلقائي من راتبه.'
          : 'تم تسجيل الحضور اليومي للموظف بنجاح.'
      );
      setStaffAttRemarks('');
      await fetchSupervisorData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تسجيل مواظبة الموظف');
    } finally {
      setIsSavingStaffAtt(false);
    }
  };

  // Record Damage Report
  const handleSaveDamage = async () => {
    if (!damageLocation.trim() || !damageDescription.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال مكان ووصف الضرر المسجل.');
      return;
    }

    setIsSavingDamage(true);
    try {
      await apiClient.post('/api/supervisors/damage', {
        location: damageLocation.trim(),
        description: damageDescription.trim(),
        estimatedCost: Number(damageCost) || 0,
      });

      Alert.alert('نجاح', 'تم تسجيل تقرير إتلاف العتاد وإخطار الإدارة العامة.');
      setShowDamageModal(false);
      setDamageLocation('');
      setDamageDescription('');
      setDamageCost('');
      await fetchSupervisorData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تسجيل تقرير الإتلاف');
    } finally {
      setIsSavingDamage(false);
    }
  };

  // Record Canteen Reservation
  const handleSaveCanteen = async () => {
    setIsSavingCanteen(true);
    try {
      await apiClient.post('/api/supervisors/canteen', {
        mealType: canteenMealType,
        isPaid: true,
        notes: canteenNotes.trim(),
      });

      Alert.alert('نجاح', 'تم تسجيل حجز الإطعام بنجاح.');
      setShowCanteenModal(false);
      setCanteenNotes('');
      await fetchSupervisorData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تسجيل حجز المطعم');
    } finally {
      setIsSavingCanteen(false);
    }
  };

  // Exit Pass Approve / Reject
  const handleApproveExit = async (id: string) => {
    try {
      await apiClient.put(`/api/supervisors/exit-pass/${id}/approve`);
      Alert.alert('تم بنجاح', 'تمت الموافقة على تصريح الخروج.');
      await fetchSupervisorData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل اعتماد التصريح');
    }
  };

  const handleRejectExit = async (id: string) => {
    try {
      await apiClient.put(`/api/supervisors/exit-pass/${id}/reject`, {
        reason: 'طلب غير مطابق للقانون الداخلي للمؤسسة',
      });
      Alert.alert('تم بنجاح', 'تم تسجيل رفض الطلب.');
      await fetchSupervisorData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل رفض التصريح');
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
          <Text style={styles.loadingText}>جاري تحميل فضاء المراقبة العامة من الخادم...</Text>
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
                <Text style={styles.roleTagText}>
                  {isGeneral ? 'المراقبة العامة والانضباط' : 'الإشراف البيداغوجي'}
                </Text>
              </View>
              <Text style={styles.welcomeTitle}>
                مرحباً بالمراقب {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.welcomeSub}>
                مواظبة الطاقم التربوي، الخصم الآلي، أذونات الخروج، وتقارير العتاد
              </Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {dashboardData.staffAttendanceToday?.length || 0}
              </Text>
              <Text style={styles.statLabel}>حضور الموظفين اليوم</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {exitPasses.filter((p) => p.status === 'Pending').length}
              </Text>
              <Text style={styles.statLabel}>أذونات معلقة</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{dashboardData.damagesToday?.length || 0}</Text>
              <Text style={styles.statLabel}>تقارير العتاد</Text>
            </View>
          </View>

          {/* Subview 1: Overview */}
          {currentRoute === 'overview' && (
            <View style={styles.section}>
              {/* Staff Attendance Quick Form */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>تسجيل حضور وغياب الأساتذة والموظفين</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.inputLabel}>اختر الأستاذ / الموظف المعني:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {dashboardData.allTeachers.map((t) => {
                    const uId = t.user?._id || t._id;
                    const isSelected = selectedStaffId === uId;
                    const name = `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.trim() || 'أستاذ';
                    return (
                      <TouchableOpacity
                        key={uId}
                        onPress={() => setSelectedStaffId(uId)}
                        style={[styles.staffChip, isSelected && styles.staffChipActive]}
                      >
                        <Text
                          style={[
                            styles.staffChipText,
                            isSelected && styles.staffChipTextActive,
                          ]}
                        >
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Status Selector */}
                <View style={styles.statusRow}>
                  {[
                    { id: 'Present', label: 'حاضر', color: '#047857', bg: '#D1FAE5' },
                    { id: 'Absent', label: 'غائب (خصم آلي)', color: '#B91C1C', bg: '#FEE2E2' },
                    { id: 'Late', label: 'تأخر', color: '#B45309', bg: '#FEF3C7' },
                  ].map((s) => {
                    const isSelected = staffAttStatus === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        onPress={() => setStaffAttStatus(s.id)}
                        style={[
                          styles.statusBtn,
                          { borderColor: s.color },
                          isSelected && { backgroundColor: s.bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBtnText,
                            { color: s.color },
                            isSelected && { fontWeight: '800' },
                          ]}
                        >
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TextInput
                  value={staffAttRemarks}
                  onChangeText={setStaffAttRemarks}
                  placeholder="ملاحظات المواظبة (اختياري)..."
                  placeholderTextColor={theme.colors.text.subtle}
                  style={styles.textInput}
                />

                <Button
                  label={isSavingStaffAtt ? 'جاري التسجيل...' : 'تسجيل حضور / غياب الموظف'}
                  onPress={handleRecordStaffAttendance}
                  isLoading={isSavingStaffAtt}
                  style={{ marginTop: theme.spacing.sm }}
                />
              </View>

              {/* Quick Actions Shortcuts */}
              <View style={styles.shortcutRow}>
                <TouchableOpacity
                  onPress={() => setShowDamageModal(true)}
                  style={styles.shortcutBtn}
                >
                  <ShieldAlert size={16} color={theme.colors.brand[500]} />
                  <Text style={styles.shortcutBtnText}>إبلاغ عن تلف عتاد</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowCanteenModal(true)}
                  style={styles.shortcutBtn}
                >
                  <BookOpen size={16} color={theme.colors.brand[500]} />
                  <Text style={styles.shortcutBtnText}>حجز الإطعام</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Subview 2: Exit Passes */}
          {(currentRoute === 'exit-passes' || currentRoute === 'overview') && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>تصاريح وأذونات الخروج المعلقة</Text>
              </View>

              {exitPasses.filter((p) => p.status === 'Pending').length === 0 ? (
                <View style={styles.emptyCard}>
                  <ShieldCheck size={32} color={theme.colors.status.success} />
                  <Text style={styles.emptyTitle}>لا توجد أذونات خروج قيد الانتظار</Text>
                </View>
              ) : (
                exitPasses
                  .filter((p) => p.status === 'Pending')
                  .slice(0, 3)
                  .map((pass) => (
                    <View key={pass._id} style={styles.passCard}>
                      <View style={styles.passHeader}>
                        <Text style={styles.passStudent}>
                          {pass.student?.firstNameArabic || pass.student?.user?.firstName}{' '}
                          {pass.student?.lastNameArabic || pass.student?.user?.lastName} (
                          {pass.class?.name || 'قسم'})
                        </Text>
                        <Text style={styles.passTime}>{pass.exitTime || '11:30'}</Text>
                      </View>
                      <Text style={styles.passReason}>السبب: {pass.reason}</Text>

                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          onPress={() => handleApproveExit(pass._id)}
                          style={[styles.actionBtn, styles.approveBtn]}
                        >
                          <CheckCircle2 size={15} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>قبول وتصريح</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRejectExit(pass._id)}
                          style={[styles.actionBtn, styles.rejectBtn]}
                        >
                          <XCircle size={15} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>رفض</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
              )}
            </View>
          )}

          {/* Subview 3: Damages */}
          {currentRoute === 'damages' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>تقارير إتلاف العتاد والتجهيزات</Text>
                <TouchableOpacity
                  onPress={() => setShowDamageModal(true)}
                  style={styles.actionBtnSmall}
                >
                  <Plus size={14} color="#FFFFFF" />
                  <Text style={styles.actionBtnSmallText}>تقرير جديد</Text>
                </TouchableOpacity>
              </View>

              {dashboardData.damagesToday.length === 0 ? (
                <View style={styles.emptyCard}>
                  <ShieldAlert size={36} color={theme.colors.brand[300]} />
                  <Text style={styles.emptyTitle}>لا توجد تقارير إتلاف مسجلة اليوم</Text>
                </View>
              ) : (
                dashboardData.damagesToday.map((dmg) => (
                  <View key={dmg._id} style={styles.passCard}>
                    <Text style={styles.passStudent}>المكان: {dmg.location}</Text>
                    <Text style={styles.passReason}>{dmg.description}</Text>
                    <Text style={styles.passTime}>
                      التكلفة التقديرية: {dmg.estimatedCost?.toLocaleString() || 0} دج
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal: Damage Report */}
      <Modal visible={showDamageModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إبلاغ رسمي عن إتلاف عتاد مدرسي</Text>
              <TouchableOpacity onPress={() => setShowDamageModal(false)}>
                <X size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>مكان وقوع الضرر *</Text>
              <TextInput
                value={damageLocation}
                onChangeText={setDamageLocation}
                placeholder="مثال: مخبر العلوم، القسم 3AP، الساحة..."
                placeholderTextColor={theme.colors.text.subtle}
                style={styles.textInput}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>وصف العتاد المتضرر وطبيعة التلف *</Text>
              <TextInput
                value={damageDescription}
                onChangeText={setDamageDescription}
                placeholder="وضح التجهيزات المتضررة والمسؤول عن الحادثة..."
                placeholderTextColor={theme.colors.text.subtle}
                multiline
                numberOfLines={3}
                style={[styles.textInput, styles.textArea]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>التكلفة التقديرية للإصلاح (دج)</Text>
              <TextInput
                value={damageCost}
                onChangeText={setDamageCost}
                placeholder="مثال: 5000"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.text.subtle}
                style={styles.textInput}
              />
            </View>

            <Button
              label={isSavingDamage ? 'جاري الحفظ...' : 'تسجيل التقرير وإخطار الإدارة'}
              onPress={handleSaveDamage}
              isLoading={isSavingDamage}
              style={{ marginTop: theme.spacing.md }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal: Canteen Reservation */}
      <Modal visible={showCanteenModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تسجيل حجز إطعام بالمطعم</Text>
              <TouchableOpacity onPress={() => setShowCanteenModal(false)}>
                <X size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>نوع الوجبة</Text>
              <View style={styles.statusRow}>
                {['Lunch', 'Snack'].map((m) => {
                  const isSel = canteenMealType === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setCanteenMealType(m)}
                      style={[styles.statusBtn, isSel && styles.staffChipActive]}
                    >
                      <Text
                        style={[styles.statusBtnText, isSel && styles.staffChipTextActive]}
                      >
                        {m === 'Lunch' ? 'وجبة غداء كاملة' : 'لمجة صباحية / مسائية'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>ملاحظات أو أسماء المستفيدين</Text>
              <TextInput
                value={canteenNotes}
                onChangeText={setCanteenNotes}
                placeholder="ملاحظات الحجز..."
                placeholderTextColor={theme.colors.text.subtle}
                style={styles.textInput}
              />
            </View>

            <Button
              label={isSavingCanteen ? 'جاري التأكيد...' : 'تأكيد الحجز بالمطعم'}
              onPress={handleSaveCanteen}
              isLoading={isSavingCanteen}
              style={{ marginTop: theme.spacing.md }}
            />
          </View>
        </View>
      </Modal>
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
    textAlign: 'right',
  },
  card: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    ...theme.shadows.card,
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'right',
    marginBottom: 6,
  },
  chipRow: { flexDirection: 'row', marginBottom: 10 },
  staffChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface.background,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginLeft: 6,
  },
  staffChipActive: {
    backgroundColor: theme.colors.brand[500],
    borderColor: theme.colors.brand[500],
  },
  staffChipText: { fontSize: 12, fontWeight: '700', color: theme.colors.text.primary },
  staffChipTextActive: { color: '#FFFFFF' },
  statusRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  statusBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    backgroundColor: theme.colors.surface.background,
  },
  statusBtnText: { fontSize: 11, fontWeight: '700' },
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
  textArea: { height: 75, textAlignVertical: 'top' },
  shortcutRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: 4 },
  shortcutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface.card,
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  shortcutBtnText: { fontSize: 12, fontWeight: '800', color: theme.colors.brand[500] },
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
  passCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginBottom: theme.spacing.sm,
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  passStudent: { fontSize: 13, fontWeight: '800', color: theme.colors.text.primary },
  passTime: { fontSize: 12, fontWeight: '700', color: theme.colors.text.muted },
  passReason: { fontSize: 12, color: theme.colors.text.secondary, marginVertical: 3 },
  actionsRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: theme.radii.sm,
  },
  approveBtn: { backgroundColor: theme.colors.status.success },
  rejectBtn: { backgroundColor: theme.colors.status.danger },
  actionBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
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
  modalTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.brand[500] },
  formGroup: { marginBottom: theme.spacing.md },
});
