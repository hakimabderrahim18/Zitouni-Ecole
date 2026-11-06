import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  Eye,
  X,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  RefreshCw,
  AlertCircle,
  FileCheck,
} from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { theme } from '../../theme/tokens';
import { PostAnalyticsData, ViewerRecord } from './types';

interface PostViewersAnalyticsModalProps {
  visible: boolean;
  postId: string | null;
  postTitle?: string;
  onClose: () => void;
}

const roleLabels: Record<string, string> = {
  admin: 'مدير النظام',
  school: 'الإدارة العامة',
  teacher: 'أستاذ(ة)',
  parent: 'ولي أمر',
  student: 'تلميذ(ة)',
  general_supervisor: 'مشرف عام',
  pedagogical_supervisor: 'مشرف تربوي',
  receptionist: 'موظف استقبال',
};

const formatTime = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.toLocaleDateString('ar-DZ')} في ${d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const PostViewersAnalyticsModal: React.FC<PostViewersAnalyticsModalProps> = ({
  visible,
  postId,
  postTitle,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<PostAnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState<'viewed' | 'notViewed'>('viewed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  useEffect(() => {
    if (visible && postId) {
      fetchAnalytics();
    }
  }, [visible, postId]);

  const fetchAnalytics = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await apiClient.get<PostAnalyticsData>(`/api/posts/${postId}/analytics`);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching viewers analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const stats = analytics?.stats || {
    targetCount: 0,
    viewedCount: 0,
    notViewedCount: 0,
    viewRate: 0,
    confirmedCount: 0,
    confirmationRate: 0,
  };

  const rawList: ViewerRecord[] =
    activeTab === 'viewed'
      ? analytics?.viewersList || []
      : analytics?.notViewedList || [];

  const filteredList = rawList.filter((item) => {
    const user = item.user;
    if (!user) return false;
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const username = (user.username || '').toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || fullName.includes(query) || username.includes(query);
    return matchesRole && matchesSearch;
  });

  const renderViewerItem = ({ item }: { item: ViewerRecord }) => {
    const user = item.user;
    const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'مستخدم';
    const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || 'م';
    const roleLabel = roleLabels[user?.role || ''] || user?.role || 'مستخدم';

    return (
      <View style={styles.userCard}>
        <View style={styles.userRow}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {user?.profilePic ? (
              <Image source={{ uri: user.profilePic }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>

          {/* User Details */}
          <View style={styles.userInfo}>
            <View style={styles.userNameRoleRow}>
              <Text style={styles.userName}>{fullName}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{roleLabel}</Text>
              </View>
            </View>

            {user?.phoneNumber ? (
              <View style={styles.phoneRow}>
                <Phone size={10} color={theme.colors.text.muted} />
                <Text style={styles.phoneText}>{user.phoneNumber}</Text>
              </View>
            ) : null}

            {activeTab === 'viewed' && (
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Clock size={11} color={theme.colors.gold[600]} />
                  <Text style={styles.metaText}>
                    أول مشاهدة: {formatTime(item.firstViewedAt)}
                  </Text>
                </View>
                {(item.viewCount || 0) > 1 && (
                  <View style={styles.viewCountBadge}>
                    <Text style={styles.viewCountBadgeText}>
                      شوهد {item.viewCount} مرات
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Confirmation status if important */}
            {item.hasConfirmed && (
              <View style={styles.confirmedBadge}>
                <CheckCircle2 size={12} color="#059669" />
                <Text style={styles.confirmedBadgeText}>
                  تم تأكيد الاطلاع: {formatTime(item.confirmedAt)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerIconBg}>
                <Eye size={20} color={theme.colors.brand[500]} />
              </View>
              <View style={styles.headerTexts}>
                <Text style={styles.headerTitle}>
                  إحصائيات المشاهدة والاطلاع (« من شاهد المنشور؟ »)
                </Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {postTitle || analytics?.post?.title || 'تقرير موثق للجمهور المستهدف'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Stats Cards Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statVal}>{stats.targetCount}</Text>
              <Text style={styles.statLbl}>إجمالي المستهدفين</Text>
            </View>
            <View style={[styles.statCard, { borderColor: 'rgba(5, 150, 105, 0.3)' }]}>
              <Text style={[styles.statVal, { color: '#059669' }]}>
                {stats.viewedCount} ({stats.viewRate}%)
              </Text>
              <Text style={styles.statLbl}>شاهدوا المنشور</Text>
            </View>
            <View style={[styles.statCard, { borderColor: 'rgba(217, 119, 6, 0.3)' }]}>
              <Text style={[styles.statVal, { color: '#D97706' }]}>
                {stats.notViewedCount}
              </Text>
              <Text style={styles.statLbl}>لم يشاهدوا بعد</Text>
            </View>
            {stats.confirmedCount > 0 && (
              <View style={[styles.statCard, { borderColor: 'rgba(123, 30, 58, 0.3)' }]}>
                <Text style={[styles.statVal, { color: theme.colors.brand[500] }]}>
                  {stats.confirmedCount} ({stats.confirmationRate}%)
                </Text>
                <Text style={styles.statLbl}>أكدوا الاطلاع</Text>
              </View>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'viewed' && styles.tabBtnActive]}
              onPress={() => setActiveTab('viewed')}
            >
              <Text
                style={[styles.tabBtnText, activeTab === 'viewed' && styles.tabBtnTextActive]}
              >
                المشاهدون ({stats.viewedCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'notViewed' && styles.tabBtnActive]}
              onPress={() => setActiveTab('notViewed')}
            >
              <Text
                style={[styles.tabBtnText, activeTab === 'notViewed' && styles.tabBtnTextActive]}
              >
                لم يشاهدوا بعد ({stats.notViewedCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search and Filters */}
          <View style={styles.filterBar}>
            <View style={styles.searchBox}>
              <Search size={14} color={theme.colors.text.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="بحث بالاسم أو المعرف..."
                placeholderTextColor={theme.colors.text.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                textAlign="right"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={14} color={theme.colors.text.muted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* User List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.brand[500]} />
              <Text style={styles.loadingText}>جاري تحميل سجل المشاهدات من الخادم...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredList}
              keyExtractor={(item, index) => item.user?._id || `viewer-${index}`}
              renderItem={renderViewerItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Users size={36} color={theme.colors.text.subtle} />
                  <Text style={styles.emptyTitle}>لا توجد نتائج مطابقة</Text>
                  <Text style={styles.emptySub}>
                    {activeTab === 'viewed'
                      ? 'لم يقم أي مستخدم بمشاهدة المنشور بعد حتى الآن.'
                      : 'جميع المستهدفين قاموا بالاطلاع على المنشور!'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FDFBF7',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    maxHeight: '88%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: 'rgba(243, 233, 220, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.25)',
  },
  headerTitleGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(123, 30, 58, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123, 30, 58, 0.2)',
  },
  headerTexts: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.brand[500],
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 11,
    color: theme.colors.text.muted,
    marginTop: 2,
    textAlign: 'right',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  statsRow: {
    flexDirection: 'row-reverse',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.15)',
    backgroundColor: '#fff',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.2)',
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  statLbl: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.colors.text.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  tabsRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    backgroundColor: '#FDFBF7',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(243, 233, 220, 0.5)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.2)',
  },
  tabBtnActive: {
    backgroundColor: theme.colors.brand[500],
    borderColor: theme.colors.brand[500],
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  tabBtnTextActive: {
    color: '#F3E9DC',
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FDFBF7',
  },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.primary,
  },
  listContent: {
    padding: 14,
    gap: 8,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.2)',
  },
  userRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3E9DC',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  userInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  userNameRoleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.brand[500],
    textAlign: 'right',
  },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(201, 162, 77, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.gold[700],
  },
  phoneRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  phoneText: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
  viewCountBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  viewCountBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  confirmedBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
  },
  confirmedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 6,
  },
  emptySub: {
    fontSize: 11,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
});
