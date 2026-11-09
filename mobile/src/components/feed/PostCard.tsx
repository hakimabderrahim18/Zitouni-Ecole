import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Pin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  MoreVertical,
  ThumbsUp,
  Heart,
  ThumbsDown,
  MessageSquare,
  Eye,
  EyeOff,
  UserX,
  Download,
  FileText,
  ExternalLink,
  Send,
  CornerDownLeft,
  Trash2,
  Lock,
} from 'lucide-react-native';
import { apiClient, API_BASE_URL } from '../../api/client';
import { theme } from '../../theme/tokens';
import { PostItem, PostComment } from './types';

interface PostCardProps {
  post: PostItem;
  currentUserId?: string;
  currentUserRole?: string;
  onOpenOptions: (post: PostItem) => void;
  onOpenAnalytics: (post: PostItem) => void;
  onReact: (postId: string, reactionType: 'like' | 'love' | 'dislike') => void;
  onConfirmRead: (postId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onToggleHideComment?: (postId: string, commentId: string) => void;
  onBanUserFromComments?: (postId: string, targetUserId: string, userName?: string) => void;
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

const audienceLabels: Record<string, string> = {
  all: 'كامل المؤسسة',
  admin_only: 'الإدارة العامة فقط',
  teachers: 'الأساتذة فقط',
  parents: 'أولياء الأمور فقط',
  students: 'التلاميذ فقط',
  supervisors: 'المشرفون والمراقبون',
  level: 'طور تعليمي',
  class: 'قسم دراسي محدد',
  group: 'فوج محدد',
};

const resolveMediaUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = API_BASE_URL.replace(/\/+$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
};

const timeAgo = (dateStr?: string): string => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'الآن';
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(daysCount(diff));
  if (days < 7) return `منذ ${days} يوم`;
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-DZ');
};

const daysCount = (seconds: number) => seconds / 86400;

const formatPostFullTime = (dateStr?: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateFormatted = d.toLocaleDateString('ar-DZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const ago = timeAgo(dateStr);
  return `${dateFormatted} في تمام ${time} (${ago})`;
};

const formatCommentTime = (dateStr?: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const ago = timeAgo(dateStr);
  return `${time} • ${ago}`;
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  currentUserRole,
  onOpenOptions,
  onOpenAnalytics,
  onReact,
  onConfirmRead,
  onDeleteComment,
  onToggleHideComment,
  onBanUserFromComments,
}) => {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);

  const publisher = post.publisher;
  const authorName = publisher
    ? `${publisher.firstName || ''} ${publisher.lastName || ''}`.trim() || 'الإدارة العامة'
    : 'الإدارة العامة';
  const authorInitials = `${publisher?.firstName?.[0] || 'إ'}${publisher?.lastName?.[0] || ''}`;
  const authorRoleLabel = roleLabels[post.publisherRole] || post.publisherRole || 'إدارة المؤسسة';

  const isOwner = publisher?._id === currentUserId;
  const isPrivileged = [
    'admin',
    'school',
    'general_supervisor',
    'pedagogical_supervisor',
  ].includes(currentUserRole || '');
  const canModerate = isOwner || isPrivileged;
  const canViewAnalytics = post.canViewAnalytics ?? (isOwner || isPrivileged);

  const reactionCounts = post.reactionCounts || {
    like: post.likes?.length || 0,
    love: 0,
    dislike: 0,
    total: post.likes?.length || 0,
  };

  const likeCount = reactionCounts.like || 0;
  const loveCount = reactionCounts.love || 0;
  const dislikeCount = reactionCounts.dislike || 0;
  const isLiked =
    post.userReaction === 'like' ||
    (post.userReaction === undefined && (post.likes || []).includes(currentUserId || ''));
  const isLoved = post.userReaction === 'love';
  const isDisliked = post.userReaction === 'dislike';

  const comments = post.comments || [];
  const commentsCount = comments.length;

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await apiClient.post(`/api/posts/${post._id}/comment`, {
        content: commentText.trim(),
      });
      if (res.data?.comments) {
        post.comments = res.data.comments;
      }
      setCommentText('');
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل إرسال التعليق.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSendReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    try {
      const res = await apiClient.post(`/api/posts/${post._id}/comments/${commentId}/reply`, {
        content: replyText.trim(),
      });
      if (res.data?.comments) {
        post.comments = res.data.comments;
      }
      setReplyText('');
      setActiveReplyCommentId(null);
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل إرسال الرد.');
    }
  };

  const handleOpenDoc = (url: string) => {
    const fullUrl = resolveMediaUrl(url);
    if (Platform.OS === 'web') {
      window.open(fullUrl, '_blank');
      return;
    }
    Linking.openURL(fullUrl).catch(() => {
      Alert.alert('خطأ', 'تعذر فتح الملف.');
    });
  };

  return (
    <View
      style={[
        styles.cardContainer,
        post.isPinned && styles.cardPinned,
        post.isImportant && styles.cardImportant,
      ]}
    >
      {/* 1. Pinned Post Top Banner (Image 1) */}
      {post.isPinned && (
        <View style={styles.pinnedHeader}>
          <View style={styles.pinnedRight}>
            <Pin size={13} color={theme.colors.gold[600]} style={{ transform: [{ rotate: '45deg' }] }} />
            <Text style={styles.pinnedTitle}>منشور مثبت في أعلى الصفحة</Text>
          </View>
          <View style={styles.mainAnnouncementBadge}>
            <Text style={styles.mainAnnouncementText}>إعلان رئيسي</Text>
          </View>
        </View>
      )}

      {/* 2. Important Notice Bar (Art. 16 - Image 1) */}
      {post.isImportant && (
        <View style={styles.importantNoticeBar}>
          <View style={styles.importantNoticeRight}>
            <AlertTriangle size={14} color={theme.colors.brand[500]} />
            <Text style={styles.importantNoticeText}>
              إعلان رسمي هام يتطلب تأكيد الاطلاع بموجب المادة 16
            </Text>
          </View>

          {post.userConfirmed ? (
            <View style={styles.confirmedPill}>
              <CheckCircle2 size={13} color="#059669" />
              <Text style={styles.confirmedPillText}>تم تأكيد الاطلاع</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.confirmReadBtn}
              onPress={() => onConfirmRead(post._id)}
            >
              <CheckCircle2 size={13} color={theme.colors.gold[500]} />
              <Text style={styles.confirmReadBtnText}>اطلعت على هذا الإعلان</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 3. Author Header (Image 1) */}
      <View style={styles.header}>
        {/* Author Avatar + Names */}
        <View style={styles.authorInfoGroup}>
          <View style={styles.avatarCrest}>
            {publisher?.profilePic ? (
              <Image source={{ uri: resolveMediaUrl(publisher.profilePic) }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitials}>{authorInitials}</Text>
            )}
          </View>

          <View style={styles.authorTexts}>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName}>{authorName}</Text>
              <View style={styles.authorRoleBadge}>
                <Text style={styles.authorRoleBadgeText}>{authorRoleLabel}</Text>
              </View>
            </View>

            <View style={styles.metaTimeRow}>
              <View style={styles.timePill}>
                <Clock size={11} color={theme.colors.gold[600]} />
                <Text style={styles.timePillText}>{formatPostFullTime(post.createdAt)}</Text>
              </View>
              <View style={styles.audiencePill}>
                <Users size={11} color={theme.colors.gold[600]} />
                <Text style={styles.audiencePillText}>
                  {audienceLabels[post.targetAudience] || 'مستهدف'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Three Dots Button (⋮) - Always prominent (Image 1) */}
        {canModerate && (
          <TouchableOpacity
            style={styles.threeDotsBtn}
            onPress={() => onOpenOptions(post)}
            accessibilityLabel="خيارات المنشور"
          >
            <MoreVertical size={18} color={theme.colors.brand[500]} />
          </TouchableOpacity>
        )}
      </View>

      {/* 4. Post Title & Content Body (Image 1) */}
      <View style={styles.body}>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.content}>{post.content}</Text>

        {/* 5. Multi-Attachments View (Image 1 - PDF Document Box) */}
        {post.attachments && post.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {/* Documents & PDFs */}
            {post.attachments
              .filter((a) => ['pdf', 'document', 'file'].includes(a.fileType) || a.url.endsWith('.pdf'))
              .map((doc, idx) => (
                <TouchableOpacity
                  key={`doc-${idx}`}
                  style={styles.docAttachmentCard}
                  onPress={() => handleOpenDoc(doc.url)}
                  activeOpacity={0.8}
                >
                  <Download size={16} color={theme.colors.gold[600]} />
                  <View style={styles.docTextGroup}>
                    <Text style={styles.docName} numberOfLines={1}>
                      {doc.name || 'وثيقة مرفقة.pdf'}
                    </Text>
                    <Text style={styles.docTypeBadge}>PDF</Text>
                  </View>
                  <View style={styles.docIconBox}>
                    <FileText size={18} color={theme.colors.brand[500]} />
                  </View>
                </TouchableOpacity>
              ))}

            {/* Images Gallery */}
            {post.attachments
              .filter((a) => a.fileType === 'image' || (!a.fileType && (a.url.endsWith('.jpg') || a.url.endsWith('.png'))))
              .map((img, idx) => (
                <TouchableOpacity
                  key={`img-${idx}`}
                  onPress={() => handleOpenDoc(img.url)}
                  activeOpacity={0.9}
                  style={styles.imageWrapper}
                >
                  <Image
                    source={{ uri: resolveMediaUrl(img.url) }}
                    style={styles.attachmentImg}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* Pedagogical Interactive Links */}
        {post.pedagogicalLinks && post.pedagogicalLinks.length > 0 && (
          <View style={styles.pedagogicalLinksRow}>
            {post.pedagogicalLinks.map((link, idx) => (
              <TouchableOpacity
                key={`link-${idx}`}
                style={styles.pedagogicalLinkPill}
                onPress={() => Linking.openURL(link.url).catch(() => {})}
              >
                <ExternalLink size={12} color={theme.colors.gold[600]} />
                <Text style={styles.pedagogicalLinkText} numberOfLines={1}>
                  {link.title || link.url}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* 6. Stats & Analytics Row (Image 1: من شاهد المنشور؟ + ملخص التفاعلات) */}
      <View style={styles.statsRow}>
        {/* Right side: « من شاهد المنشور؟ » Pill Button */}
        {canViewAnalytics ? (
          <TouchableOpacity
            style={styles.viewersPillBtn}
            onPress={() => onOpenAnalytics(post)}
          >
            <Eye size={14} color={theme.colors.gold[600]} />
            <Text style={styles.viewersPillText}>
              من شاهد المنشور؟ ({post.viewsCount || 0})
            </Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {/* Left side: Reaction summary counter + Comments count (Image 1) */}
        <View style={styles.reactionSummaryGroup}>
          {(likeCount > 0 || loveCount > 0 || dislikeCount > 0) && (
            <View style={styles.reactionChipsRow}>
              {likeCount > 0 && (
                <Text style={styles.summaryChipText}>
                  {likeCount} <Text style={{ color: '#2563EB' }}>👍</Text>
                </Text>
              )}
              {loveCount > 0 && (
                <Text style={styles.summaryChipText}>
                  {loveCount} <Text style={{ color: '#E11D48' }}>❤️</Text>
                </Text>
              )}
              {dislikeCount > 0 && (
                <Text style={styles.summaryChipText}>
                  {dislikeCount} <Text style={{ color: '#475569' }}>👎</Text>
                </Text>
              )}
            </View>
          )}

          {commentsCount > 0 && (
            <TouchableOpacity onPress={() => setCommentsOpen(!commentsOpen)}>
              <Text style={styles.commentsCountText}>{commentsCount} تعليقات</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 7. Action Buttons Bar (Image 1: أعجبني / أحببته / لم يعجبني / التعليقات) */}
      <View style={styles.actionBar}>
        {/* 1. Like (أعجبني) */}
        <TouchableOpacity
          style={[styles.actionBtn, isLiked && styles.actionBtnActiveLike]}
          onPress={() => onReact(post._id, 'like')}
        >
          <ThumbsUp
            size={16}
            color={isLiked ? '#2563EB' : theme.colors.text.secondary}
            fill={isLiked ? '#2563EB' : 'transparent'}
          />
          <Text style={[styles.actionBtnLabel, isLiked && { color: '#2563EB' }]}>
            أعجبني
          </Text>
          {likeCount > 0 && <Text style={styles.actionBtnBadge}>({likeCount})</Text>}
        </TouchableOpacity>

        {/* 2. Love (أحببته) */}
        <TouchableOpacity
          style={[styles.actionBtn, isLoved && styles.actionBtnActiveLove]}
          onPress={() => onReact(post._id, 'love')}
        >
          <Heart
            size={16}
            color={isLoved ? '#E11D48' : theme.colors.text.secondary}
            fill={isLoved ? '#E11D48' : 'transparent'}
          />
          <Text style={[styles.actionBtnLabel, isLoved && { color: '#E11D48' }]}>
            أحببته
          </Text>
          {loveCount > 0 && <Text style={styles.actionBtnBadge}>({loveCount})</Text>}
        </TouchableOpacity>

        {/* 3. Dislike (لم يعجبني) */}
        <TouchableOpacity
          style={[styles.actionBtn, isDisliked && styles.actionBtnActiveDislike]}
          onPress={() => onReact(post._id, 'dislike')}
        >
          <ThumbsDown
            size={16}
            color={isDisliked ? '#1E293B' : theme.colors.text.secondary}
            fill={isDisliked ? '#1E293B' : 'transparent'}
          />
          <Text style={[styles.actionBtnLabel, isDisliked && { color: '#1E293B' }]}>
            لم يعجبني
          </Text>
          {dislikeCount > 0 && <Text style={styles.actionBtnBadge}>({dislikeCount})</Text>}
        </TouchableOpacity>

        {/* 4. Comments (التعليقات) */}
        <TouchableOpacity
          style={[styles.actionBtn, commentsOpen && styles.actionBtnActiveComments]}
          onPress={() => setCommentsOpen(!commentsOpen)}
        >
          <MessageSquare
            size={16}
            color={commentsOpen ? theme.colors.brand[500] : theme.colors.text.secondary}
          />
          <Text
            style={[
              styles.actionBtnLabel,
              commentsOpen && { color: theme.colors.brand[500] },
            ]}
          >
            التعليقات
          </Text>
          {commentsCount > 0 && (
            <Text style={styles.actionBtnBadge}>({commentsCount})</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 8. Threaded Comments Section */}
      {commentsOpen && (
        <View style={styles.commentsSection}>
          {post.commentsLocked && (
            <View style={styles.commentsLockedBanner}>
              <Lock size={13} color="#E11D48" />
              <Text style={styles.commentsLockedText}>
                التعليقات مغلقة على هذا المنشور من قبل الإدارة
              </Text>
            </View>
          )}

          {/* Add Comment Input */}
          {!post.commentsLocked && (
            <View style={styles.addCommentRow}>
              <TouchableOpacity
                style={[styles.sendCommentBtn, submittingComment && { opacity: 0.6 }]}
                onPress={handleSendComment}
                disabled={submittingComment}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Send size={14} color="#fff" />
                )}
              </TouchableOpacity>
              <TextInput
                style={styles.commentInput}
                placeholder="اكتب تعليقك أو استفسارك هنا..."
                placeholderTextColor={theme.colors.text.muted}
                value={commentText}
                onChangeText={setCommentText}
                textAlign="right"
              />
            </View>
          )}

          {/* Comments List */}
          {comments.length > 0 ? (
            <View style={styles.commentsList}>
              {comments.map((comm) => {
                const commUserId = typeof comm.user === 'object' ? comm.user?._id : comm.user;
                const isCommentAuthor = commUserId && String(commUserId) === String(currentUserId);
                const canDeleteThisComment = canModerate || isCommentAuthor;
                const isUserBanned = post.bannedUsersFromComments?.some(
                  (id) => String(id) === String(commUserId)
                );

                return (
                  <View
                    key={comm._id}
                    style={[
                      styles.commentCard,
                      comm.isHidden && styles.commentCardHidden,
                    ]}
                  >
                    <View style={styles.commentHeader}>
                      <View style={styles.commentAuthorRow}>
                        <Text style={styles.commentAuthorName}>{comm.userName}</Text>
                        {comm.userRole ? (
                          <View style={styles.commentRoleTag}>
                            <Text style={styles.commentRoleTagText}>
                              {roleLabels[comm.userRole] || comm.userRole}
                            </Text>
                          </View>
                        ) : null}
                        {comm.isHidden && (
                          <View style={styles.hiddenCommentBadge}>
                            <Text style={styles.hiddenCommentBadgeText}>مخفي</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.commentActionGroup}>
                        {/* Ban/Unban user on this post */}
                        {canModerate && commUserId && String(commUserId) !== String(currentUserId) && (
                          <TouchableOpacity
                            onPress={() => onBanUserFromComments?.(post._id, String(commUserId), comm.userName)}
                            style={[
                              styles.commentActionBtn,
                              isUserBanned && styles.commentActionBtnBanned,
                            ]}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <UserX size={13} color={isUserBanned ? '#BE123C' : '#94A3B8'} />
                          </TouchableOpacity>
                        )}

                        {/* Delete comment */}
                        {canDeleteThisComment && (
                          <TouchableOpacity
                            onPress={() => onDeleteComment(post._id, comm._id)}
                            style={styles.commentActionBtn}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Trash2 size={13} color="#BE123C" />
                          </TouchableOpacity>
                        )}

                        {/* Hide / Unhide comment */}
                        {canModerate && (
                          <TouchableOpacity
                            onPress={() => onToggleHideComment?.(post._id, comm._id)}
                            style={[
                              styles.commentActionBtn,
                              comm.isHidden && styles.commentActionBtnHidden,
                            ]}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            {comm.isHidden ? (
                              <Eye size={13} color="#D97706" />
                            ) : (
                              <EyeOff size={13} color="#94A3B8" />
                            )}
                          </TouchableOpacity>
                        )}

                        {/* Timestamp with Clock */}
                        <View style={styles.commentTimeWrapper}>
                          <Text style={styles.commentTimeText}>
                            {formatCommentTime(comm.createdAt)}
                          </Text>
                          <Clock size={11} color={theme.colors.gold[600]} />
                        </View>
                      </View>
                    </View>

                    <Text style={[styles.commentContent, comm.isHidden && styles.commentContentHidden]}>
                      {comm.content}
                    </Text>

                  {/* Replies List */}
                  {comm.replies && comm.replies.length > 0 && (
                    <View style={styles.repliesList}>
                      {comm.replies.map((rep) => (
                        <View key={rep._id} style={styles.replyCard}>
                          <View style={styles.commentAuthorRow}>
                            <Text style={styles.replyAuthorName}>{rep.userName}</Text>
                            <Text style={styles.commentTimeText}>{timeAgo(rep.createdAt)}</Text>
                          </View>
                          <Text style={styles.replyContent}>{rep.content}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Reply Button & Inline Form */}
                  {!post.commentsLocked && (
                    <View style={styles.replyActionContainer}>
                      {activeReplyCommentId === comm._id ? (
                        <View style={styles.inlineReplyBox}>
                          <TextInput
                            style={styles.inlineReplyInput}
                            placeholder="اكتب ردك..."
                            placeholderTextColor={theme.colors.text.muted}
                            value={replyText}
                            onChangeText={setReplyText}
                            textAlign="right"
                          />
                          <TouchableOpacity
                            style={styles.sendReplyBtn}
                            onPress={() => handleSendReply(comm._id)}
                          >
                            <Send size={12} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setActiveReplyCommentId(null)}
                            style={styles.cancelReplyBtn}
                          >
                            <Text style={styles.cancelReplyText}>إلغاء</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.replyBtnToggle}
                          onPress={() => setActiveReplyCommentId(comm._id)}
                        >
                          <CornerDownLeft size={11} color={theme.colors.gold[600]} />
                          <Text style={styles.replyBtnToggleText}>رد</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noCommentsText}>لا توجد تعليقات بعد على هذا المنشور.</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FDFBF7',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#7B1E3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPinned: {
    borderColor: theme.colors.gold[600],
    borderWidth: 1.5,
  },
  cardImportant: {
    borderColor: 'rgba(123, 30, 58, 0.45)',
  },
  pinnedHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: 'rgba(201, 162, 77, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.3)',
  },
  pinnedRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  pinnedTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  mainAnnouncementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(123, 30, 58, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(123, 30, 58, 0.2)',
  },
  mainAnnouncementText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  importantNoticeBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(123, 30, 58, 0.2)',
    gap: 8,
  },
  importantNoticeRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  importantNoticeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.brand[500],
    flex: 1,
    textAlign: 'right',
  },
  confirmedPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  confirmedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  confirmReadBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.brand[500],
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  confirmReadBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F3E9DC',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  authorInfoGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  avatarCrest: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E9DC',
    borderWidth: 1.5,
    borderColor: 'rgba(201, 162, 77, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  authorTexts: {
    flex: 1,
    alignItems: 'flex-end',
  },
  authorNameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.brand[500],
    textAlign: 'right',
  },
  authorRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(123, 30, 58, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(123, 30, 58, 0.25)',
  },
  authorRoleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  metaTimeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  timePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.25)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timePillText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  audiencePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E9DC',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  audiencePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  threeDotsBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(243, 233, 220, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.brand[500],
    textAlign: 'right',
    lineHeight: 22,
  },
  content: {
    fontSize: 13,
    color: theme.colors.text.primary,
    textAlign: 'right',
    lineHeight: 20,
  },
  attachmentsContainer: {
    gap: 8,
    marginTop: 6,
  },
  docAttachmentCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(243, 233, 220, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  docIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(123, 30, 58, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(123, 30, 58, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  docTextGroup: {
    flex: 1,
    alignItems: 'flex-end',
  },
  docName: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.brand[500],
    textAlign: 'right',
  },
  docTypeBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  imageWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    marginTop: 4,
  },
  attachmentImg: {
    width: '100%',
    height: 180,
    backgroundColor: '#000',
  },
  pedagogicalLinksRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  pedagogicalLinkPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3E9DC',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pedagogicalLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  statsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 162, 77, 0.2)',
  },
  viewersPillBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E9DC',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  viewersPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  reactionSummaryGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  reactionChipsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(243, 233, 220, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  summaryChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  commentsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  actionBar: {
    flexDirection: 'row-reverse',
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 162, 77, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnActiveLike: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  actionBtnActiveLove: {
    backgroundColor: 'rgba(225, 29, 72, 0.08)',
  },
  actionBtnActiveDislike: {
    backgroundColor: 'rgba(30, 41, 59, 0.08)',
  },
  actionBtnActiveComments: {
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  actionBtnBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text.muted,
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 162, 77, 0.2)',
    backgroundColor: 'rgba(243, 233, 220, 0.25)',
    padding: 14,
    gap: 10,
  },
  commentsLockedBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(225, 29, 72, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  commentsLockedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BE123C',
  },
  addCommentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: theme.colors.text.primary,
  },
  sendCommentBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.brand[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsList: {
    gap: 8,
  },
  commentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.2)',
    gap: 4,
  },
  commentHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentAuthorRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  commentAuthorName: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  commentRoleTag: {
    backgroundColor: 'rgba(201, 162, 77, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  commentRoleTagText: {
    fontSize: 8,
    fontWeight: '700',
    color: theme.colors.gold[700],
  },
  commentActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentActionBtn: {
    padding: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  commentActionBtnBanned: {
    backgroundColor: 'rgba(190, 18, 60, 0.12)',
  },
  commentActionBtnHidden: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
  },
  commentTimeWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
  },
  commentTimeText: {
    fontSize: 9,
    color: theme.colors.text.muted,
  },
  commentCardHidden: {
    backgroundColor: 'rgba(254, 243, 199, 0.35)',
    borderColor: '#FCD34D',
  },
  hiddenCommentBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  hiddenCommentBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#B45309',
  },
  commentContentHidden: {
    color: '#78350F',
    fontStyle: 'italic',
  },
  commentContent: {
    fontSize: 12,
    color: theme.colors.text.primary,
    textAlign: 'right',
    lineHeight: 18,
  },
  repliesList: {
    marginTop: 6,
    gap: 4,
    paddingRight: 10,
    borderRightWidth: 2,
    borderRightColor: 'rgba(201, 162, 77, 0.3)',
  },
  replyCard: {
    backgroundColor: 'rgba(243, 233, 220, 0.4)',
    borderRadius: 8,
    padding: 6,
    gap: 2,
  },
  replyAuthorName: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  replyContent: {
    fontSize: 11,
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
  replyActionContainer: {
    alignItems: 'flex-start',
    marginTop: 4,
  },
  replyBtnToggle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  replyBtnToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.gold[700],
  },
  inlineReplyBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    marginTop: 4,
  },
  inlineReplyInput: {
    flex: 1,
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
  },
  sendReplyBtn: {
    backgroundColor: theme.colors.brand[500],
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelReplyBtn: {
    paddingHorizontal: 6,
  },
  cancelReplyText: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
  noCommentsText: {
    fontSize: 11,
    color: theme.colors.text.muted,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
