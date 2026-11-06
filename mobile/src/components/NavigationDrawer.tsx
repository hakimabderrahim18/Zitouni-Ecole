import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  X,
  Globe,
  BookOpen,
  Users,
  FileText,
  CheckSquare,
  Calendar,
  CreditCard,
  ShieldCheck,
  Palette,
  Database,
  ShieldAlert,
  MessageSquare,
  LogOut,
  Sparkles,
} from 'lucide-react-native';
import { SchoolLogo } from './SchoolLogo';
import { theme } from '../theme/tokens';
import { useAuthStore } from '../store/useAuthStore';
import { useRouter } from 'expo-router';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: 'feed', label: 'آخر الأخبار والمستجدات', icon: Globe },
  { id: 'overview', label: 'لوحة القيادة والمؤشرات', icon: BookOpen },
  { id: 'users', label: 'المستخدمين والصلاحيات', icon: Users },
  { id: 'teachers', label: 'قائمة الأساتذة (المادة 23)', icon: Users },
  { id: 'students', label: 'قائمة التلاميذ', icon: Users },
  { id: 'inscriptions', label: 'التسجيلات والملفات المدرسية', icon: FileText },
  { id: 'classes', label: 'الأقسام والأفواج الدراسية', icon: BookOpen },
  { id: 'attendance', label: 'سجل حضور وغياب التلاميذ والإنذارات', icon: CheckSquare },
  { id: 'timetable', label: 'جدول التوقيت واستيراد RAN09', icon: Calendar },
  { id: 'lessons', label: 'كراس الدروس والواجبات (Cahier de texte)', icon: BookOpen },
  { id: 'finance', label: 'التسيير المالي والرواتب والخصم التلقائي', icon: CreditCard },
  { id: 'modules', label: 'المواد الدراسية', icon: BookOpen },
  { id: 'documents', label: 'المستندات الإدارية', icon: FileText },
  { id: 'schedules', label: 'المخططات والجداول', icon: Calendar },
  { id: 'login-audit', label: 'سجل جلسات الدخول والأمان', icon: ShieldCheck },
  { id: 'branding', label: 'الهوية البصرية للمؤسسة', icon: Palette },
  { id: 'backups', label: 'النسخ الاحتياطي والأرشيف المشفر', icon: Database },
  { id: 'requests', label: 'الطلبات والشهادات الإدارية (Art. 38)', icon: FileText },
  { id: 'reported-messages', label: 'الرسائل المبلغ عنها', icon: ShieldAlert },
  { id: 'audit', label: 'رقابة المحادثات', icon: MessageSquare },
  { id: 'chat', label: 'الرسائل والمحادثة', icon: MessageSquare },
];

export const TEACHER_NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'لوحة الأستاذ والمهام', icon: BookOpen },
  { id: 'courses', label: 'الدروس والملفات المرفوعة', icon: FileText },
  { id: 'classes', label: 'الأقسام المسندة وتلاميذها', icon: Users },
  { id: 'attendance', label: 'تسجيل حضور وغياب التلاميذ', icon: CheckSquare },
  { id: 'timetable', label: 'جدول التوقيت الأسبوعي', icon: Calendar },
  { id: 'lessons', label: 'كراس الدروس والواجبات (Cahier)', icon: BookOpen },
  { id: 'requests', label: 'الطلبات الإدارية وشهادات العمل', icon: FileText },
  { id: 'feed', label: 'آخر الأخبار والمستجدات', icon: Globe },
  { id: 'chat', label: 'الرسائل والمحادثات التربوية', icon: MessageSquare },
];

export const PARENT_NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'متابعة الأبناء والتمدرس', icon: Users },
  { id: 'payments', label: 'الفواتير والرسوم المدرسية والوصولات', icon: CreditCard },
  { id: 'exit-passes', label: 'أذونات وتصاريح الخروج', icon: ShieldCheck },
  { id: 'timetable', label: 'جدول توقيت الأبناء', icon: Calendar },
  { id: 'lessons', label: 'كراس الدروس والواجبات المنزلية', icon: BookOpen },
  { id: 're-enrollment', label: 'إعادة التسجيل السنوي', icon: CheckSquare },
  { id: 'requests', label: 'طلب الشهادات المدرسية والوثائق', icon: FileText },
  { id: 'feed', label: 'مستجدات وإعلانات المؤسسة', icon: Globe },
  { id: 'chat', label: 'التواصل مع الإدارة والأساتذة', icon: MessageSquare },
];

export const STUDENT_NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'ملخص تمدرسي ودروسي', icon: BookOpen },
  { id: 'courses', label: 'الدروس والملخصات والواجبات', icon: FileText },
  { id: 'timetable', label: 'جدول توقيت القسم', icon: Calendar },
  { id: 'attendance', label: 'سجل غياباتي وتأخيراتي', icon: CheckSquare },
  { id: 'lessons', label: 'كراس الدروس اليومي', icon: BookOpen },
  { id: 're-enrollment', label: 'استمارة إعادة التسجيل', icon: FileText },
  { id: 'feed', label: 'إعلانات المدرسة', icon: Globe },
  { id: 'chat', label: 'المراسلة والتواصل', icon: MessageSquare },
];

export const GENERAL_SUPERVISOR_NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'لوحة المراقب العام والمؤشرات', icon: BookOpen },
  { id: 'staff-attendance', label: 'مواظبة الطاقم والخصم التلقائي', icon: CheckSquare },
  { id: 'student-attendance', label: 'غياب وحضور التلاميذ', icon: Users },
  { id: 'exit-passes', label: 'تصاريح وأذونات الخروج', icon: ShieldCheck },
  { id: 'damages', label: 'تقارير إتلاف العتاد والتجهيزات', icon: ShieldAlert },
  { id: 'canteen', label: 'حجوزات الإطعام والمطعم', icon: BookOpen },
  { id: 'assignment', label: 'إسناد الأقسام للمشرفين', icon: Users },
  { id: 'timetable', label: 'جداول التوقيت واستيراد RAN09', icon: Calendar },
  { id: 'lessons', label: 'كراس الدروس (Cahier de texte)', icon: BookOpen },
  { id: 'inscriptions', label: 'التسجيلات والملفات المدرسية', icon: FileText },
  { id: 'reported-messages', label: 'الرسائل المبلغ عنها', icon: ShieldAlert },
  { id: 'feed', label: 'آخر الأخبار والمستجدات', icon: Globe },
  { id: 'chat', label: 'المحادثات الإدارية', icon: MessageSquare },
];

export const PEDAGOGICAL_SUPERVISOR_NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'لوحة المشرف التربوي', icon: BookOpen },
  { id: 'student-attendance', label: 'متابعة غياب وحضور الأقسام', icon: CheckSquare },
  { id: 'exit-passes', label: 'تصاريح وأذونات الخروج', icon: ShieldCheck },
  { id: 'damages', label: 'تقارير إتلاف العتاد', icon: ShieldAlert },
  { id: 'canteen', label: 'حجوزات الإطعام', icon: BookOpen },
  { id: 'timetable', label: 'جداول التوقيت', icon: Calendar },
  { id: 'lessons', label: 'كراس الدروس', icon: BookOpen },
  { id: 'feed', label: 'إعلانات المؤسسة', icon: Globe },
  { id: 'chat', label: 'المحادثات', icon: MessageSquare },
];

export const RECEPTIONIST_NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'مكتب الاستقبال والزوار', icon: BookOpen },
  { id: 'visitors', label: 'سجل الزوار الوافدين والدخول والخروج', icon: Users },
  { id: 'exit-passes', label: 'التحقق من تصاريح الخروج عند البوابة', icon: ShieldCheck },
  { id: 'feed', label: 'إعلانات المؤسسة', icon: Globe },
  { id: 'chat', label: 'التواصل السريع', icon: MessageSquare },
];

export const getNavItemsForRole = (role?: string): NavItem[] => {
  switch (role) {
    case 'teacher':
      return TEACHER_NAV_ITEMS;
    case 'parent':
      return PARENT_NAV_ITEMS;
    case 'student':
      return STUDENT_NAV_ITEMS;
    case 'general_supervisor':
      return GENERAL_SUPERVISOR_NAV_ITEMS;
    case 'pedagogical_supervisor':
      return PEDAGOGICAL_SUPERVISOR_NAV_ITEMS;
    case 'receptionist':
      return RECEPTIONIST_NAV_ITEMS;
    case 'admin':
    case 'school':
    default:
      return ADMIN_NAV_ITEMS;
  }
};

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeId: string;
  onSelect: (id: string) => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeId,
  onSelect,
}) => {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/(auth)/login');
  };

  const getInitials = () => {
    if (!user) return 'عز';
    const first = user.firstName ? user.firstName[0] : '';
    const last = user.lastName ? user.lastName[0] : '';
    return `${first}${last}` || 'عز';
  };

  const getRoleTitle = () => {
    if (!user) return 'مدير المنصة';
    if (user.role === 'admin') return 'مدير المنصة';
    if (user.role === 'school') return 'الإدارة العامة';
    if (user.role === 'teacher') return 'أستاذ(ة)';
    if (user.role === 'general_supervisor') return 'المراقب العام';
    if (user.role === 'pedagogical_supervisor') return 'المشرف التربوي';
    if (user.role === 'receptionist') return 'موظف الاستقبال';
    if (user.role === 'parent') return 'ولي أمر';
    if (user.role === 'student') return 'تلميذ';
    return 'مدير المنصة';
  };

  const getUserFullName = () => {
    if (!user) return 'عبد الرحيم زيتوني';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'عبد الرحيم زيتوني';
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop touch to close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Drawer Panel on the Right (RTL) */}
        <View style={styles.drawerContainer}>
          {/* Top Header: Close Button + School Branding */}
          <View style={styles.drawerHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={22} color={theme.colors.text.primary} />
            </TouchableOpacity>

            <View style={styles.headerBranding}>
              <View style={styles.headerTexts}>
                <Text style={styles.schoolTitle}>مدرسة حبر</Text>
                <Text style={styles.schoolYear}>2026-2027</Text>
              </View>
              <View style={styles.schoolLogoWrapper}>
                <SchoolLogo size={42} showText={false} />
              </View>
            </View>
          </View>

          {/* Navigation Links List */}
          <ScrollView
            style={styles.navScroll}
            contentContainerStyle={styles.navScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {getNavItemsForRole(user?.role).map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                    {item.label}
                  </Text>

                  <View style={styles.iconWrapper}>
                    <Icon
                      size={20}
                      color={isActive ? theme.colors.brand[500] : theme.colors.brand[700]}
                      strokeWidth={1.9}
                    />
                  </View>

                  {/* Active Indicator Bar on the far right */}
                  {isActive && <View style={styles.activeBar} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Bottom Profile Section & Logout Button */}
          <View style={styles.drawerFooter}>
            <View style={styles.footerSeparator} />

            {/* Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {getUserFullName()}
                </Text>
                <Text style={styles.profileRole}>{getRoleTitle()}</Text>
              </View>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{getInitials()}</Text>
              </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
              <LogOut size={18} color="#E11D48" />
              <Text style={styles.logoutBtnText}>تسجيل الخروج</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(43, 32, 34, 0.45)', // Warm dark backdrop
  },
  backdrop: {
    flex: 1,
  },
  drawerContainer: {
    width: 320,
    maxWidth: '86%',
    backgroundColor: theme.colors.surface.card, // Exact #FCF8F2
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.surface.border,
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
    display: 'flex',
    flexDirection: 'column',
    ...theme.shadows.lg,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(223, 211, 194, 0.4)',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  headerBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTexts: {
    alignItems: 'flex-end',
  },
  schoolTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.serif,
  },
  schoolYear: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.brand[500],
    marginTop: 1,
  },
  schoolLogoWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  navScroll: {
    flex: 1,
  },
  navScrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginVertical: 1.5,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
  },
  navItemText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.colors.text.secondary, // Exact #574549
    textAlign: 'right',
    flex: 1,
    marginRight: 12,
  },
  navItemTextActive: {
    color: theme.colors.brand[500],
    fontWeight: '800',
  },
  iconWrapper: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBar: {
    position: 'absolute',
    right: 0,
    top: 6,
    bottom: 6,
    width: 4,
    backgroundColor: theme.colors.brand[500],
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  drawerFooter: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 8,
    backgroundColor: theme.colors.surface.card,
  },
  footerSeparator: {
    height: 1,
    backgroundColor: 'rgba(223, 211, 194, 0.6)',
    marginBottom: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface.input, // Exact #FAF4EB
    borderRadius: 14,
    padding: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(223, 211, 194, 0.7)',
    marginBottom: 10,
  },
  profileInfo: {
    flex: 1,
    alignItems: 'flex-start',
    marginRight: 10,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  profileRole: {
    fontSize: 10,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
    backgroundColor: 'rgba(225, 29, 72, 0.04)',
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E11D48',
  },
});
