import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import {
  Menu,
  Bell,
  X,
  MessageSquare,
  BookOpen,
  Calendar,
  Globe,
} from 'lucide-react-native';
import { SchoolLogo } from './SchoolLogo';
import { theme } from '../theme/tokens';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore, NotificationItem } from '../store/useNotificationStore';
import { useSchoolStore } from '../store/useSchoolStore';
import { useRouter } from 'expo-router';

export interface DashboardHeaderProps {
  onOpenDrawer: () => void;
  onOpenProfile?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onOpenDrawer,
  onOpenProfile,
}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { settings, fetchSettings } = useSchoolStore();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchNotifications();
  }, []);

  const handleProfilePress = () => {
    if (onOpenProfile) {
      onOpenProfile();
    } else {
      router.push('/(tabs)/profile');
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={16} color="#818CF8" />;
      case 'course':
        return <BookOpen size={16} color={theme.colors.brand[400]} />;
      case 'schedule':
        return <Calendar size={16} color="#F59E0B" />;
      case 'post':
        return <Globe size={16} color="#10B981" />;
      default:
        return <Bell size={16} color="#766065" />;
    }
  };

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* 1:1 Visual Clone of Web Mobile Header (DashboardLayout.jsx)      */}
      {/* ---------------------------------------------------------------- */}
      <View style={styles.headerContainer}>
        {/* Right (RTL start): Menu + SchoolLogo + SchoolName */}
        <View style={styles.rightGroup}>
          <TouchableOpacity
            onPress={onOpenDrawer}
            style={styles.menuButton}
            activeOpacity={0.7}
            accessibilityLabel="القائمة"
          >
            <Menu size={20} color="#766065" strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.logoWrapper}>
            <SchoolLogo size={24} showText={false} />
          </View>

          <Text style={styles.schoolName} numberOfLines={1}>
            {settings?.schoolNameArabic || 'مدرسة حبر'}
          </Text>
        </View>

        {/* Left (RTL end): Bell Notifications + User Avatar Circle */}
        <View style={styles.leftGroup}>
          {/* Notifications Toggle */}
          <TouchableOpacity
            onPress={() => {
              setNotificationsOpen(!notificationsOpen);
              if (!notificationsOpen) fetchNotifications();
            }}
            style={styles.bellButton}
            activeOpacity={0.7}
            accessibilityLabel="الإشعارات"
          >
            <Bell size={20} color="#766065" strokeWidth={2} />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* User Avatar Circle */}
          <TouchableOpacity
            onPress={handleProfilePress}
            style={styles.avatarButton}
            activeOpacity={0.75}
            accessibilityLabel="الملف الشخصي"
          >
            {user?.profilePic ? (
              <Image source={{ uri: user.profilePic }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {`${user?.firstName?.[0] || 'ع'}${user?.lastName?.[0] || 'ز'}`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ---------------------------------------------------------------- */}
      {/* Notifications Modal Dropdown                                     */}
      {/* ---------------------------------------------------------------- */}
      <Modal
        visible={notificationsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setNotificationsOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.notificationsCard}>
                {/* Header */}
                <View style={styles.notifHeader}>
                  <TouchableOpacity
                    onPress={() => setNotificationsOpen(false)}
                    style={styles.closeBtn}
                  >
                    <X size={18} color="#766065" />
                  </TouchableOpacity>

                  {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllAsRead}>
                      <Text style={styles.markAllReadText}>قراءة الكل</Text>
                    </TouchableOpacity>
                  )}

                  <Text style={styles.notifTitle}>الإشعارات</Text>
                </View>

                {/* Body */}
                <ScrollView
                  style={styles.notifList}
                  showsVerticalScrollIndicator={false}
                >
                  {notifications.length === 0 ? (
                    <View style={styles.emptyNotifContainer}>
                      <Text style={styles.emptyNotifText}>لا توجد إشعارات جديدة.</Text>
                    </View>
                  ) : (
                    notifications.map((notif: NotificationItem) => (
                      <TouchableOpacity
                        key={notif._id}
                        onPress={() => markAsRead(notif._id)}
                        style={[
                          styles.notifItem,
                          notif.isRead ? styles.notifItemRead : styles.notifItemUnread,
                        ]}
                        activeOpacity={0.7}
                      >
                        <View style={styles.notifIconContainer}>
                          {getNotificationIcon(notif.type)}
                        </View>
                        <View style={styles.notifContentBox}>
                          <View style={styles.notifTitleRow}>
                            <Text
                              style={[
                                styles.notifItemTitle,
                                notif.isRead ? styles.textMuted : styles.textPrimary,
                              ]}
                            >
                              {notif.title}
                            </Text>
                            {!notif.isRead && <View style={styles.unreadDot} />}
                          </View>
                          <Text style={styles.notifItemContent}>{notif.content}</Text>
                          <Text style={styles.notifItemTime}>
                            {new Date(notif.createdAt).toLocaleTimeString('ar-DZ', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

/* ==================================================================== */
/*  Exact Web Mobile Header Styles                                      */
/* ==================================================================== */

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: 'rgba(252, 248, 242, 0.94)', // var(--luxury-card)
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.35)', // var(--luxury-border)
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 30,
    shadowColor: '#2B2022',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  rightGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  menuButton: {
    padding: 6,
    borderRadius: 8,
  },
  logoWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B2022', // text-slate-100 in light mode
  },
  leftGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  bellButton: {
    padding: 6,
    borderRadius: 8,
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#68172F', // bg-brand-650
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)', // border-luxury-border/40
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },

  /* Notifications Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 70 : 56,
    paddingLeft: 12,
  },
  notificationsCard: {
    width: 288,
    maxHeight: 380,
    backgroundColor: '#1E0E14',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.2)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  notifTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  markAllReadText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.brand[300],
  },
  closeBtn: {
    padding: 2,
  },
  notifList: {
    maxHeight: 300,
  },
  emptyNotifContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyNotifText: {
    fontSize: 12,
    color: '#887075',
    fontStyle: 'italic',
  },
  notifItem: {
    flexDirection: 'row-reverse',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
    gap: 8,
  },
  notifItemUnread: {
    backgroundColor: 'rgba(123, 30, 58, 0.2)',
    borderColor: 'rgba(123, 30, 58, 0.3)',
  },
  notifItemRead: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(201, 162, 77, 0.1)',
  },
  notifIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  notifContentBox: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifItemTitle: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.brand[400],
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textMuted: {
    color: '#887075',
  },
  notifItemContent: {
    fontSize: 10,
    color: '#D2BEA8',
    textAlign: 'right',
    marginTop: 2,
  },
  notifItemTime: {
    fontSize: 8,
    color: '#887075',
    textAlign: 'right',
    marginTop: 4,
  },
});
