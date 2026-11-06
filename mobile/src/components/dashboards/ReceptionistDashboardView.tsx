import React, { useState, useEffect, useCallback } from 'react';
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
  Users,
  ShieldCheck,
  Clock,
  Plus,
  Sparkles,
  Phone,
  Check,
  X,
  LogOut,
  CheckCircle,
} from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { theme } from '../../theme/tokens';
import { DashboardHeader } from '../DashboardHeader';
import { NavigationDrawer } from '../NavigationDrawer';
import { Button } from '../common/Button';
import { SchoolFeedView } from '../feed/SchoolFeedView';
import { ConversationView } from '../chat/ConversationView';

interface ReceptionistDashboardViewProps {
  onOpenDrawer: () => void;
  currentRoute: string;
  setCurrentRoute: (r: string) => void;
}

export const ReceptionistDashboardView: React.FC<ReceptionistDashboardViewProps> = ({
  onOpenDrawer,
  currentRoute,
  setCurrentRoute,
}) => {
  const { user } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [visitorsToday, setVisitorsToday] = useState<any[]>([]);
  const [exitPassesToday, setExitPassesToday] = useState<any[]>([]);

  // Visitor Check-in Modal
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorIdCard, setVisitorIdCard] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [personToVisit, setPersonToVisit] = useState('الإدارة العامة');
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const fetchReceptionistData = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/receptionist/dashboard');
      if (res.data) {
        setVisitorsToday(res.data.visitorsToday || []);
        setExitPassesToday(res.data.exitPassesToday || []);
      }
    } catch (err: any) {
      console.warn('Receptionist data error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceptionistData();
  }, [fetchReceptionistData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReceptionistData();
    setRefreshing(false);
  };

  // Check-in Visitor
  const handleCheckInVisitor = async () => {
    if (!visitorName.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم ولقب الزائر.');
      return;
    }

    setIsCheckingIn(true);
    try {
      await apiClient.post('/api/receptionist/visitors', {
        visitorName: visitorName.trim(),
        visitorPhone: visitorPhone.trim(),
        visitorIdCard: visitorIdCard.trim(),
        visitType: 'Parent / ولي أمر',
        purpose: visitPurpose.trim() || 'زيارة إدارية',
        personToVisit,
      });

      Alert.alert('نجاح', 'تم تسجيل دخول الزائر للمؤسسة بنجاح.');
      setShowVisitorModal(false);
      setVisitorName('');
      setVisitorPhone('');
      setVisitorIdCard('');
      setVisitPurpose('');
      await fetchReceptionistData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تسجيل دخول الزائر');
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Check-out Visitor
  const handleCheckOutVisitor = async (id: string) => {
    try {
      await apiClient.put(`/api/receptionist/visitors/${id}/checkout`);
      Alert.alert('نجاح', 'تم تسجيل مغادرة الزائر.');
      await fetchReceptionistData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تسجيل المغادرة');
    }
  };

  // Gate Verification for Exit Pass
  const handleVerifyGatePass = async (id: string) => {
    try {
      await apiClient.put(`/api/receptionist/exit-pass/${id}/verify`);
      Alert.alert('تم بنجاح', 'تم التحقق من إذن الخروج والسماح للتلميذ بالمغادرة عبر البوابة.');
      await fetchReceptionistData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تأكيد الخروج من البوابة');
    }
  };

  const activeVisitors = visitorsToday.filter((v) => !v.checkOutTime);

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
          <Text style={styles.loadingText}>جاري تحميل مكتب الاستقبال من الخادم...</Text>
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
            <Text style={styles.activeRouteSubText}>إعلانات المؤسسة</Text>
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
            <Text style={styles.activeRouteSubText}>التواصل والمحادثات السريعة</Text>
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
                <Text style={styles.roleTagText}>مكتب الاستقبال والبوابة الرئيسية</Text>
              </View>
              <Text style={styles.welcomeTitle}>
                مرحباً بك {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.welcomeSub}>
                سجل الزوار اليومي، مراقبة الدخول، والتحقق من تصاريح الخروج الرقمية
              </Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{visitorsToday.length}</Text>
              <Text style={styles.statLabel}>إجمالي الزوار اليوم</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: theme.colors.status.warning }]}>
                {activeVisitors.length}
              </Text>
              <Text style={styles.statLabel}>متواجدون حالياً</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{exitPassesToday.length}</Text>
              <Text style={styles.statLabel}>تصاريح البوابة</Text>
            </View>
          </View>

          {/* Action Bar */}
          <TouchableOpacity
            onPress={() => setShowVisitorModal(true)}
            style={styles.checkInBtn}
            activeOpacity={0.85}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.checkInBtnText}>تسجيل دخول زائر جديد</Text>
          </TouchableOpacity>

          {/* Visitors Log Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>سجل الزوار المتواجدين بالمؤسسة</Text>
            {activeVisitors.length === 0 ? (
              <View style={styles.emptyCard}>
                <Users size={32} color={theme.colors.brand[300]} />
                <Text style={styles.emptyTitle}>لا يوجد زوار متواجدين حالياً بالمؤسسة</Text>
              </View>
            ) : (
              activeVisitors.map((v) => (
                <View key={v._id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <TouchableOpacity
                      onPress={() => handleCheckOutVisitor(v._id)}
                      style={styles.checkOutBtn}
                    >
                      <LogOut size={13} color="#FFFFFF" />
                      <Text style={styles.checkOutBtnText}>تسجيل المغادرة</Text>
                    </TouchableOpacity>
                    <Text style={styles.cardTitle}>{v.visitorName}</Text>
                  </View>
                  <Text style={styles.cardSub}>
                    الغرض: {v.purpose} | المتجه إليه: {v.personToVisit}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardMeta}>
                      وقت الدخول: {v.checkInTime || 'صباحاً'}
                    </Text>
                    {v.visitorPhone && (
                      <Text style={styles.cardMeta}>الهاتف: {v.visitorPhone}</Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Gate Exit Passes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تصاريح الخروج المعتمدة عند البوابة</Text>
            {exitPassesToday.length === 0 ? (
              <View style={styles.emptyCard}>
                <ShieldCheck size={32} color={theme.colors.brand[300]} />
                <Text style={styles.emptyTitle}>لا توجد تصاريح خروج مطلوبة للبوابة اليوم</Text>
              </View>
            ) : (
              exitPassesToday.map((p) => {
                const isVerified = p.status === 'Used';
                return (
                  <View key={p._id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      {!isVerified ? (
                        <TouchableOpacity
                          onPress={() => handleVerifyGatePass(p._id)}
                          style={styles.verifyBtn}
                        >
                          <ShieldCheck size={14} color="#FFFFFF" />
                          <Text style={styles.verifyBtnText}>تأكيد خروج التلميذ</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.verifiedBadge}>
                          <CheckCircle size={13} color="#03543F" />
                          <Text style={styles.verifiedText}>تمت المغادرة</Text>
                        </View>
                      )}
                      <Text style={styles.cardTitle}>
                        {p.student?.firstNameArabic || p.student?.user?.firstName}{' '}
                        {p.student?.lastNameArabic || p.student?.user?.lastName} (
                        {p.class?.name || 'قسم'})
                      </Text>
                    </View>
                    <Text style={styles.cardSub}>السبب: {p.reason}</Text>
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardMeta}>وقت الخروج المعتمد: {p.exitTime || '11:30'}</Text>
                      {p.accompaniedBy && (
                        <Text style={styles.cardMeta}>المرافق: {p.accompaniedBy}</Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* Modal: New Visitor */}
      <Modal visible={showVisitorModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تسجيل دخول زائر للمؤسسة</Text>
              <TouchableOpacity onPress={() => setShowVisitorModal(false)}>
                <X size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>اسم ولقب الزائر *</Text>
                <TextInput
                  value={visitorName}
                  onChangeText={setVisitorName}
                  placeholder="مثال: السيد عبد القادر بن عيسى"
                  placeholderTextColor={theme.colors.text.subtle}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>رقم هاتف الزائر</Text>
                <TextInput
                  value={visitorPhone}
                  onChangeText={setVisitorPhone}
                  placeholder="0550XXXXXX"
                  keyboardType="phone-pad"
                  placeholderTextColor={theme.colors.text.subtle}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>رقم بطاقة التعريف / الهوية</Text>
                <TextInput
                  value={visitorIdCard}
                  onChangeText={setVisitorIdCard}
                  placeholder="رقم وثيقة إثبات الهوية..."
                  placeholderTextColor={theme.colors.text.subtle}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>الشخص أو المصلحة المراد زيارتها</Text>
                <TextInput
                  value={personToVisit}
                  onChangeText={setPersonToVisit}
                  placeholder="الإدارة العامة، الأستاذ، المراقب..."
                  placeholderTextColor={theme.colors.text.subtle}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>سبب الزيارة</Text>
                <TextInput
                  value={visitPurpose}
                  onChangeText={setVisitPurpose}
                  placeholder="استفسار، استلام وثيقة، مقابلة تربوية..."
                  placeholderTextColor={theme.colors.text.subtle}
                  style={styles.textInput}
                />
              </View>

              <Button
                label={isCheckingIn ? 'جاري التسجيل...' : 'تأكيد تسجيل الدخول'}
                onPress={handleCheckInVisitor}
                isLoading={isCheckingIn}
                style={{ marginTop: theme.spacing.md }}
              />
            </ScrollView>
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
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.brand[500],
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  checkInBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  section: { marginBottom: theme.spacing.lg },
  sectionTitle: {
    fontSize: 14,
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
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.brand[500],
    marginTop: theme.spacing.sm,
  },
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
  cardTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text.primary },
  checkOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.status.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  checkOutBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.status.success,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  verifyBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  verifiedText: { fontSize: 10, fontWeight: '800', color: '#03543F' },
  cardSub: { fontSize: 12, color: theme.colors.text.secondary, marginVertical: 3 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
    paddingTop: 6,
    marginTop: 4,
  },
  cardMeta: { fontSize: 11, color: theme.colors.text.muted, fontWeight: '700' },
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'right',
    marginBottom: 6,
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
