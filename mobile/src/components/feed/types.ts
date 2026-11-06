export interface PostAttachment {
  url: string;
  name?: string;
  fileType: 'image' | 'video' | 'pdf' | 'document' | 'audio' | 'file' | string;
  size?: number;
}

export interface PedagogicalLink {
  title?: string;
  url: string;
}

export interface PostCommentReply {
  _id: string;
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    profilePic?: string;
  } | string;
  userName: string;
  userRole?: string;
  content: string;
  isHidden?: boolean;
  isDeleted?: boolean;
  createdAt: string;
}

export interface PostComment {
  _id: string;
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    profilePic?: string;
  } | string;
  userName: string;
  userRole?: string;
  content: string;
  isHidden?: boolean;
  isDeleted?: boolean;
  isContentMasked?: boolean;
  createdAt: string;
  replies?: PostCommentReply[];
}

export interface ReactionCounts {
  like: number;
  love: number;
  dislike: number;
  total: number;
}

export interface PostItem {
  _id: string;
  title: string;
  content: string;
  publisher?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    profilePic?: string;
    username?: string;
  };
  publisherRole: string;
  targetAudience: string;
  targetLevel?: string;
  targetClass?: any;
  targetGroup?: any;
  isPinned?: boolean;
  isHidden?: boolean;
  isImportant?: boolean;
  commentsLocked?: boolean;
  scheduledPublishAt?: string | null;
  attachments?: PostAttachment[];
  pedagogicalLinks?: PedagogicalLink[];
  attachmentUrl?: string;
  mediaType?: string;
  reactionCounts?: ReactionCounts;
  userReaction?: 'like' | 'love' | 'dislike' | null;
  likes?: string[];
  comments?: PostComment[];
  viewsCount?: number;
  confirmationsCount?: number;
  userConfirmed?: boolean;
  canViewAnalytics?: boolean;
  canModerate?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ViewerRecord {
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    profilePic?: string;
    phoneNumber?: string;
    username?: string;
  };
  firstViewedAt?: string;
  lastViewedAt?: string;
  viewCount?: number;
  hasConfirmed?: boolean;
  confirmedAt?: string | null;
}

export interface PostAnalyticsData {
  post: {
    _id: string;
    title: string;
    createdAt: string;
    isImportant?: boolean;
    targetAudience?: string;
  };
  stats: {
    targetCount: number;
    viewedCount: number;
    notViewedCount: number;
    viewRate: number;
    confirmedCount: number;
    confirmationRate: number;
  };
  viewersList: ViewerRecord[];
  notViewedList: ViewerRecord[];
}
