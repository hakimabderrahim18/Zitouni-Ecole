const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Message = require('../models/message.model');
const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const Class = require('../models/class.model');
const AuditLog = require('../models/auditLog.model');

// Compute the set of user IDs the given user is allowed to converse with,
// following the school communication rules (Art. 18-19):
//   - Administration & Supervisors (admin, school, general_supervisor, pedagogical_supervisor) can talk to everyone.
//   - Teachers can talk to: other teachers, administration/supervisors, and the students
//     (and their parents) of the classes they teach.
//   - Students can talk to: classmates (same class), their own teachers, and administration.
//   - Parents can talk to: their own children's teachers, and administration.
const computeAllowedContactIds = async (reqUser) => {
  const myUserId = reqUser.id.toString();
  const role = reqUser.role;

  // Administration and Supervisors can contact everyone
  if (['admin', 'school', 'general_supervisor', 'pedagogical_supervisor'].includes(role)) {
    const everyone = await User.find({ _id: { $ne: myUserId } }).select('_id');
    return new Set(everyone.map((u) => u._id.toString()));
  }

  const allowed = new Set();

  // Everyone may reach the administration and supervisors
  const adminsAndSupervisors = await User.find({
    role: { $in: ['admin', 'school', 'general_supervisor', 'pedagogical_supervisor'] },
  }).select('_id');
  adminsAndSupervisors.forEach((a) => allowed.add(a._id.toString()));

  if (role === 'teacher') {
    const teacher = await Teacher.findOne({ user: myUserId });
    // Other teachers
    const otherTeachers = await Teacher.find({ user: { $ne: myUserId } }).select('user');
    otherTeachers.forEach((t) => allowed.add(t.user.toString()));

    if (teacher) {
      const students = await Student.find({
        $or: [
          { group: { $in: teacher.groups || [] } },
          { class: { $in: teacher.classes || [] } },
        ],
      }).select('user parent');

      const parentIds = [];
      students.forEach((s) => {
        if (s.user) allowed.add(s.user.toString());
        if (s.parent) parentIds.push(s.parent);
      });
      if (parentIds.length > 0) {
        const parents = await Parent.find({ _id: { $in: parentIds } }).select('user');
        parents.forEach((p) => {
          if (p.user) allowed.add(p.user.toString());
        });
      }
    }
  } else if (role === 'student') {
    const student = await Student.findOne({ user: myUserId });
    if (student) {
      // Classmates (same class)
      const classmates = await Student.find({ class: student.class, user: { $ne: myUserId } }).select('user');
      classmates.forEach((s) => {
        if (s.user) allowed.add(s.user.toString());
      });
      // Their teachers
      const teachers = await Teacher.find({
        $or: [{ groups: student.group }, { classes: student.class }],
      }).select('user');
      teachers.forEach((t) => {
        if (t.user) allowed.add(t.user.toString());
      });
    }
  } else if (role === 'parent') {
    const parent = await Parent.findOne({ user: myUserId });
    if (parent && parent.children && parent.children.length > 0) {
      const children = await Student.find({ _id: { $in: parent.children } }).select('user group class');
      const groupIds = [];
      const classIds = [];
      children.forEach((c) => {
        if (c.user) allowed.add(c.user.toString());
        if (c.group) groupIds.push(c.group);
        if (c.class) classIds.push(c.class);
      });
      const teachers = await Teacher.find({
        $or: [{ groups: { $in: groupIds } }, { classes: { $in: classIds } }],
      }).select('user');
      teachers.forEach((t) => {
        if (t.user) allowed.add(t.user.toString());
      });
    }
  }

  allowed.delete(myUserId);
  return allowed;
};

// Return the directory of contacts the current user is allowed to message
const getContacts = async (req, res, next) => {
  try {
    const allowedIds = await computeAllowedContactIds(req.user);
    const contacts = await User.find({ _id: { $in: [...allowedIds] }, isActive: true })
      .select('firstName lastName role profilePic email phoneNumber')
      .sort({ role: 1, lastName: 1, firstName: 1 });
    res.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
};

// Get message history between two users (Direct Chat)
const getMessageHistory = async (req, res, next) => {
  const { otherUserId } = req.params;
  const currentUserId = req.user.id;

  try {
    const messages = await Message.find({
      conversationType: 'direct',
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    })
      .populate('sender', 'firstName lastName role profilePic')
      .populate('receiver', 'firstName lastName role profilePic')
      .populate({
        path: 'replyTo',
        select: 'content sender attachmentUrl mediaType createdAt isDeleted isHidden',
        populate: { path: 'sender', select: 'firstName lastName role' },
      })
      .sort({ createdAt: 1 });

    // Mark as read if receiving messages and register seen timestamp
    const now = new Date();
    await Message.updateMany(
      {
        sender: otherUserId,
        receiver: currentUserId,
        isRead: false,
      },
      {
        $set: { isRead: true, status: 'read', readAt: now },
        $push: { seenBy: { user: currentUserId, seenAt: now } },
      }
    );

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

// Retrieve recent chats list (Direct)
const getConversations = async (req, res, next) => {
  const currentUserId = req.user.id;

  try {
    const chats = await Message.aggregate([
      {
        $match: {
          conversationType: 'direct',
          $or: [
            { sender: new mongoose.Types.ObjectId(currentUserId) },
            { receiver: new mongoose.Types.ObjectId(currentUserId) },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', new mongoose.Types.ObjectId(currentUserId)] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$content' },
          lastUpdated: { $first: '$createdAt' },
          lastStatus: { $first: '$status' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', new mongoose.Types.ObjectId(currentUserId)] },
                    { $eq: ['$isRead', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const populatedChats = await Promise.all(
      chats.map(async (chat) => {
        const user = await User.findById(chat._id).select('firstName lastName role profilePic phoneNumber');
        return {
          user,
          lastMessage: chat.lastMessage,
          lastUpdated: chat.lastUpdated,
          lastStatus: chat.lastStatus,
          unreadCount: chat.unreadCount,
        };
      })
    );

    res.status(200).json(populatedChats.filter((c) => c.user != null));
  } catch (error) {
    next(error);
  }
};

// Send a direct message
const sendMessage = async (req, res, next) => {
  const { receiverId, content, attachmentUrl, attachmentName, mediaType, replyTo } = req.body;
  const senderId = req.user.id;

  try {
    if (!receiverId) {
      return res.status(400).json({ message: 'Le destinataire est requis / Receiver is required' });
    }

    // Enforce communication rules unless administration
    if (!['admin', 'school', 'general_supervisor', 'pedagogical_supervisor'].includes(req.user.role)) {
      const allowedIds = await computeAllowedContactIds(req.user);
      if (!allowedIds.has(receiverId.toString())) {
        return res.status(403).json({ message: 'Non autorisé à contacter cet utilisateur.' });
      }
    }

    let detectedMediaType = mediaType || 'none';
    if (!mediaType && attachmentUrl) {
      if (/\.(jpg|jpeg|png|webp|gif)$/i.test(attachmentUrl)) detectedMediaType = 'image';
      else if (/\.(mp4|webm|mov)$/i.test(attachmentUrl)) detectedMediaType = 'video';
      else if (/\.pdf$/i.test(attachmentUrl)) detectedMediaType = 'pdf';
      else detectedMediaType = 'file';
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      conversationType: 'direct',
      content: content || '',
      attachmentUrl: attachmentUrl || '',
      attachmentName: attachmentName || '',
      mediaType: detectedMediaType,
      replyTo: replyTo || null,
      status: 'delivered',
      deliveredAt: new Date(),
      seenBy: [{ user: senderId, seenAt: new Date() }],
    });

    const populatedMsg = await Message.findById(message._id)
      .populate('sender', 'firstName lastName role profilePic')
      .populate('receiver', 'firstName lastName role profilePic')
      .populate({
        path: 'replyTo',
        select: 'content sender attachmentUrl mediaType createdAt isDeleted isHidden',
        populate: { path: 'sender', select: 'firstName lastName role' },
      });

    // Broadcast via socket.io
    try {
      const { getIO } = require('../sockets/socket.manager');
      const io = getIO();
      const room = [senderId, receiverId].sort().join('_');
      io.to(room).emit('receive_direct_message', populatedMsg);
    } catch (socketError) {
      // socket.io not initialized or inactive
    }

    // Trigger persistent notification
    try {
      const { notifyForMessage } = require('../services/notification.service');
      notifyForMessage(message);
    } catch (notifyErr) {
      console.error('Failed to notify for message:', notifyErr);
    }

    res.status(201).json(populatedMsg);
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// School Group Channels (Art. 18-19)
// ----------------------------------------------------

// Retrieve available group channels for current user
const getGroupChannels = async (req, res, next) => {
  const user = req.user;
  const role = user.role;
  const groups = [];

  try {
    // 1. General Administration / Teachers Staff Channel
    if (['admin', 'school', 'general_supervisor', 'pedagogical_supervisor', 'teacher'].includes(role)) {
      groups.push({
        channelId: 'group_teachers_staff',
        title: 'قاعة الأساتذة وهيئة التدريس (Teachers Staff)',
        groupType: 'teachers',
        description: 'مجموعة المداولات والتبادل بين الطاقم التربوي والإدارة',
      });
    }

    // 2. Supervisors / Administration Channel
    if (['admin', 'school', 'general_supervisor', 'pedagogical_supervisor'].includes(role)) {
      groups.push({
        channelId: 'group_supervisors_admin',
        title: 'إدارة الإشراف والمراقبة العامة (Supervisors & Admin)',
        groupType: 'supervisors',
        description: 'غرفة التنسيق بين الإدارة والمراقبين',
      });
    }

    // 3. Class channels
    if (['admin', 'school', 'general_supervisor', 'pedagogical_supervisor'].includes(role)) {
      // Admins & Supervisors see all classes
      const classes = await Class.find().sort({ name: 1 });
      classes.forEach((cls) => {
        groups.push({
          channelId: `group_class_${cls._id}`,
          classId: cls._id,
          title: `فوج القسم: ${cls.name}`,
          groupType: 'class',
          description: `قناة التواصل الرسمية مع تلاميذ قسم ${cls.name}`,
        });
        groups.push({
          channelId: `group_parents_${cls._id}`,
          classId: cls._id,
          title: `أولياء أمور قسم: ${cls.name}`,
          groupType: 'class_parents',
          description: `قناة التواصل مع أولياء تلاميذ قسم ${cls.name}`,
        });
      });
    } else if (role === 'teacher') {
      const teacher = await Teacher.findOne({ user: user.id });
      if (teacher && teacher.classes && teacher.classes.length > 0) {
        const classes = await Class.find({ _id: { $in: teacher.classes } }).sort({ name: 1 });
        classes.forEach((cls) => {
          groups.push({
            channelId: `group_class_${cls._id}`,
            classId: cls._id,
            title: `فوج القسم: ${cls.name}`,
            groupType: 'class',
            description: `قناة التواصل مع تلاميذ قسم ${cls.name}`,
          });
          groups.push({
            channelId: `group_parents_${cls._id}`,
            classId: cls._id,
            title: `أولياء أمور قسم: ${cls.name}`,
            groupType: 'class_parents',
            description: `قناة التواصل مع أولياء تلاميذ قسم ${cls.name}`,
          });
        });
      }
    } else if (role === 'student') {
      const student = await Student.findOne({ user: user.id }).populate('class');
      if (student && student.class) {
        groups.push({
          channelId: `group_class_${student.class._id}`,
          classId: student.class._id,
          title: `فوج القسم: ${student.class.name}`,
          groupType: 'class',
          description: `قناة قسمك الرسمية للتواصل مع الأساتذة والزملاء`,
        });
      }
    } else if (role === 'parent') {
      const parent = await Parent.findOne({ user: user.id }).populate({
        path: 'children',
        populate: { path: 'class' },
      });
      if (parent && parent.children) {
        const seenClass = new Set();
        parent.children.forEach((child) => {
          if (child.class && !seenClass.has(child.class._id.toString())) {
            seenClass.add(child.class._id.toString());
            groups.push({
              channelId: `group_parents_${child.class._id}`,
              classId: child.class._id,
              title: `أولياء أمور قسم: ${child.class.name} (${child.firstName})`,
              groupType: 'class_parents',
              description: `قناة التواصل الرسمية مع أساتذة قسم ${child.class.name}`,
            });
          }
        });
      }
    }

    // Attach last message and unread count for each group
    const groupsWithStats = await Promise.all(
      groups.map(async (grp) => {
        const lastMsg = await Message.findOne({ groupChannelId: grp.channelId })
          .sort({ createdAt: -1 })
          .populate('sender', 'firstName lastName role');
        const unreadCount = await Message.countDocuments({
          groupChannelId: grp.channelId,
          sender: { $ne: user.id },
          'readBy.user': { $ne: user.id },
        });

        return {
          ...grp,
          lastMessage: lastMsg ? `${lastMsg.sender?.firstName || ''}: ${lastMsg.content || '📎 مرفق'}` : '',
          lastUpdated: lastMsg ? lastMsg.createdAt : null,
          unreadCount,
        };
      })
    );

    res.status(200).json(groupsWithStats);
  } catch (error) {
    next(error);
  }
};

// Get group messages for a specific channel
const getGroupMessages = async (req, res, next) => {
  const { channelId } = req.params;
  const userId = req.user.id;

  try {
    const channelVariants = [channelId];
    if (channelId.startsWith('group_class_') || channelId.startsWith('group_parents_')) {
      const isClass = channelId.startsWith('group_class_');
      const prefix = isClass ? 'group_class_' : 'group_parents_';
      const suffix = channelId.replace(prefix, '');
      
      let cls = null;
      if (mongoose.isValidObjectId(suffix)) {
        cls = await Class.findById(suffix);
      } else {
        cls = await Class.findOne({
          $or: [
            { name: suffix },
            { name: suffix.replace(/([0-9])([A-Z])/g, '$1 $2') },
            { name: suffix.replace(/\s+/g, '') },
          ],
        });
      }

      if (cls) {
        channelVariants.push(`${prefix}${cls._id}`);
        channelVariants.push(`${prefix}${cls.name}`);
        channelVariants.push(`${prefix}${cls.name.replace(/\s+/g, '')}`);
      }
    }

    const messages = await Message.find({ groupChannelId: { $in: channelVariants }, conversationType: 'group' })
      .populate('sender', 'firstName lastName role profilePic')
      .populate({
        path: 'replyTo',
        select: 'content sender attachmentUrl mediaType createdAt isDeleted isHidden',
        populate: { path: 'sender', select: 'firstName lastName role' },
      })
      .sort({ createdAt: 1 });

    // Mark unread messages as read by current user and register seen timestamp
    const now = new Date();
    await Message.updateMany(
      {
        groupChannelId: { $in: channelVariants },
        sender: { $ne: userId },
        'readBy.user': { $ne: userId },
      },
      {
        $push: {
          readBy: { user: userId, readAt: now },
          seenBy: { user: userId, seenAt: now },
        },
        $set: { isRead: true },
      }
    );

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

// Send a message to a school group channel
const sendGroupMessage = async (req, res, next) => {
  const { channelId } = req.params;
  const { content, attachmentUrl, attachmentName, mediaType, replyTo, groupTitle, groupType, classId } = req.body;
  const senderId = req.user.id;

  try {
    if (!content && !attachmentUrl) {
      return res.status(400).json({ message: 'Le message ou la pièce jointe est requis.' });
    }

    let detectedMediaType = mediaType || 'none';
    if (!mediaType && attachmentUrl) {
      if (/\.(jpg|jpeg|png|webp|gif)$/i.test(attachmentUrl)) detectedMediaType = 'image';
      else if (/\.(mp4|webm|mov)$/i.test(attachmentUrl)) detectedMediaType = 'video';
      else if (/\.pdf$/i.test(attachmentUrl)) detectedMediaType = 'pdf';
      else detectedMediaType = 'file';
    }

    const message = await Message.create({
      sender: senderId,
      conversationType: 'group',
      groupChannelId: channelId,
      groupType: groupType || 'class',
      groupTitle: groupTitle || '',
      class: classId || undefined,
      content: content || '',
      attachmentUrl: attachmentUrl || '',
      attachmentName: attachmentName || '',
      mediaType: detectedMediaType,
      replyTo: replyTo || null,
      status: 'delivered',
      deliveredAt: new Date(),
      readBy: [{ user: senderId, readAt: new Date() }],
      seenBy: [{ user: senderId, seenAt: new Date() }],
    });

    const populatedMsg = await Message.findById(message._id)
      .populate('sender', 'firstName lastName role profilePic')
      .populate({
        path: 'replyTo',
        select: 'content sender attachmentUrl mediaType createdAt isDeleted isHidden',
        populate: { path: 'sender', select: 'firstName lastName role' },
      });

    // Broadcast via socket.io to the group room
    try {
      const { getIO } = require('../sockets/socket.manager');
      const io = getIO();
      io.to(channelId).emit('receive_group_message', populatedMsg);
    } catch (socketError) {
      // socket.io not initialized
    }

    res.status(201).json(populatedMsg);
  } catch (error) {
    next(error);
  }
};

// Audit logs of conversations with mandatory justification reason (Art. 18-19)
const auditConversationWithReason = async (req, res, next) => {
  const { userAId, userBId, reason } = req.body;
  const auditorId = req.user.id;

  try {
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        message: 'Le motif administratif officiel de la consultation est obligatoire (Art. 18).',
      });
    }

    // Record formal audit in security logs
    await AuditLog.create({
      user: auditorId,
      action: 'CONVERSATION_AUDIT',
      targetType: 'Conversation',
      targetId: `${userAId}_${userBId}`,
      reason: reason.trim(),
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      metadata: { userA: userAId, userB: userBId },
    });

    // Stamp the messages with audit trace
    await Message.updateMany(
      {
        conversationType: 'direct',
        $or: [
          { sender: userAId, receiver: userBId },
          { sender: userBId, receiver: userAId },
        ],
      },
      {
        $push: {
          auditLogs: {
            auditedBy: auditorId,
            auditedAt: new Date(),
            reason: reason.trim(),
          },
        },
      }
    );

    const messages = await Message.find({
      conversationType: 'direct',
      $or: [
        { sender: userAId, receiver: userBId },
        { sender: userBId, receiver: userAId },
      ],
    })
      .populate('sender', 'firstName lastName role email phoneNumber')
      .populate('receiver', 'firstName lastName role email phoneNumber')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      auditedAt: new Date(),
      count: messages.length,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

// Legacy general audit overview
const auditAllConversations = async (req, res, next) => {
  try {
    const allMessages = await Message.find()
      .populate('sender', 'firstName lastName role email')
      .populate('receiver', 'firstName lastName role email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json(allMessages);
  } catch (error) {
    next(error);
  }
};

// Handle file attachment upload (PDF, Photos, Videos, Documents)
const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni / No file provided' });
    }

    let mediaType = 'file';
    if (req.file.mimetype.startsWith('image/')) mediaType = 'image';
    else if (req.file.mimetype.startsWith('video/')) mediaType = 'video';
    else if (req.file.mimetype === 'application/pdf') mediaType = 'pdf';

    const safeFilename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const uploadsDir = path.join(__dirname, '../../uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, safeFilename);
    fs.writeFileSync(filePath, req.file.buffer);

    res.status(200).json({
      url: `/uploads/${safeFilename}`,
      name: req.file.originalname,
      mediaType,
      size: req.file.size,
    });
  } catch (error) {
    next(error);
  }
};

// React to a message with an emoji (👍, ❤️, 😂, 😮, 😢, 🙏, etc.)
const reactToMessage = async (req, res, next) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user.id;

  try {
    if (!emoji) {
      return res.status(400).json({ message: 'رمز التفاعل مطلوب.' });
    }

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'الرسالة غير موجودة.' });

    if (!message.reactions) message.reactions = [];

    const existingIdx = message.reactions.findIndex(
      (r) => r.user && r.user.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingIdx > -1) {
      message.reactions.splice(existingIdx, 1);
    } else {
      const otherIdx = message.reactions.findIndex(
        (r) => r.user && r.user.toString() === userId.toString()
      );
      if (otherIdx > -1) {
        message.reactions[otherIdx].emoji = emoji;
        message.reactions[otherIdx].createdAt = new Date();
      } else {
        message.reactions.push({ user: userId, emoji, createdAt: new Date() });
      }
    }

    await message.save();

    try {
      const { getIO } = require('../sockets/socket.manager');
      const io = getIO();
      const targetRoom = message.conversationType === 'group'
        ? message.groupChannelId
        : [message.sender.toString(), message.receiver.toString()].sort().join('_');
      io.to(targetRoom).emit('message_reaction_updated', {
        messageId: message._id,
        reactions: message.reactions,
      });
    } catch (e) {}

    res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    next(error);
  }
};

// Mark message as seen with exact date and time
const markMessageSeen = async (req, res, next) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'الرسالة غير موجودة.' });

    if (!message.seenBy) message.seenBy = [];
    const now = new Date();

    const existingIdx = message.seenBy.findIndex(
      (s) => s.user && s.user.toString() === userId.toString()
    );

    if (existingIdx === -1) {
      message.seenBy.push({ user: userId, seenAt: now });
      message.isRead = true;
      message.status = 'read';
      message.readAt = now;
      await message.save();

      try {
        const { getIO } = require('../sockets/socket.manager');
        const io = getIO();
        const targetRoom = message.conversationType === 'group'
          ? message.groupChannelId
          : [message.sender.toString(), message.receiver.toString()].sort().join('_');
        io.to(targetRoom).emit('message_seen_updated', {
          messageId: message._id,
          seenBy: message.seenBy,
          readAt: now,
        });
      } catch (e) {}
    }

    res.status(200).json({
      seenBy: message.seenBy,
      readAt: message.readAt,
    });
  } catch (error) {
    next(error);
  }
};

// Moderate: Toggle Hide Message (Admin & General Supervisor)
const toggleHideMessage = async (req, res, next) => {
  const { messageId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'الرسالة غير موجودة.' });

    const isModerator = ['admin', 'school', 'general_supervisor'].includes(userRole);
    if (!isModerator) {
      return res.status(403).json({ message: 'غير مصرح لك بإخفاء هذه الرسالة.' });
    }

    message.isHidden = !message.isHidden;
    message.hiddenBy = message.isHidden ? userId : null;
    message.hiddenAt = message.isHidden ? new Date() : null;
    await message.save();

    try {
      const { getIO } = require('../sockets/socket.manager');
      const io = getIO();
      const targetRoom = message.conversationType === 'group'
        ? message.groupChannelId
        : [message.sender.toString(), message.receiver.toString()].sort().join('_');
      io.to(targetRoom).emit('message_moderated', {
        messageId: message._id,
        isHidden: message.isHidden,
        isDeleted: message.isDeleted,
      });
    } catch (e) {}

    res.status(200).json({
      message: message.isHidden ? 'تم إخفاء الرسالة.' : 'تم إظهار الرسالة.',
      isHidden: message.isHidden,
    });
  } catch (error) {
    next(error);
  }
};

// Moderate: Delete Message (Sender or Admin/General Supervisor)
const deleteMessage = async (req, res, next) => {
  const { messageId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'الرسالة غير موجودة.' });

    const isSender = message.sender.toString() === userId.toString();
    const isModerator = ['admin', 'school', 'general_supervisor'].includes(userRole);

    if (!isSender && !isModerator) {
      return res.status(403).json({ message: 'غير مصرح لك بحذف هذه الرسالة.' });
    }

    message.isDeleted = true;
    message.deletedBy = userId;
    message.deletedAt = new Date();
    message.content = 'تم حذف هذه الرسالة من قبل الإدارة';
    message.attachmentUrl = '';
    message.attachmentName = '';
    await message.save();

    try {
      const { getIO } = require('../sockets/socket.manager');
      const io = getIO();
      const targetRoom = message.conversationType === 'group'
        ? message.groupChannelId
        : [message.sender.toString(), message.receiver.toString()].sort().join('_');
      io.to(targetRoom).emit('message_moderated', {
        messageId: message._id,
        isDeleted: true,
        content: message.content,
      });
    } catch (e) {}

    res.status(200).json({ message: 'تم حذف الرسالة بنجاح.' });
  } catch (error) {
    next(error);
  }
};

// Report Message (Any user)
const reportMessage = async (req, res, next) => {
  const { messageId } = req.params;
  const { reason, details } = req.body;
  const reporterId = req.user.id;

  try {
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'سبب الإبلاغ مطلوب.' });
    }

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'الرسالة غير موجودة.' });

    if (!message.reports) message.reports = [];
    message.reports.push({
      reporter: reporterId,
      reason: reason.trim(),
      details: details ? details.trim() : '',
      status: 'pending',
      reportedAt: new Date(),
    });
    message.isReported = true;
    await message.save();

    res.status(201).json({
      message: 'تم إرسال البلاغ بنجاح إلى إدارة المؤسسة والمراقب العام للمراجعة.',
      reportCount: message.reports.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get Reported Messages (Admin, School, General Supervisor)
const getReportedMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [{ isReported: true }, { 'reports.0': { $exists: true } }],
    })
      .populate('sender', 'firstName lastName role profilePic username phoneNumber')
      .populate('receiver', 'firstName lastName role profilePic username phoneNumber')
      .populate('reports.reporter', 'firstName lastName role profilePic username')
      .populate('reports.reviewedBy', 'firstName lastName role')
      .sort({ updatedAt: -1 });

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

// Resolve Report (Admin, School, General Supervisor)
const resolveReport = async (req, res, next) => {
  const { messageId, reportId } = req.params;
  const { action, status } = req.body;
  const reviewerId = req.user.id;

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'الرسالة غير موجودة.' });

    let report = null;
    if (message.reports && typeof message.reports.id === 'function') {
      report = message.reports.id(reportId);
    }
    if (!report && Array.isArray(message.reports)) {
      report = message.reports.find((r) => r._id && r._id.toString() === String(reportId));
    }

    if (report) {
      if (action === 'dismiss') {
        report.status = 'dismissed';
      } else if (action === 'reopen') {
        report.status = 'pending';
      } else if (['hide', 'delete'].includes(action)) {
        report.status = 'action_taken';
      } else if (status) {
        report.status = status;
      }
      report.reviewedBy = reviewerId;
      report.reviewedAt = new Date();
    }

    if (action === 'hide') {
      message.isHidden = true;
      message.hiddenBy = reviewerId;
      message.hiddenAt = new Date();
    } else if (action === 'unhide') {
      message.isHidden = false;
      message.hiddenBy = null;
      message.hiddenAt = null;
    } else if (action === 'delete') {
      if (!message.originalContent) {
        message.originalContent = message.content;
      }
      message.isDeleted = true;
      message.deletedBy = reviewerId;
      message.deletedAt = new Date();
      message.content = 'تم حذف هذه الرسالة لمخالفتها شروط الاستخدام والأخلاقيات المدرسية';
    } else if (action === 'restore') {
      message.isDeleted = false;
      message.deletedBy = null;
      message.deletedAt = null;
      if (message.originalContent) {
        message.content = message.originalContent;
      }
    }

    const allResolved = (message.reports || []).every((r) => r.status !== 'pending');
    message.isReported = !allResolved;

    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'firstName lastName role profilePic username phoneNumber')
      .populate('receiver', 'firstName lastName role profilePic username phoneNumber')
      .populate('reports.reporter', 'firstName lastName role profilePic username')
      .populate('reports.reviewedBy', 'firstName lastName role');

    res.status(200).json({
      message: 'تمت معالجة البلاغ وتحديث حالة الرسالة بنجاح.',
      messageData: updatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessageHistory,
  getConversations,
  sendMessage,
  getContacts,
  getGroupChannels,
  getGroupMessages,
  sendGroupMessage,
  auditConversationWithReason,
  auditAllConversations,
  uploadAttachment,
  reactToMessage,
  markMessageSeen,
  toggleHideMessage,
  deleteMessage,
  reportMessage,
  getReportedMessages,
  resolveReport,
};
