import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Search,
  Users,
  Phone,
  UserCheck,
  CreditCard,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Filter,
} from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { useAuthStore } from '../../src/store/useAuthStore';
import { theme } from '../../src/theme/tokens';
import { DashboardHeader } from '../../src/components/DashboardHeader';
import { NavigationDrawer } from '../../src/components/NavigationDrawer';
import { useRouter } from 'expo-router';

interface StudentDoc {
  _id: string;
  registrationNumber?: string;
  firstNameArabic?: string;
  lastNameArabic?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    email?: string;
  };
  class?: {
    _id?: string;
    name?: string;
  };
  group?: {
    _id?: string;
    name?: string;
  };
  parent?: {
    user?: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
    };
  };
  tuitionPaid?: boolean;
  registrationStatus?: string;
  isExitAuthorized?: boolean;
}

export default function StudentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [students, setStudents] = useState<StudentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');

  const fetchStudents = useCallback(async () => {
    try {
      if (user?.role === 'parent') {
        const res = await apiClient.get('/api/parents/children');
        const data = Array.isArray(res.data) ? res.data : [];
        setStudents(data);
      } else {
        const res = await apiClient.get('/api/admin/students');
        const data = Array.isArray(res.data) ? res.data : res.data?.students || [];
        setStudents(data);
      }
    } catch (err: any) {
      console.warn('Could not load students:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  };

  // Extract distinct class names for filter chips
  const classFilters = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.class?.name) set.add(s.class.name);
    });
    return ['ALL', ...Array.from(set).slice(0, 7)];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const className = s.class?.name || '';
      const matchesClass = selectedClass === 'ALL' || className === selectedClass;

      const firstName = s.firstNameArabic || s.user?.firstName || '';
      const lastName = s.lastNameArabic || s.user?.lastName || '';
      const reg = s.registrationNumber || '';
      const parentPhone = s.parent?.user?.phoneNumber || '';
      const studentPhone = s.user?.phoneNumber || '';

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        firstName.toLowerCase().includes(query) ||
        lastName.toLowerCase().includes(query) ||
        reg.toLowerCase().includes(query) ||
        parentPhone.includes(query) ||
        studentPhone.includes(query);

      return matchesClass && matchesSearch;
    });
  }, [students, searchQuery, selectedClass]);

  return (
    <View style={styles.container}>
      {/* 1. Web Parity Dashboard Header */}
      <DashboardHeader onOpenDrawer={() => setIsDrawerOpen(true)} />

      {/* 2. Side Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeId="students"
        onSelect={(id) => {
          setIsDrawerOpen(false);
          if (id === 'students') return;
          if (id === 'chat' || id === 'messages') {
            router.push('/(tabs)/messages');
          } else if (id === 'exit-passes' || id === 'exit-permits') {
            router.push('/(tabs)/exit-permits');
          } else if (id === 'profile') {
            router.push('/(tabs)/profile');
          } else {
            router.push({ pathname: '/(tabs)', params: { route: id } });
          }
        }}
      />

      {/* Search Header */}
      <View style={styles.searchHeader}>
        {user?.role === 'teacher' && (
          <View style={styles.teacherScopeBanner}>
            <Text style={styles.teacherScopeText}>
              الأقسام المسندة إليّ فقط ({students.length} تلميذ)
            </Text>
          </View>
        )}

        <View style={styles.searchBox}>
          <Search size={18} color={theme.colors.text.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ابحث بالاسم، رقم التسجيل، أو هاتف الولي..."
            placeholderTextColor={theme.colors.text.subtle}
            style={styles.searchInput}
          />
        </View>

        {/* Dynamic Class Filter Chips */}
        <View style={styles.filterChipsRow}>
          {classFilters.map((cls) => {
            const isSelected = selectedClass === cls;
            return (
              <TouchableOpacity
                key={cls}
                onPress={() => setSelectedClass(cls)}
                style={[styles.chip, isSelected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {cls === 'ALL' ? 'الكل (' + students.length + ')' : cls}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Loading Indicator */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand[500]} />
          <Text style={styles.loadingText}>جاري تحميل سجل التلاميذ من الخادم...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>لم يتم العثور على أي تلميذ يطابق هذا البحث.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const firstName = item.firstNameArabic || item.user?.firstName || 'تلميذ';
            const lastName = item.lastNameArabic || item.user?.lastName || '';
            const className = item.class?.name || 'غير محدد';
            const regNumber = item.registrationNumber || 'REG-2026';
            const parentName = item.parent?.user
              ? `${item.parent.user.firstName || ''} ${item.parent.user.lastName || ''}`.trim()
              : 'ولي الأمر';
            const parentPhone = item.parent?.user?.phoneNumber || item.user?.phoneNumber || '0797060052';
            const isPaid = item.tuitionPaid !== false;

            return (
              <View style={styles.studentCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {firstName[0]}
                      {lastName[0] || firstName[1] || ''}
                    </Text>
                  </View>
                  <View style={styles.studentInfoGroup}>
                    <Text style={styles.studentName}>
                      {firstName} {lastName}
                    </Text>
                    <Text style={styles.regNumber}>{regNumber}</Text>
                  </View>
                  <View style={[styles.statusBadge, isPaid ? styles.badgePaid : styles.badgeUnpaid]}>
                    <Text style={[styles.statusBadgeText, isPaid ? styles.textPaid : styles.textUnpaid]}>
                      {isPaid ? 'الرسوم مسددة' : 'رسوم معلقة'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsDivider} />

                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>القسم المعتمد:</Text>
                    <View style={styles.classPill}>
                      <Text style={styles.classPillText}>{className}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>تصريح الخروج:</Text>
                    <View
                      style={[
                        styles.exitBadge,
                        item.isExitAuthorized ? styles.exitBadgeAllowed : styles.exitBadgeNormal,
                      ]}
                    >
                      <Text
                        style={[
                          styles.exitBadgeText,
                          item.isExitAuthorized ? styles.textPaid : styles.textExitNormal,
                        ]}
                      >
                        {item.isExitAuthorized ? 'مسموح بالخروج' : 'نظامي بالمدرسة'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.parentRow}>
                  <View style={styles.parentInfo}>
                    <Text style={styles.parentLabel}>الولي:</Text>
                    <Text style={styles.parentValue}>{parentName}</Text>
                  </View>
                  <View style={styles.phoneGroup}>
                    <Phone size={13} color={theme.colors.brand[500]} />
                    <Text style={styles.phoneText}>{parentPhone}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.background, // Beige Crème #F3E9DC
  },
  searchHeader: {
    backgroundColor: theme.colors.surface.card, // #FCF8F2
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  teacherScopeBanner: {
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(123, 30, 58, 0.2)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  teacherScopeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.input, // #FAF4EB
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: theme.colors.text.primary,
    fontSize: 13,
    textAlign: 'right',
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface.input,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  chipSelected: {
    backgroundColor: theme.colors.brand[500], // Bordeaux #7B1E3A
    borderColor: theme.colors.brand[500],
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
  },
  list: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  studentCard: {
    backgroundColor: theme.colors.surface.card, // #FCF8F2
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.brand[500], // Bordeaux #7B1E3A
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.gold[500],
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  studentInfoGroup: {
    flex: 1,
    alignItems: 'flex-start',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  regNumber: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: theme.colors.text.subtle,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
  },
  badgePaid: {
    backgroundColor: theme.colors.status.successBg,
  },
  badgeUnpaid: {
    backgroundColor: theme.colors.status.warningBg,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textPaid: {
    color: theme.colors.status.success,
  },
  textUnpaid: {
    color: theme.colors.status.warning,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: 'rgba(223, 211, 194, 0.4)',
    marginVertical: theme.spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 11,
    color: theme.colors.text.muted,
    fontWeight: '600',
  },
  classPill: {
    backgroundColor: 'rgba(201, 162, 77, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radii.sm,
  },
  classPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.gold[700],
  },
  exitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radii.sm,
  },
  exitBadgeAllowed: {
    backgroundColor: theme.colors.status.successBg,
  },
  exitBadgeNormal: {
    backgroundColor: theme.colors.surface.input,
  },
  exitBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textExitNormal: {
    color: theme.colors.text.muted,
  },
  parentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.input,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    marginTop: 4,
  },
  parentInfo: {
    flexDirection: 'row',
    gap: 4,
  },
  parentLabel: {
    fontSize: 11,
    color: theme.colors.text.muted,
  },
  parentValue: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  phoneGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.brand[500],
    fontFamily: 'monospace',
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.text.muted,
    fontWeight: '600',
  },
});
