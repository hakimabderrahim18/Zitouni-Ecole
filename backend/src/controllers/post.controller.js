const Announcement = require('../models/announcement.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const User = require('../models/user.model');
const Class = require('../models/class.model');
const { notifyForAnnouncement } = require('../services/notification.service');
const path = require('path');
const fs = require('fs');

// Helper to determine target users count for analytics
const getTargetUsersForPost = async (post) => {
  let query = { isActive: { $ne: false } };

  if (post.targetAudience === 'all') {
    return await User.find(query).select('firstName lastName role profilePic phoneNumber username');
  }

  if (post.targetAudience === 'admin_only') {
    query.role = { $in: ['admin', 'school'] };
    return await User.find(query).select('firstName lastName role profilePic phoneNumber username');
  }

  if (post.targetAudience === 'teachers') {
    query.role = 'teacher';
    return await User.find(query).select('firstName lastName role profilePic phoneNumber username');
  }

  if (post.targetAudience === 'parents') {
    query.role = 'parent';
    return await User.find(query).select('firstName lastName role profilePic phoneNumber username');
  }

  if (post.targetAudience === 'students') {
    query.role = 'student';
    return await User.find(query).select('firstName lastName role profilePic phoneNumber username');
  }

  if (post.targetAudience === 'supervisors') {
    query.role = { $in: ['general_supervisor', 'pedagogical_supervisor'] };
    return await User.find(query).select('firstName lastName role profilePic phoneNumber username');
  }

  if (post.targetAudience === 'level' && post.targetLevel) {
    const classes = await Class.find({ level: post.targetLevel }).select('_id');
    const classIds = classes.map(c => c._id);
    const students = await Student.find({ class: { $in: classIds } }).populate('user');
    return students.map(s => s.user).filter(Boolean);
  }

  if (post.targetClass) {
    const queryStudent = { class: post.targetClass };
    if (post.targetGroup) queryStudent.group = post.targetGroup;
    const students = await Student.find(queryStudent).populate('user').populate('parent');
    const users = [];
    students.forEach(s => {
      if (s.user) users.push(s.user);
    });
    return users;
  }

  return await User.find({ isActive: { $ne: false } }).select('firstName lastName role profilePic phoneNumber username');
};

// 1. Get Feed (with Strict Audience Targeting & Scheduled Posts filtering)
const getFeed = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const now = new Date();

    let queryConditions = [];

    // Admins and School direction see everything
    if (['admin', 'school'].includes(userRole)) {
      queryConditions = [{}];
    } else if (['general_supervisor', 'pedagogical_supervisor'].includes(userRole)) {
      queryConditions = [
        { targetAudience: { $in: ['all', 'supervisors', 'teachers', 'admin_only', 'parents', 'students', 'level', 'class', 'group'] } },
        { isGlobal: true },
        { publisher: userId },
      ];
    } else if (userRole === 'receptionist') {
      queryConditions = [
        { targetAudience: { $in: ['all', 'parents', 'admin_only', 'supervisors'] } },
        { isGlobal: true },
        { publisher: userId },
      ];
    } else if (userRole === 'teacher') {
      queryConditions = [
        { targetAudience: { $in: ['all', 'teachers'] } },
        { isGlobal: true },
        { publisher: userId },
      ];
    } else if (userRole === 'student') {
      const student = await Student.findOne({ user: userId }).populate('class');
      const classId = student?.class?._id || student?.class;
      const classLevel = student?.class?.level || '';
      const groupId = student?.group;

      queryConditions = [
        { targetAudience: { $in: ['all', 'students'] } },
        { isGlobal: true },
      ];

      if (classLevel) {
        queryConditions.push({ targetAudience: 'level', targetLevel: classLevel });
      }

      if (classId) {
        queryConditions.push({ targetClass: classId, targetGroup: null });
        if (groupId) {
          queryConditions.push({ targetClass: classId, targetGroup: groupId });
        }
      }
    } else if (userRole === 'parent') {
      const parent = await Parent.findOne({ user: userId });
      queryConditions = [
        { targetAudience: { $in: ['all', 'parents'] } },
        { isGlobal: true },
      ];

      if (parent && parent.children && parent.children.length > 0) {
        const children = await Student.find({ _id: { $in: parent.children } }).populate('class');
        const classIds = children.map(c => c.class?._id || c.class).filter(Boolean);
        const levels = children.map(c => c.class?.level).filter(Boolean);

        if (classIds.length > 0) {
          queryConditions.push({ targetClass: { $in: classIds } });
        }
        if (levels.length > 0) {
          queryConditions.push({ targetAudience: 'level', targetLevel: { $in: levels } });
        }
      }
    }

    if (!queryConditions || queryConditions.length === 0) {
      queryConditions = [{ targetAudience: 'all' }, { isGlobal: true }];
    }

    const baseQuery = {
      $or: queryConditions,
      isArchived: { $ne: true },
    };

    // Filter scheduled posts: only author or admin can see unreleased scheduled posts
    if (!['admin', 'school'].includes(userRole)) {
      baseQuery.$and = [
        {
          $or: [
            { scheduledPublishAt: null },
            { scheduledPublishAt: { $lte: now } },
            { publisher: userId },
          ],
        },
      ];
    }

    // Record views for all retrieved posts not published by current user (Art. 15)
    const retrievedPosts = await Announcement.find(baseQuery).select('_id publisher views');
    for (const p of retrievedPosts) {
      if (p.publisher.toString() !== userId.toString()) {
        const existingView = p.views.find(v => v.user.toString() === userId.toString());
        if (existingView) {
          await Announcement.updateOne(
            { _id: p._id, 'views.user': userId },
            { $set: { 'views.$.lastViewedAt': now }, $inc: { 'views.$.viewCount': 1 } }
          );
        } else {
          await Announcement.updateOne(
            { _id: p._id },
            {
              $push: {
                views: {
                  user: userId,
                  firstViewedAt: now,
                  lastViewedAt: now,
                  viewCount: 1,
                },
              },
            }
          );
        }
      }
    }

    // Fetch feed sorted by Pinned first, then newest
    const feed = await Announcement.find(baseQuery)
      .populate('publisher', 'firstName lastName role profilePic username')
      .populate('comments.user', 'firstName lastName role profilePic')
      .populate('comments.replies.user', 'firstName lastName role profilePic')
      .sort({ isPinned: -1, createdAt: -1 });

    const isPrivileged = ['admin', 'school', 'general_supervisor', 'pedagogical_supervisor'].includes(userRole);

    // Format feed response with reactions & moderation state
    const shapedFeed = feed
      .filter(post => {
        // If post is hidden, only moderators and the author can view it
        if (post.isHidden) {
          const isOwner = post.publisher && post.publisher._id.toString() === userId.toString();
          return isOwner || isPrivileged;
        }
        return true;
      })
      .map(post => {
        const obj = post.toObject();
        const isOwner = obj.publisher && obj.publisher._id.toString() === userId.toString();

        obj.viewsCount = obj.views ? obj.views.length : 0;
        obj.confirmationsCount = obj.confirmations ? obj.confirmations.length : 0;
        obj.userConfirmed = (obj.confirmations || []).some(
          c => c.user && c.user.toString() === userId.toString()
        );
        obj.canViewAnalytics = isOwner || isPrivileged;
        obj.canModerate = isOwner || isPrivileged;

        // Rich Reactions formatting (Art. 14: أعجبني / أحببته / لم يعجبني - Real Accurate Counts)
        const reactionsList = obj.reactions || [];

        // De-duplicate likes across reactions and legacy likes array (Ensure real, accurate like counts)
        const likeUserIds = new Set();
        reactionsList
          .filter((r) => r.type === 'like')
          .forEach((r) => {
            const uId = (r.user?._id || r.user || '').toString();
            if (uId) likeUserIds.add(uId);
          });
        (obj.likes || []).forEach((uid) => {
          const uId = (uid?._id || uid || '').toString();
          if (uId) likeUserIds.add(uId);
        });

        const loveCount = reactionsList.filter((r) => r.type === 'love').length;
        const dislikeCount = reactionsList.filter((r) => r.type === 'dislike').length;
        const likeCount = likeUserIds.size;

        obj.reactionCounts = {
          like: likeCount,
          love: loveCount,
          dislike: dislikeCount,
          total: likeCount + loveCount + dislikeCount,
        };

        const myReactionObj = reactionsList.find(
          (r) => r.user && (r.user._id || r.user || '').toString() === userId.toString()
        );
        obj.userReaction = myReactionObj
          ? myReactionObj.type
          : (likeUserIds.has(userId.toString()) ? 'like' : null);

        // Check if user is banned from commenting
        obj.isUserBannedFromComments = (obj.bannedUsersFromComments || []).some(
          u => u.toString() === userId.toString()
        );

        // Format comments with hide state
        obj.comments = (obj.comments || []).map(comm => {
          if (comm.isHidden && !isOwner && !isPrivileged && comm.user?.toString() !== userId.toString()) {
            return {
              ...comm,
              content: 'تم إخفاء هذا التعليق للمراجعة الإدارية',
              isContentMasked: true,
            };
          }
          return comm;
        });

        // Privacy: delete raw view records from public feed
        delete obj.views;
        return obj;
      });

    res.status(200).json(shapedFeed);
  } catch (error) {
    next(error);
  }
};

// 2. Who Viewed the Post Analytics (Art. 15 & 16: « من شاهد المنشور؟ »)
const getPostViewersAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const post = await Announcement.findById(id)
      .populate('publisher', 'firstName lastName role profilePic')
      .populate('views.user', 'firstName lastName role profilePic phoneNumber username')
      .populate('confirmations.user', 'firstName lastName role profilePic phoneNumber username');

    if (!post) {
      return res.status(404).json({ message: 'المنشور غير موجود.' });
    }

    const isOwner = post.publisher && post.publisher._id.toString() === userId.toString();
    const isPrivileged = ['admin', 'school', 'general_supervisor', 'pedagogical_supervisor'].includes(userRole);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'غير مصرح لك بالاطلاع على إحصائيات مشاهدي هذا المنشور.' });
    }

    // 1. Get all targeted users
    const allTargetUsers = await getTargetUsersForPost(post);
    const targetCount = allTargetUsers.length;

    // 2. Map of viewers
    const viewersMap = {};
    (post.views || []).forEach(v => {
      if (v.user) {
        viewersMap[v.user._id.toString()] = {
          user: v.user,
          firstViewedAt: v.firstViewedAt,
          lastViewedAt: v.lastViewedAt,
          viewCount: v.viewCount,
        };
      }
    });

    // 3. Map of confirmations (Art. 16)
    const confirmedMap = {};
    (post.confirmations || []).forEach(c => {
      if (c.user) {
        confirmedMap[c.user._id.toString()] = c.confirmedAt;
      }
    });

    const viewersList = [];
    const notViewedList = [];

    allTargetUsers.forEach(u => {
      const uId = u._id.toString();
      const viewData = viewersMap[uId];
      const confirmedAt = confirmedMap[uId] || null;

      if (viewData) {
        viewersList.push({
          user: u,
          firstViewedAt: viewData.firstViewedAt,
          lastViewedAt: viewData.lastViewedAt,
          viewCount: viewData.viewCount,
          hasConfirmed: !!confirmedAt,
          confirmedAt,
        });
      } else {
        notViewedList.push({
          user: u,
          hasConfirmed: false,
          confirmedAt: null,
        });
      }
    });

    const viewedCount = viewersList.length;
    const notViewedCount = notViewedList.length;
    const confirmedCount = Object.keys(confirmedMap).length;
    const confirmationRate = targetCount > 0 ? Math.round((confirmedCount / targetCount) * 100) : 0;
    const viewRate = targetCount > 0 ? Math.round((viewedCount / targetCount) * 100) : 0;

    res.status(200).json({
      post: {
        _id: post._id,
        title: post.title,
        createdAt: post.createdAt,
        isImportant: post.isImportant,
        targetAudience: post.targetAudience,
      },
      stats: {
        targetCount,
        viewedCount,
        notViewedCount,
        viewRate,
        confirmedCount,
        confirmationRate,
      },
      viewersList,
      notViewedList,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Confirm Announcement Read (Art. 16: « اطلعت على الإعلان »)
const confirmAnnouncementRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Announcement.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'المنشور غير موجود.' });
    }

    const alreadyConfirmed = (post.confirmations || []).some(
      c => c.user && c.user.toString() === userId.toString()
    );

    if (!alreadyConfirmed) {
      post.confirmations.push({
        user: userId,
        confirmedAt: new Date(),
      });
      await post.save();
    }

    res.status(200).json({
      message: 'تم تأكيد الاطلاع على الإعلان بنجاح.',
      confirmationsCount: post.confirmations.length,
      userConfirmed: true,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Create Post with Multi-Attachments & Audience Targeting
const createPost = async (req, res, next) => {
  try {
    const {
      title,
      content,
      targetAudience,
      targetLevel,
      targetClass,
      targetGroup,
      isPinned,
      commentsLocked,
      scheduledPublishAt,
      isImportant,
      attachments,
      pedagogicalLinks,
      // Backwards compatibility
      isGlobal,
      attachmentUrl,
      mediaType,
    } = req.body;

    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ message: 'العنوان والمحتوى مطلوبان لنشر المنشور.' });
    }

    const publisherRole = req.user.role;

    // Normalizing attachments array
    let finalAttachments = [];
    if (attachments && Array.isArray(attachments)) {
      finalAttachments = attachments;
    } else if (attachmentUrl) {
      finalAttachments = [{
        url: attachmentUrl,
        name: 'مرفق',
        fileType: mediaType || 'file',
      }];
    }

    const postData = {
      title: title.trim(),
      content: content.trim(),
      publisher: req.user.id,
      publisherRole,
      targetAudience: targetAudience || (isGlobal ? 'all' : 'class'),
      targetLevel: targetLevel || '',
      targetClass: targetClass || null,
      targetGroup: targetGroup || null,
      isGlobal: targetAudience === 'all' || isGlobal === true,
      attachments: finalAttachments,
      pedagogicalLinks: pedagogicalLinks || [],
      attachmentUrl: finalAttachments[0]?.url || '',
      mediaType: finalAttachments[0]?.fileType || '',
      isPinned: isPinned === true,
      commentsLocked: commentsLocked === true,
      scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt) : null,
      isImportant: isImportant === true,
    };

    const newPost = await Announcement.create(postData);

    // Notify targeted users if released immediately
    if (!newPost.scheduledPublishAt || newPost.scheduledPublishAt <= new Date()) {
      notifyForAnnouncement(newPost);
    }

    const populatedPost = await Announcement.findById(newPost._id).populate(
      'publisher',
      'firstName lastName role profilePic username'
    );

    const postObj = populatedPost.toObject();
    postObj.viewsCount = 0;
    postObj.confirmationsCount = 0;
    postObj.userConfirmed = false;
    postObj.canViewAnalytics = true;
    delete postObj.views;

    res.status(201).json({
      message: 'تم نشر المنشور بنجاح في الشبكة الاجتماعية للمؤسسة.',
      post: postObj,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Toggle Like
const likePost = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const post = await Announcement.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'المنشور غير موجود.' });
    }

    const isLiked = (post.likes || []).some(uid => uid.toString() === userId.toString());
    if (isLiked) {
      post.likes = (post.likes || []).filter(uid => uid.toString() !== userId.toString());
      if (post.reactions) {
        post.reactions = post.reactions.filter(r => !(r.user && r.user.toString() === userId.toString() && r.type === 'like'));
      }
    } else {
      if (!post.likes) post.likes = [];
      post.likes.push(userId);
      if (!post.reactions) post.reactions = [];
      const hasReaction = post.reactions.some(r => r.user && r.user.toString() === userId.toString());
      if (!hasReaction) {
        post.reactions.push({ user: userId, type: 'like', createdAt: new Date() });
      }
    }

    await post.save();
    res.status(200).json({
      message: isLiked ? 'تم إلغاء الإعجاب' : 'تم الإعجاب بالمنشور',
      likesCount: post.likes.length,
      likes: post.likes,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Comment on Post
const commentPost = async (req, res, next) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;
  const userName = `${req.user.firstName} ${req.user.lastName}`.trim();
  const userRole = req.user.role;

  try {
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'لا يمكن ترك التعليق فارغاً.' });
    }

    const post = await Announcement.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'المنشور غير موجود.' });
    }

    if (post.commentsLocked) {
      return res.status(403).json({ message: 'التعليقات مغلقة على هذا المنشور من طرف الإدارة.' });
    }

    post.comments.push({
      user: userId,
      userName,
      userRole,
      content: content.trim(),
      createdAt: new Date(),
      replies: [],
    });

    await post.save();
    res.status(201).json({ message: 'تم إضافة التعليق بنجاح.', comments: post.comments });
  } catch (error) {
    next(error);
  }
};

// 7. Reply to a Comment (Art. 14: الرد على الردود وتنظيم المناقشة)
const replyToComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const userName = `${req.user.firstName} ${req.user.lastName}`.trim();
    const userRole = req.user.role;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'لا يمكن ترك الرد فارغاً.' });
    }

    const post = await Announcement.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'المنشور غير موجود.' });
    }

    if (post.commentsLocked) {
      return res.status(403).json({ message: 'التعليقات مغلقة على هذا المنشور.' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'التعليق غير موجود.' });
    }

    comment.replies.push({
      user: userId,
      userName,
      userRole,
      content: content.trim(),
      createdAt: new Date(),
    });

    await post.save();
    res.status(201).json({ message: 'تم إضافة الرد بنجاح.', comments: post.comments });
  } catch (error) {
    next(error);
  }
};

// 8. Toggle Pin Post (Art. 13: تثبيت المنشور أعلى الصفحة)
const togglePinPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Announcement.findById(id);
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود.' });

    post.isPinned = !post.isPinned;
    await post.save();

    res.status(200).json({
      message: post.isPinned ? 'تم تثبيت المنشور أعلى الصفحة.' : 'تم إلغاء تثبيت المنشور.',
      isPinned: post.isPinned,
    });
  } catch (error) {
    next(error);
  }
};

// 9. Toggle Comments Lock (Art. 13: إغلاق التعليقات)
const toggleCommentsLock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Announcement.findById(id);
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود.' });

    post.commentsLocked = !post.commentsLocked;
    await post.save();

    res.status(200).json({
      message: post.commentsLocked ? 'تم إغلاق التعليقات على هذا المنشور.' : 'تم فتح التعليقات.',
      commentsLocked: post.commentsLocked,
    });
  } catch (error) {
    next(error);
  }
};

// 10. Delete / Archive Post (Art. 17: الرقابة وحذف المنشور)
const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const post = await Announcement.findById(id);
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود.' });

    const isOwner = post.publisher.toString() === userId.toString();
    const isAuthorized = ['admin', 'school', 'general_supervisor'].includes(userRole);

    if (!isOwner && !isAuthorized) {
      return res.status(403).json({ message: 'غير مصرح لك بحذف هذا المنشور.' });
    }

    await Announcement.findByIdAndDelete(id);
    res.status(200).json({ message: 'تم حذف المنشور بنجاح.' });
  } catch (error) {
    next(error);
  }
};

// 11. Multi-Media and Documents Upload (Images, Videos, PDFs, Docs)
const uploadPostMedia = async (req, res, next) => {
  try {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'لم يتم إرسال أي ملف.' });
    }

    const files = req.files || [req.file];
    const uploadedAttachments = [];

    const uploadsDir = path.join(__dirname, '../../uploads/posts');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    for (const f of files) {
      let fileType = 'file';
      if (f.mimetype.startsWith('image/')) fileType = 'image';
      else if (f.mimetype.startsWith('video/')) fileType = 'video';
      else if (f.mimetype === 'application/pdf') fileType = 'pdf';
      else if (f.mimetype.includes('word') || f.mimetype.includes('document')) fileType = 'document';

      const safeName = `${Date.now()}-${f.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      fs.writeFileSync(path.join(uploadsDir, safeName), f.buffer);

      uploadedAttachments.push({
        url: `/uploads/posts/${safeName}`,
        name: f.originalname,
        fileType,
        size: f.size,
      });
    }

    res.status(200).json({
      attachments: uploadedAttachments,
      // Backwards compatibility for single upload
      url: uploadedAttachments[0].url,
      mediaType: uploadedAttachments[0].fileType,
      name: uploadedAttachments[0].name,
    });
  } catch (error) {
    next(error);
  }
};

// 12. React to post with like, love, or dislike (Art. 14: أعجبني / أحببته / لم يعجبني)
const reactToPost = async (req, res, next) => {
  const { id } = req.params;
  const { reactionType = 'like' } = req.body;
  const userId = req.user.id;

  try {
    const post = await Announcement.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'المنشور غير موجود.' });
    }

    if (!['like', 'love', 'dislike'].includes(reactionType)) {
      return res.status(400).json({ message: 'نوع التفاعل غير صالح.' });
    }

    if (!post.reactions) post.reactions = [];

    const existingIndex = post.reactions.findIndex(
      (r) => r.user && r.user.toString() === userId.toString()
    );

    let currentReaction = null;

    if (existingIndex > -1) {
      if (post.reactions[existingIndex].type === reactionType) {
        // Toggle off if same reaction clicked again
        post.reactions.splice(existingIndex, 1);
        currentReaction = null;
      } else {
        // Update reaction type
        post.reactions[existingIndex].type = reactionType;
        post.reactions[existingIndex].createdAt = new Date();
        currentReaction = reactionType;
      }
    } else {
      // Add new reaction
      post.reactions.push({
        user: userId,
        type: reactionType,
        createdAt: new Date(),
      });
      currentReaction = reactionType;
    }

    // Keep legacy likes array in sync for backward compatibility
    post.likes = post.reactions.filter((r) => r.type === 'like').map((r) => r.user);

    await post.save();

    const counts = {
      like: post.reactions.filter((r) => r.type === 'like').length,
      love: post.reactions.filter((r) => r.type === 'love').length,
      dislike: post.reactions.filter((r) => r.type === 'dislike').length,
      total: post.reactions.length,
    };

    res.status(200).json({
      message: currentReaction ? `تم تسجيل التفاعل بنجاح` : `تم إلغاء التفاعل`,
      reactionCounts: counts,
      userReaction: currentReaction,
      likesCount: counts.like,
    });
  } catch (error) {
    next(error);
  }
};

// 13. Edit Post (Owner, Admin, School, or General Supervisor)
const editPost = async (req, res, next) => {
  const { id } = req.params;
  const { title, content, attachments, pedagogicalLinks } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const post = await Announcement.findById(id);
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود.' });

    const isOwner = post.publisher.toString() === userId.toString();
    const isModerator = ['admin', 'school', 'general_supervisor'].includes(userRole);

    if (!isOwner && !isModerator) {
      return res.status(403).json({ message: 'غير مصرح لك بتعديل هذا المنشور.' });
    }

    if (title && title.trim()) post.title = title.trim();
    if (content && content.trim()) post.content = content.trim();
    if (attachments && Array.isArray(attachments)) post.attachments = attachments;
    if (pedagogicalLinks && Array.isArray(pedagogicalLinks)) post.pedagogicalLinks = pedagogicalLinks;

    await post.save();

    const populatedPost = await Announcement.findById(post._id)
      .populate('publisher', 'firstName lastName role profilePic username');

    res.status(200).json({
      message: 'تم تحديث المنشور بنجاح.',
      post: populatedPost,
    });
  } catch (error) {
    next(error);
  }
};

// 14. Toggle Hide / Unhide Post (Owner, Admin, School, General Supervisor)
const toggleHidePost = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const post = await Announcement.findById(id);
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود.' });

    const isOwner = post.publisher.toString() === userId.toString();
    const isModerator = ['admin', 'school', 'general_supervisor'].includes(userRole);

    if (!isOwner && !isModerator) {
      return res.status(403).json({ message: 'غير مصرح لك بإخفاء هذا المنشور.' });
    }

    post.isHidden = !post.isHidden;
    post.hiddenBy = post.isHidden ? userId : null;
    post.hiddenAt = post.isHidden ? new Date() : null;
    await post.save();

    res.status(200).json({
      message: post.isHidden ? 'تم إخفاء المنشور عن الجمهور.' : 'تم إظهار المنشور مجدداً.',
      isHidden: post.isHidden,
    });
  } catch (error) {
    next(error);
  }
};

// 15. Delete Comment (Comment author, Post owner, Admin, General Supervisor)
const deleteComment = async (req, res, next) => {
  const { id, commentId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const post = await Announcement.findById(id);
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود.' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'التعليق غير موجود.' });

    const isCommentAuthor = comment.user.toString() === userId.toString();
    const isPostOwner = post.publisher.toString() === userId.toString();
    const isModerator = ['admin', 'school', 'general_supervisor'].includes(userRole);

    if (!isCommentAuthor && !isPostOwner && !isModerator) {
      return res.status(403).json({ message: 'غير مصرح لك بحذف هذا التعليق.' });
    }

    comment.isDeleted = true;
    comment.content = 'تم حذف هذا التعليق من قبل الإدارة';
    await post.save();

    res.status(200).json({
      message: 'تم حذف التعليق بنجاح.',
      comments: post.comments,
    });
  } catch (error) {
    next(error);
  }
};

// 16. Hide / Unhide Comment
const toggleHideComment = async (req, res, next) => {
  const { id, commentId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const post = await Announcement.findById(id);
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود.' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'التعليق غير موجود.' });

    const isCommentAuthor = comment.user.toString() === userId.toString();
    const isPostOwner = post.publisher.toString() === userId.toString();
    const isModerator = ['admin', 'school', 'general_supervisor'].includes(userRole);

    if (!isCommentAuthor && !isPostOwner && !isModerator) {
      return res.status(403).json({ message: 'غير مصرح لك بإخفاء هذا التعليق.' });
    }

    comment.isHidden = !comment.isHidden;
    comment.hiddenBy = comment.isHidden ? userId : null;
    await post.save();

    res.status(200).json({
      message: comment.isHidden ? 'تم إخفاء التعليق.' : 'تم إظهار التعليق.',
      comments: post.comments,
    });
  } catch (error) {
    next(error);
  }
};

// 17. Ban user from commenting on this post
const banUserFromComments = async (req, res, next) => {
  const { id } = req.params;
  const { targetUserId } = req.body;
  const userRole = req.user.role;

  try {
    const post = await Announcement.findById(id);
    if (!post) return res.status(404).json({ message: 'المنشور غير موجود.' });

    const isModerator = ['admin', 'school', 'general_supervisor'].includes(userRole);
    if (!isModerator) {
      return res.status(403).json({ message: 'فقط الإدارة والمراقب العام يمكنهما حظر المستخدمين من التعليق.' });
    }

    if (!post.bannedUsersFromComments) post.bannedUsersFromComments = [];

    const isAlreadyBanned = post.bannedUsersFromComments.some(
      (u) => u.toString() === targetUserId.toString()
    );

    if (isAlreadyBanned) {
      post.bannedUsersFromComments = post.bannedUsersFromComments.filter(
        (u) => u.toString() !== targetUserId.toString()
      );
    } else {
      post.bannedUsersFromComments.push(targetUserId);
    }

    await post.save();

    res.status(200).json({
      message: isAlreadyBanned ? 'تم رفع حظر التعليق عن المستخدم.' : 'تم حظر المستخدم من التعليق على هذا المنشور.',
      bannedUsers: post.bannedUsersFromComments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFeed,
  getPostViewersAnalytics,
  confirmAnnouncementRead,
  createPost,
  likePost,
  reactToPost,
  editPost,
  toggleHidePost,
  commentPost,
  replyToComment,
  deleteComment,
  toggleHideComment,
  banUserFromComments,
  togglePinPost,
  toggleCommentsLock,
  deletePost,
  uploadPostMedia,
};
