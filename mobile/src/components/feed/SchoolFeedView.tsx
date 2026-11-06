import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Megaphone,
  Sparkles,
  Plus,
  Pin,
  AlertTriangle,
  Globe,
  Filter,
} from 'lucide-react-native';
import { Platform } from 'react-native';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { theme } from '../../theme/tokens';
import { PostItem } from './types';
import { PostCard } from './PostCard';
import { PostOptionsMenuModal } from './PostOptionsMenuModal';
import { PostViewersAnalyticsModal } from './PostViewersAnalyticsModal';
import { CreatePostModal } from './CreatePostModal';
import { EditPostModal } from './EditPostModal';

const notifyUser = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

interface SchoolFeedViewProps {
  onOpenDrawer?: () => void;
}

export const SchoolFeedView: React.FC<SchoolFeedViewProps> = () => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pinned' | 'important'>('all');

  // Modal states
  const [optionsPost, setOptionsPost] = useState<PostItem | null>(null);
  const [analyticsPost, setAnalyticsPost] = useState<PostItem | null>(null);
  const [editPost, setEditPost] = useState<PostItem | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // RBAC: Roles allowed to publish posts
  const canPublish = ['admin', 'school', 'teacher', 'general_supervisor', 'pedagogical_supervisor'].includes(
    user?.role || ''
  );

  const fetchPosts = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/posts');
      const data = Array.isArray(res.data) ? res.data : res.data.posts || [];
      setPosts(data);
    } catch (err: any) {
      console.error('Failed to fetch school feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, [fetchPosts]);

  // Reaction handler: like, love, dislike
  const handleReact = async (postId: string, reactionType: 'like' | 'love' | 'dislike') => {
    try {
      const res = await apiClient.post(`/api/posts/${postId}/react`, { reactionType });
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === postId) {
            return {
              ...p,
              reactionCounts: res.data.reactionCounts,
              userReaction: res.data.userReaction,
            };
          }
          return p;
        })
      );
    } catch (err: any) {
      console.error('Error reacting to post:', err);
    }
  };

  // Confirm Read ("اطلعت على الإعلان" - Art. 16)
  const handleConfirmRead = async (postId: string) => {
    try {
      const res = await apiClient.post(`/api/posts/${postId}/confirm-read`);
      notifyUser('نجاح', res.data?.message || 'تم تسجيل اطلاعك على هذا الإعلان الرسمي بنجاح.');
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, userConfirmed: true } : p))
      );
    } catch (err: any) {
      notifyUser('خطأ', err.response?.data?.message || 'فشل تأكيد الاطلاع.');
    }
  };

  // Toggle Hide Post
  const handleToggleHide = async (post: PostItem) => {
    try {
      const res = await apiClient.patch(`/api/posts/${post._id}/hide`);
      notifyUser('نجاح', res.data?.message || 'تم تحديث حالة المنشور.');
      setPosts((prev) =>
        prev.map((p) => (p._id === post._id ? { ...p, isHidden: res.data.isHidden } : p))
      );
    } catch (err: any) {
      notifyUser('خطأ', err.response?.data?.message || 'فشل إخفاء المنشور.');
    }
  };

  // Toggle Pin Post
  const handleTogglePin = async (post: PostItem) => {
    try {
      const res = await apiClient.put(`/api/posts/${post._id}/pin`);
      notifyUser('نجاح', res.data?.message || 'تم تحديث تثبيت المنشور.');
      setPosts((prev) =>
        prev.map((p) => (p._id === post._id ? { ...p, isPinned: res.data.isPinned } : p))
      );
    } catch (err: any) {
      notifyUser('خطأ', err.response?.data?.message || 'فشل تثبيت المنشور.');
    }
  };

  // Toggle Comments Lock
  const handleToggleLock = async (post: PostItem) => {
    try {
      const res = await apiClient.put(`/api/posts/${post._id}/lock-comments`);
      notifyUser('نجاح', res.data?.message || 'تم تحديث حالة التعليقات.');
      setPosts((prev) =>
        prev.map((p) =>
          p._id === post._id ? { ...p, commentsLocked: res.data.commentsLocked } : p
        )
      );
    } catch (err: any) {
      notifyUser('خطأ', err.response?.data?.message || 'فشل قفل التعليقات.');
    }
  };

  // Delete Post
  const handleDeletePost = async (post: PostItem) => {
    try {
      await apiClient.delete(`/api/posts/${post._id}`);
      notifyUser('نجاح', 'تم حذف المنشور نهائياً من الشبكة المدرسية.');
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
    } catch (err: any) {
      notifyUser('خطأ', err.response?.data?.message || 'فشل حذف المنشور.');
    }
  };

  // Delete Comment
  const handleDeleteComment = async (postId: string, commentId: string) => {
    const executeDelete = async () => {
      try {
        const res = await apiClient.delete(`/api/posts/${postId}/comments/${commentId}`);
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, comments: res.data.comments } : p))
        );
        notifyUser('نجاح', 'تم حذف التعليق.');
      } catch (err: any) {
        notifyUser('خطأ', err.response?.data?.message || 'فشل حذف التعليق.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
        executeDelete();
      }
    } else {
      Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذا التعليق؟', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  // Handle Post Created
  const handlePostCreated = (newPost: PostItem) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // Handle Post Updated
  const handlePostUpdated = (updatedPost: PostItem) => {
    setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  };

  // Filtered list
  const filteredPosts = posts.filter((p) => {
    if (activeFilter === 'pinned') return p.isPinned;
    if (activeFilter === 'important') return p.isImportant;
    return true;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.brand[500]]}
            tintColor={theme.colors.brand[500]}
          />
        }
      >
        {/* Top Banner Card */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerIconBg}>
              <Megaphone size={22} color="#F3E9DC" />
            </View>
            <View style={styles.bannerTextGroup}>
              <View style={styles.bannerTitleRow}>
                <Text style={styles.bannerTitle}>فضاء التواصل والشبكة المدرسية</Text>
                <View style={styles.liveBadge}>
                  <Sparkles size={11} color={theme.colors.gold[500]} />
                  <Text style={styles.liveBadgeText}>مباشر</Text>
                </View>
              </View>
              <Text style={styles.bannerSubtitle}>
                الإعلانات الرسمية، المذكرات الإدارية، والتفاعل الأكاديمي
              </Text>
            </View>
          </View>

          {/* Quick Publish Action if role is authorized */}
          {canPublish && (
            <TouchableOpacity
              style={styles.publishActionBtn}
              onPress={() => setCreateModalVisible(true)}
              activeOpacity={0.85}
            >
              <Plus size={16} color="#F3E9DC" />
              <Text style={styles.publishActionBtnText}>نشر إعلان رسمي جديد</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips Bar */}
        <View style={styles.filtersBar}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'all' && styles.filterChipTextActive,
              ]}
            >
              جميع المنشورات ({posts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'pinned' && styles.filterChipActive]}
            onPress={() => setActiveFilter('pinned')}
          >
            <Pin size={12} color={activeFilter === 'pinned' ? '#F3E9DC' : theme.colors.gold[600]} />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'pinned' && styles.filterChipTextActive,
              ]}
            >
              المثبتة ({posts.filter((p) => p.isPinned).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'important' && styles.filterChipActive]}
            onPress={() => setActiveFilter('important')}
          >
            <AlertTriangle
              size={12}
              color={activeFilter === 'important' ? '#F3E9DC' : '#D97706'}
            />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'important' && styles.filterChipTextActive,
              ]}
            >
              إعلانات هامة ({posts.filter((p) => p.isImportant).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts Feed List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.brand[500]} />
            <Text style={styles.loadingText}>جاري استرجاع منشورات الشبكة المدرسية...</Text>
          </View>
        ) : filteredPosts.length > 0 ? (
          <View style={styles.feedList}>
            {filteredPosts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={user?.id}
                currentUserRole={user?.role}
                onOpenOptions={(p) => setOptionsPost(p)}
                onOpenAnalytics={(p) => setAnalyticsPost(p)}
                onReact={handleReact}
                onConfirmRead={handleConfirmRead}
                onDeleteComment={handleDeleteComment}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Globe size={42} color={theme.colors.gold[500]} />
            <Text style={styles.emptyTitle}>لا توجد منشورات متاحة حالياً</Text>
            <Text style={styles.emptySub}>
              لم يتم العثور على أي إعلانات موجهة لحسابك في هذا القسم.
            </Text>
            {canPublish && (
              <TouchableOpacity
                style={styles.emptyPublishBtn}
                onPress={() => setCreateModalVisible(true)}
              >
                <Plus size={15} color="#F3E9DC" />
                <Text style={styles.emptyPublishText}>أنشئ أول منشور الآن</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: Three Dots Options Menu */}
      <PostOptionsMenuModal
        visible={!!optionsPost}
        post={optionsPost}
        onClose={() => setOptionsPost(null)}
        onEdit={(p) => {
          setEditPost(p);
        }}
        onToggleHide={handleToggleHide}
        onTogglePin={handleTogglePin}
        onToggleLockComments={handleToggleLock}
        onDelete={handleDeletePost}
      />

      {/* MODAL 2: Who Viewed the Post Analytics Modal */}
      <PostViewersAnalyticsModal
        visible={!!analyticsPost}
        postId={analyticsPost?._id || null}
        postTitle={analyticsPost?.title}
        onClose={() => setAnalyticsPost(null)}
      />

      {/* MODAL 3: Create Post Modal */}
      <CreatePostModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onPostCreated={handlePostCreated}
      />

      {/* MODAL 4: Edit Post Modal */}
      <EditPostModal
        visible={!!editPost}
        post={editPost}
        onClose={() => setEditPost(null)}
        onPostUpdated={handlePostUpdated}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.canvas,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  bannerCard: {
    backgroundColor: theme.colors.brand[500],
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: theme.colors.brand[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  bannerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(243, 233, 220, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextGroup: {
    flex: 1,
    alignItems: 'flex-end',
  },
  bannerTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F3E9DC',
  },
  liveBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(201, 162, 77, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.gold[500],
  },
  bannerSubtitle: {
    fontSize: 11,
    color: 'rgba(243, 233, 220, 0.8)',
    marginTop: 2,
    textAlign: 'right',
  },
  publishActionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(243, 233, 220, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    borderRadius: 12,
    paddingVertical: 10,
  },
  publishActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F3E9DC',
  },
  filtersBar: {
    flexDirection: 'row-reverse',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: theme.colors.brand[500],
    borderColor: theme.colors.brand[500],
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  filterChipTextActive: {
    color: '#F3E9DC',
  },
  feedList: {
    gap: 4,
  },
  loadingContainer: {
    padding: 50,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.25)',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.brand[500],
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    color: theme.colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyPublishBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.brand[500],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  emptyPublishText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F3E9DC',
  },
});
