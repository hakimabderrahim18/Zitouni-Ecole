const Announcement = require('../models/announcement.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const { notifyForAnnouncement } = require('../services/notification.service');

// Get announcements feed for the active user session
const getFeed = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (student) {
        query = {
          $or: [
            { isGlobal: true },
            { targetClass: student.class, targetGroup: student.group },
            { targetClass: student.class, targetGroup: null },
          ],
        };
      }
    } else if (req.user.role === 'parent') {
      const parent = await Parent.findOne({ user: req.user.id });
      if (parent && parent.children.length > 0) {
        // Find children profiles
        const childrenProfiles = await Student.find({ _id: { $in: parent.children } });
        const classIds = childrenProfiles.map(c => c.class);
        const groupIds = childrenProfiles.map(c => c.group);

        query = {
          $or: [
            { isGlobal: true },
            { targetClass: { $in: classIds }, targetGroup: { $in: groupIds } },
            { targetClass: { $in: classIds }, targetGroup: null },
          ],
        };
      } else {
        query = { isGlobal: true };
      }
    }
    // Teachers, Admin, and School Admin see all announcements
    else {
      query = {};
    }

    const userId = req.user.id;

    // Record a view for every post the current user did not author.
    const initialFeed = await Announcement.find(query).select('_id publisher');
    const idsToMarkViewed = initialFeed
      .filter((p) => p.publisher.toString() !== userId.toString())
      .map((p) => p._id);

    if (idsToMarkViewed.length > 0) {
      await Announcement.updateMany(
        { _id: { $in: idsToMarkViewed }, 'views.user': { $ne: userId } },
        { $push: { views: { user: userId, viewedAt: new Date() } } }
      );
    }

    const feed = await Announcement.find(query)
      .populate('publisher', 'firstName lastName role profilePic')
      .populate('views.user', 'firstName lastName role profilePic')
      .sort({ createdAt: -1 });

    const isPrivileged = ['admin', 'school'].includes(req.user.role);

    // Only the post owner (or an admin/school) may see the full viewer list.
    const shaped = feed.map((post) => {
      const obj = post.toObject();
      const isOwner = obj.publisher && obj.publisher._id.toString() === userId.toString();
      obj.viewsCount = obj.views ? obj.views.length : 0;
      if (isOwner || isPrivileged) {
        obj.viewers = (obj.views || []).map((v) => ({
          _id: v.user?._id,
          firstName: v.user?.firstName,
          lastName: v.user?.lastName,
          role: v.user?.role,
          profilePic: v.user?.profilePic,
          viewedAt: v.viewedAt,
        }));
      }
      delete obj.views;
      return obj;
    });

    res.status(200).json(shaped);
  } catch (error) {
    next(error);
  }
};

// Toggle like status on post
const likePost = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const post = await Announcement.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.includes(userId);
    if (isLiked) {
      post.likes = post.likes.filter(uid => uid.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.status(200).json({ message: isLiked ? 'Post unliked' : 'Post liked', likesCount: post.likes.length, likes: post.likes });
  } catch (error) {
    next(error);
  }
};

// Add a comment to post
const commentPost = async (req, res, next) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;
  const userName = `${req.user.firstName} ${req.user.lastName}`;

  try {
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment details cannot be empty' });
    }

    const post = await Announcement.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      user: userId,
      userName,
      content,
      createdAt: new Date(),
    });

    await post.save();
    res.status(201).json({ message: 'Comment added successfully', comments: post.comments });
  } catch (error) {
    next(error);
  }
};

// Create a new post/announcement
const createPost = async (req, res, next) => {
  const { title, content, isGlobal, targetClass, targetGroup, attachmentUrl, mediaType } = req.body;

  try {
    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const publisherRole = req.user.role; // admin, school, teacher
    
    // Build parameters
    const postData = {
      title,
      content,
      publisher: req.user.id,
      publisherRole,
      attachmentUrl: attachmentUrl || '',
      mediaType: mediaType || '',
    };

    if (publisherRole === 'teacher') {
      postData.isGlobal = false;
      postData.targetClass = targetClass || null;
      postData.targetGroup = targetGroup || null;
    } else {
      // Admin or school
      postData.isGlobal = isGlobal === true || isGlobal === 'true';
      if (!postData.isGlobal) {
        postData.targetClass = targetClass || null;
        postData.targetGroup = targetGroup || null;
      }
    }

    const newPost = await Announcement.create(postData);

    // Trigger notification
    notifyForAnnouncement(newPost);

    // Populate publisher details for immediate render
    const populatedPost = await Announcement.findById(newPost._id).populate(
      'publisher',
      'firstName lastName role profilePic'
    );

    const postObj = populatedPost.toObject();
    postObj.viewsCount = 0;
    postObj.viewers = [];
    delete postObj.views;

    res.status(201).json({ message: 'Post created successfully', post: postObj });
  } catch (error) {
    next(error);
  }
};

// Upload media (image/video) for a post and return its public URL
const uploadPostMedia = async (req, res, next) => {
  try {
    const fs = require('fs');
    const path = require('path');

    if (!req.file) {
      return res.status(400).json({ message: 'No media file provided' });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const isVideo = req.file.mimetype.startsWith('video/');
    if (!isImage && !isVideo) {
      return res.status(400).json({ message: 'Only image or video files are allowed for posts' });
    }

    const uploadsDir = path.join(__dirname, '../../uploads/posts');
    fs.mkdirSync(uploadsDir, { recursive: true });

    const safeName = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    fs.writeFileSync(path.join(uploadsDir, safeName), req.file.buffer);

    res.status(200).json({
      url: `/uploads/posts/${safeName}`,
      mediaType: isImage ? 'image' : 'video',
      name: req.file.originalname,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFeed, likePost, commentPost, createPost, uploadPostMedia };
