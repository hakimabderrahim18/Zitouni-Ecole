import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Plus,
  Clock,
  User,
  X,
  Search,
  Filter,
  Check,
  Calendar,
  AlertCircle,
  GraduationCap,
} from 'lucide-react-native';
import { theme } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/store/useAuthStore';
import { apiClient } from '../../src/api/client';
import { Button } from '../../src/components/common/Button';
import { DashboardHeader } from '../../src/components/DashboardHeader';
import { NavigationDrawer } from '../../src/components/NavigationDrawer';
import { useRouter } from 'expo-router';

interface ExitPassItem {
  _id: string;
  student?: {
    _id: string;
    registrationNumber?: string;
    firstNameArabic?: string;
    lastNameArabic?: string;
    user?: {
      firstName?: string;
      lastName?: string;
      profilePic?: string;
    };
  };
  class?: {
    _id?: string;
    name?: string;
    level?: string;
  };
  reason: string;
  exitTime?: string;
  departureTime?: string;
  accompaniedBy?: string;
  status: 'Pending' | 'Approved' | 'Used' | 'Rejected' | string;
  requestedByParent?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  };
  issuedBy?: {
    firstName?: string;
    lastName?: string;
    role?: string;
  };
  approvedBy?: {
    firstName?: string;
    lastName?: string;
    role?: string;
  };
  createdAt?: string;
  date?: string;
}

export default function ExitPermitsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isSupervisorOrAdmin = ['admin', 'school', 'general_supervisor', 'pedagogical_supervisor', 'receptionist'].includes(
    user?.role || ''
  );

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permits, setPermits] = useState<ExitPassItem[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State for New Exit Permit
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newTime, setNewTime] = useState('11:30');
  const [newAccompaniedBy, setNewAccompaniedBy] = useState('ولي الأمر (الأب / الأم)');
  const [studentSearch, setStudentSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Live Exit Permits from Database
  const fetchPermits = useCallback(async () => {
    try {
      const endpoint = isSupervisorOrAdmin ? '/api/supervisors/exit-passes' : '/api/parents/exit-passes';
      const res = await apiClient.get(endpoint);
      const data = Array.isArray(res.data) ? res.data : res.data?.passes || [];
      setPermits(data);
    } catch (err: any) {
      console.warn('Could not load exit passes:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isSupervisorOrAdmin]);

  // Fetch Students for Dropdown/Picker
  const fetchStudents = useCallback(async () => {
    try {
      const endpoint = isSupervisorOrAdmin ? '/api/admin/students' : '/api/parents/my-children';
      const res = await apiClient.get(endpoint);
      const data = Array.isArray(res.data) ? res.data : res.data?.students || res.data?.children || [];
      setStudents(data);
    } catch {
      // Ignored
    }
  }, [isSupervisorOrAdmin]);

  useEffect(() => {
    fetchPermits();
    fetchStudents();
  }, [fetchPermits, fetchStudents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPermits(), fetchStudents()]);
    setRefreshing(false);
  };

  // Approve Exit Pass
  const handleApprove = async (id: string) => {
    try {
      await apiClient.put(`/api/supervisors/exit-pass/${id}/approve`);
      Alert.alert('تم بنجاح', 'تمت الموافقة على تصريح الخروج وتأكيده في النظام.');
      await fetchPermits();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'تعذر اعتماد تصريح الخروج');
    }
  };

  // Reject Exit Pass
  const handleReject = async (id: string) => {
    Alert.prompt
      ? Alert.prompt(
          'رفض إذن الخروج',
          'يرجى كتابة سبب رفض الطلب:',
          [
            { text: 'إلغاء', style: 'cancel' },
            {
              text: 'تأكيد الرفض',
              style: 'destructive',
              onPress: async (reason) => {
                try {
                  await apiClient.put(`/api/supervisors/exit-pass/${id}/reject`, {
                    reason: reason || 'مرفوض من طرف الإدارة',
                  });
                  Alert.alert('تم الرفض', 'تم تسجيل رفض الطلب وإشعار ولي الأمر.');
                  await fetchPermits();
                } catch (err: any) {
                  Alert.alert('خطأ', err.response?.data?.message || 'تعذر رفض التصريح');
                }
              },
            },
          ],
          'plain-text',
          'طلب غير مبرر بتقرير رسمي'
        )
      : (async () => {
          try {
            await apiClient.put(`/api/supervisors/exit-pass/${id}/reject`, {
              reason: 'مرفوض من طرف الإدارة لعدم استيفاء الشروط',
            });
            Alert.alert('تم الرفض', 'تم تسجيل رفض الطلب وإشعار ولي الأمر.');
            await fetchPermits();
          } catch (err: any) {
            Alert.alert('خطأ', err.response?.data?.message || 'تعذر رفض التصريح');
          }
        })();
  };

  // Submit New Exit Permit
  const handleCreatePermit = async () => {
    if (!selectedStudentId) {
      Alert.alert('تنبيه', 'يرجى اختيار التلميذ المعني بإذن الخروج');
      return;
    }
    if (!newReason.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة سبب طلب الخروج المبرر');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedStudent = students.find((s) => s._id === selectedStudentId);
      const classId = selectedStudent?.class?._id || selectedStudent?.class;

      const endpoint = isSupervisorOrAdmin ? '/api/supervisors/exit-pass' : '/api/parents/exit-pass';
      await apiClient.post(endpoint, {
        studentId: selectedStudentId,
        student: selectedStudentId,
        classId,
        reason: newReason.trim(),
        exitTime: newTime.trim() || '12:00',
        accompaniedBy: newAccompaniedBy.trim() || 'ولي الأمر',
      });

      Alert.alert('تم بنجاح', 'تم تسجيل إذن الخروج وإضافته لقاعدة البيانات.');
      setModalOpen(false);
      setSelectedStudentId('');
      setNewReason('');
      setStudentSearch('');
      await fetchPermits();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل إرسال طلب إذن الخروج');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Permits List
  const filteredPermits = useMemo(() => {
    return permits.filter((item) => {
      const sName =
        `${item.student?.firstNameArabic || item.student?.user?.firstName || ''} ${
          item.student?.lastNameArabic || item.student?.user?.lastName || ''
        }`.trim();
      const pName =
        `${item.requestedByParent?.firstName || ''} ${item.requestedByParent?.lastName || ''}`.trim();
      const cName = item.class?.name || '';
      const rText = item.reason || '';

      const matchesSearch =
        !searchQuery.trim() ||
        sName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rText.toLowerCase().includes(searchQuery.toLowerCase());

      const normalizedStatus = (item.status || 'pending').toLowerCase();
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'Approved' && (normalizedStatus === 'approved' || normalizedStatus === 'used')) ||
        (statusFilter === 'Pending' && normalizedStatus === 'pending') ||
        (statusFilter === 'Rejected' && normalizedStatus === 'rejected');

      return matchesSearch && matchesStatus;
    });
  }, [permits, searchQuery, statusFilter]);

  // Filtered Students for Modal Selection
  const modalFilteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students.slice(0, 10);
    return students
      .filter((s) => {
        const name = `${s.firstNameArabic || s.user?.firstName || ''} ${
          s.lastNameArabic || s.user?.lastName || ''
        } ${s.registrationNumber || ''}`.toLowerCase();
        return name.includes(studentSearch.toLowerCase());
      })
      .slice(0, 10);
  }, [students, studentSearch]);

  return (
    <View style={styles.container}>
      {/* 1. Header */}
      <DashboardHeader onOpenDrawer={() => setIsDrawerOpen(true)} />

      {/* 2. Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeId="exit-permits"
        onSelect={(id) => {
          setIsDrawerOpen(false);
          router.push('/(tabs)');
        }}
      />

      {/* 3. Top Action Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => setModalOpen(true)}
          style={styles.addRequestBtn}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addRequestBtnText}>طلب إذن خروج جديد</Text>
        </TouchableOpacity>
        <Text style={styles.topBarSummary}>
          {permits.length} تصريح في قاعدة البيانات
        </Text>
      </View>

      {/* 4. Search & Status Filter Chips */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputWrapper}>
          <Search size={16} color={theme.colors.text.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="البحث باسم التلميذ أو القسم أو السبب..."
            placeholderTextColor={theme.colors.text.subtle}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={theme.colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsScroll}
        >
          {[
            { id: 'all', label: `الكل (${permits.length})` },
            {
              id: 'Pending',
              label: `قيد الانتظار (${
                permits.filter((p) => (p.status || '').toLowerCase() === 'pending').length
              })`,
            },
            {
              id: 'Approved',
              label: `المقبولة (${
                permits.filter((p) =>
                  ['approved', 'used'].includes((p.status || '').toLowerCase())
                ).length
              })`,
            },
            {
              id: 'Rejected',
              label: `المرفوضة (${
                permits.filter((p) => (p.status || '').toLowerCase() === 'rejected').length
              })`,
            },
          ].map((chip) => {
            const isActive = statusFilter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                onPress={() => setStatusFilter(chip.id)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text
                  style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. Main Permits List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand[500]} />
          <Text style={styles.loadingText}>جاري مزامنة أذونات الخروج من قاعدة البيانات...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPermits}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.brand[500]}
              colors={[theme.colors.brand[500]]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ShieldCheck size={48} color={theme.colors.brand[300]} />
              <Text style={styles.emptyTitle}>لا توجد أذونات خروج مسجلة</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'لم يتم العثور على أذونات تطابق كلمات البحث.'
                  : 'يمكنك الضغط على زر "طلب إذن خروج جديد" لإصدار تصريح جديد.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const rawStatus = (item.status || 'Pending').toLowerCase();
            const isApproved = rawStatus === 'approved' || rawStatus === 'used';
            const isPending = rawStatus === 'pending';
            const isRejected = rawStatus === 'rejected';

            const studentName =
              `${item.student?.firstNameArabic || item.student?.user?.firstName || 'تلميذ'} ${
                item.student?.lastNameArabic || item.student?.user?.lastName || ''
              }`.trim();
            const className = item.class?.name || 'قسم عام';
            const parentName =
              item.requestedByParent
                ? `${item.requestedByParent.firstName || ''} ${
                    item.requestedByParent.lastName || ''
                  }`.trim()
                : item.issuedBy
                ? `${item.issuedBy.firstName || ''} ${item.issuedBy.lastName || ''} (${
                    item.issuedBy.role === 'admin' ? 'الإدارة' : 'المراقب'
                  })`
                : 'إدارة المدرسة';

            const timeStr = item.exitTime || item.departureTime || '11:30';

            return (
              <View style={styles.card}>
                <View style={styles.headerRow}>
                  <View
                    style={[
                      styles.badge,
                      isApproved
                        ? styles.badgeApproved
                        : isPending
                        ? styles.badgePending
                        : styles.badgeRejected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isApproved
                          ? styles.textApproved
                          : isPending
                          ? styles.textPending
                          : styles.textRejected,
                      ]}
                    >
                      {isApproved
                        ? 'مسموح بالخروج'
                        : isPending
                        ? 'قيد المعالجة'
                        : 'مرفوض'}
                    </Text>
                  </View>
                  <View style={styles.studentNameGroup}>
                    <Text style={styles.studentName}>{studentName}</Text>
                    <View style={styles.classBadge}>
                      <GraduationCap size={12} color={theme.colors.brand[500]} />
                      <Text style={styles.className}>{className}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoValue}>{timeStr}</Text>
                  <View style={styles.infoLabelGroup}>
                    <Clock size={13} color={theme.colors.text.muted} />
                    <Text style={styles.infoLabel}>وقت الخروج المحدد:</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoValue}>{parentName}</Text>
                  <View style={styles.infoLabelGroup}>
                    <User size={13} color={theme.colors.text.muted} />
                    <Text style={styles.infoLabel}>الجهة المصرحة / الطالبة:</Text>
                  </View>
                </View>

                {item.accompaniedBy && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoValue}>{item.accompaniedBy}</Text>
                    <View style={styles.infoLabelGroup}>
                      <ShieldCheck size={13} color={theme.colors.text.muted} />
                      <Text style={styles.infoLabel}>المرافق عند الخروج:</Text>
                    </View>
                  </View>
                )}

                <View style={styles.reasonBox}>
                  <Text style={styles.reasonTitle}>سبب الخروج الموثق:</Text>
                  <Text style={styles.reasonText}>{item.reason}</Text>
                </View>

                {/* Supervisor & Admin Action Buttons */}
                {isSupervisorOrAdmin && isPending && user?.role !== 'receptionist' && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      onPress={() => handleApprove(item._id)}
                      style={[styles.actionBtn, styles.approveBtn]}
                      activeOpacity={0.85}
                    >
                      <CheckCircle2 size={16} color="#FFFFFF" />
                      <Text style={styles.actionBtnText}>قبول وتصريح</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleReject(item._id)}
                      style={[styles.actionBtn, styles.rejectBtn]}
                      activeOpacity={0.85}
                    >
                      <XCircle size={16} color="#FFFFFF" />
                      <Text style={styles.actionBtnText}>رفض الطلب</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Receptionist Gate Verification */}
                {user?.role === 'receptionist' && isApproved && item.status !== 'Used' && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      onPress={async () => {
                        try {
                          await apiClient.put(`/api/receptionist/exit-pass/${item._id}/verify`);
                          Alert.alert('تم بنجاح', 'تم تأكيد خروج التلميذ عبر البوابة.');
                          fetchPermits();
                        } catch (err: any) {
                          Alert.alert('خطأ', err.response?.data?.message || 'فشل تأكيد الخروج');
                        }
                      }}
                      style={[styles.actionBtn, styles.approveBtn]}
                      activeOpacity={0.85}
                    >
                      <ShieldCheck size={16} color="#FFFFFF" />
                      <Text style={styles.actionBtnText}>تأكيد خروج التلميذ من البوابة</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Modal: Create Exit Permit Connected to Real DB Students */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إصدار ترخيص خروج تلميذ جديد</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <X size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Student Picker with live DB search */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>اختر التلميذ من القائمة *</Text>
                <TextInput
                  value={studentSearch}
                  onChangeText={setStudentSearch}
                  placeholder="ابحث بالاسم أو رقم التسجيل..."
                  placeholderTextColor={theme.colors.text.subtle}
                  style={styles.modalSearchInput}
                />
                <View style={styles.studentChipsList}>
                  {modalFilteredStudents.map((s) => {
                    const isSelected = selectedStudentId === s._id;
                    const name = `${s.firstNameArabic || s.user?.firstName || ''} ${
                      s.lastNameArabic || s.user?.lastName || ''
                    }`.trim();
                    const cls = s.class?.name || '';
                    return (
                      <TouchableOpacity
                        key={s._id}
                        onPress={() => setSelectedStudentId(s._id)}
                        style={[
                          styles.studentSelectionChip,
                          isSelected && styles.studentSelectionChipActive,
                        ]}
                      >
                        {isSelected && <Check size={14} color="#FFFFFF" />}
                        <Text
                          style={[
                            styles.studentSelectionText,
                            isSelected && styles.studentSelectionTextActive,
                          ]}
                        >
                          {name} ({cls})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>وقت الخروج المطلوب *</Text>
                <TextInput
                  value={newTime}
                  onChangeText={setNewTime}
                  placeholder="مثال: 11:30"
                  placeholderTextColor={theme.colors.text.subtle}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>المرافق المعتمد لاستلام التلميذ</Text>
                <TextInput
                  value={newAccompaniedBy}
                  onChangeText={setNewAccompaniedBy}
                  placeholder="مثال: الولي (الأب / الأم) أو الأخ الأكبر"
                  placeholderTextColor={theme.colors.text.subtle}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>السبب المبرر للخروج *</Text>
                <TextInput
                  value={newReason}
                  onChangeText={setNewReason}
                  placeholder="وضح سبب المغادرة المبكرة بدقة (فحص طبي، طارئ عائلي...)"
                  placeholderTextColor={theme.colors.text.subtle}
                  multiline
                  numberOfLines={3}
                  style={[styles.textInput, styles.textArea]}
                />
              </View>

              <View style={styles.modalActions}>
                <Button
                  label={isSubmitting ? 'جاري الحفظ في الخادم...' : 'تسجيل إذن الخروج'}
                  onPress={handleCreatePermit}
                  isLoading={isSubmitting}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  addRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.brand[500],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    ...theme.shadows.sm,
  },
  addRequestBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  topBarSummary: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.muted,
  },
  searchSection: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    backgroundColor: theme.colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface.input,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.sm,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
  filterChipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface.background,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.brand[500],
    borderColor: theme.colors.brand[500],
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  centerContainer: {
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    ...theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentNameGroup: {
    alignItems: 'flex-end',
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: theme.colors.surface.elevated,
  },
  className: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  badgeApproved: {
    backgroundColor: '#DEF7EC',
  },
  badgePending: {
    backgroundColor: '#FEF08A',
  },
  badgeRejected: {
    backgroundColor: '#FDE8E8',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textApproved: {
    color: '#03543F',
  },
  textPending: {
    color: '#713F12',
  },
  textRejected: {
    color: '#9B1C1C',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.surface.border,
    marginVertical: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  infoLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.text.muted,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  reasonBox: {
    backgroundColor: theme.colors.surface.elevated,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  reasonTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.brand[500],
    textAlign: 'right',
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
  },
  approveBtn: {
    backgroundColor: theme.colors.status.success,
  },
  rejectBtn: {
    backgroundColor: theme.colors.status.danger,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
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
    maxHeight: '85%',
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
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 6,
    textAlign: 'right',
  },
  modalSearchInput: {
    backgroundColor: theme.colors.surface.input,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    color: theme.colors.text.primary,
    textAlign: 'right',
    marginBottom: 8,
  },
  studentChipsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  studentSelectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface.background,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  studentSelectionChipActive: {
    backgroundColor: theme.colors.brand[500],
    borderColor: theme.colors.brand[500],
  },
  studentSelectionText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  studentSelectionTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: theme.colors.surface.input,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
});
