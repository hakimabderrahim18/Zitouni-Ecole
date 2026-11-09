const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Message = require('../models/message.model');
const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const Class = require('../models/class.model');
const ChatGroup = require('../models/chatGroup.model');
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
  const currentUserId = req.user.id || req.user._id;

  try {
    const now = new Date();

    // 1. Mark unread messages sent by otherUserId to currentUserId as read FIRST
    const updateResult = await Message.updateMany(
      {
        conversationType: 'direct',
        sender: otherUserId,
        receiver: currentUserId,
        $or: [{ isRead: false }, { status: { $ne: 'read' } }],
      },
      {
        $set: { isRead: true, status: 'read', readAt: now },
        $addToSet: { seenBy: { user: currentUserId, seenAt: now } },
      }
    );

    // If any messages were marked as read, broadcast real-time event to socket
    if (updateResult.modifiedCount > 0) {
      try {
        const { getIO } = require('../sockets/socket.manager');
        const io = getIO();
        const sId = String(otherUserId);
        const rId = String(currentUserId);
        const room = [sId, rId].sort().join('_');
        const payload = {
          conversationType: 'direct',
          readerId: rId,
          otherUserId: sId,
          readAt: now,
          status: 'read',
          isRead: true,
        };
        io.to(room).to(sId).to(rId).emit('conversation_messages_seen', payload);
      } catch (e) {}
    }

    // 2. Query messages with updated read & seen status
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
      const sId = String(senderId);
      const rId = String(receiverId);
      const room = [sId, rId].sort().join('_');
      io.to(room).emit('receive_direct_message', populatedMsg);
      io.to(rId).emit('receive_direct_message', populatedMsg);
      io.to(sId).emit('receive_direct_message', populatedMsg);
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

  try {
    // 1. Ensure default channels exist in database
    const defaultChannels = [
      {
        channelId: 'group_teachers_staff',
        title: 'قاعة الأساتذة وهيئة التدريس (Teachers Staff)',
        groupType: 'teachers',
        description: 'مجموعة المداولات والتبادل بين الطاقم التربوي والإدارة',
        targetAudience: ['admin', 'school', 'general_supervisor', 'pedagogical_supervisor', 'teacher'],
        isDefault: true,
      },
      {
        channelId: 'group_supervisors_admin',
        title: 'إدارة الإشراف والمراقبة العامة (Supervisors & Admin)',
        groupType: 'supervisors',
        description: 'غرفة التنسيق بين الإدارة والمراقبين',
        targetAudience: ['admin', 'school', 'general_supervisor', 'pedagogical_supervisor'],
        isDefault: true,
      },
    ];

    for (const def of defaultChannels) {
      const exists = await ChatGroup.findOne({ channelId: def.channelId });
      if (!exists) {
        await ChatGroup.create({ ...def, isActive: true });
      }
    }

    // Ensure class channels exist for each Class
    const allClasses = await Class.find().sort({ name: 1 });
    for (const cls of allClasses) {
      const classChannelId = `group_class_${cls._id}`;
      const parentsChannelId = `group_parents_${cls._id}`;

      const classExists = await ChatGroup.findOne({ channelId: classChannelId });
      if (!classExists) {
        await ChatGroup.create({
          channelId: classChannelId,
          classId: cls._id,
          title: `فوج القسم: ${cls.name}`,
          groupType: 'class',
          description: `قناة التواصل الرسمية مع تلاميذ قسم ${cls.name}`,
          targetAudience: ['admin', 'school', 'general_supervisor', 'pedagogical_supervisor', 'teacher', 'student'],
          isDefault: true,
          isActive: true,
        });
      }

      const parentsExists = await ChatGroup.findOne({ channelId: parentsChannelId });
      if (!parentsExists) {
        await ChatGroup.create({
          channelId: parentsChannelId,
          classId: cls._id,
          title: `أولياء أمور قسم: ${cls.name}`,
          groupType: 'class_parents',
          description: `قناة التواصل مع أولياء تلاميذ قسم ${cls.name}`,
          targetAudience: ['admin', 'school', 'general_supervisor', 'pedagogical_supervisor', 'teacher', 'parent'],
          isDefault: true,
          isActive: true,
        });
      }
    }

    // 2. Query all active groups from database
    const allActiveGroups = await ChatGroup.find({ isActive: { $ne: false } })
      .populate('classId', 'name level division grade')
      .populate('groupId', 'name')
      .sort({ isDefault: -1, createdAt: -1 });

    // 3. Filter groups visible to the current user
    let visibleGroups = [];

    if (['admin', 'school', 'general_supervisor', 'pedagogical_supervisor'].includes(role)) {
      visibleGroups = allActiveGroups;
    } else if (role === 'teacher') {
      const teacher = await Teacher.findOne({ user: user.id });
      const teacherClassIds = (teacher?.classes || []).map((c) => c.toString());

      visibleGroups = allActiveGroups.filter((grp) => {
        const aud = grp.targetAudience || ['all'];
        const matchesAudience = aud.includes('all') || aud.includes('teacher') || aud.includes('teachers');
        if (!matchesAudience) return false;

        // If it's attached to a specific class, teacher must teach that class
        if (grp.classId) {
          const cId = (grp.classId._id || grp.classId).toString();
          return teacherClassIds.includes(cId);
        }
        return true;
      });
    } else if (role === 'student') {
      const student = await Student.findOne({ user: user.id }).populate('class');
      const studentClassId = student?.class?._id?.toString() || student?.class?.toString();

      visibleGroups = allActiveGroups.filter((grp) => {
        const aud = grp.targetAudience || ['all'];
        const matchesAudience = aud.includes('all') || aud.includes('student') || aud.includes('students');
        if (!matchesAudience) return false;

        if (grp.classId) {
          const cId = (grp.classId._id || grp.classId).toString();
          return studentClassId && cId === studentClassId;
        }
        return true;
      });
    } else if (role === 'parent') {
      const parent = await Parent.findOne({ user: user.id }).populate('children');
      const childrenClassIds = new Set();
      (parent?.children || []).forEach((c) => {
        if (c.class) childrenClassIds.add((c.class._id || c.class).toString());
      });

      visibleGroups = allActiveGroups.filter((grp) => {
        const aud = grp.targetAudience || ['all'];
        const matchesAudience = aud.includes('all') || aud.includes('parent') || aud.includes('parents');
        if (!matchesAudience) return false;

        if (grp.classId) {
          const cId = (grp.classId._id || grp.classId).toString();
          return childrenClassIds.has(cId);
        }
        return true;
      });
    } else {
      visibleGroups = allActiveGroups.filter((grp) => {
        const aud = grp.targetAudience || ['all'];
        return aud.includes('all') || aud.includes(role);
      });
    }

    // 4. Attach last message and accurate unread count for each group
    const groupsWithStats = await Promise.all(
      visibleGroups.map(async (grp) => {
        const obj = grp.toObject();
        const lastMsg = await Message.findOne({ groupChannelId: obj.channelId })
          .sort({ createdAt: -1 })
          .populate('sender', 'firstName lastName role');
        const unreadCount = await Message.countDocuments({
          groupChannelId: obj.channelId,
          sender: { $ne: user.id },
          'seenBy.user': { $ne: user.id },
        });

        return {
          ...obj,
          lastMessage: lastMsg ? `${lastMsg.sender?.firstName || ''}: ${lastMsg.content || '📎 مرفق'}` : '',
          lastUpdated: lastMsg ? lastMsg.createdAt : obj.updatedAt || obj.createdAt,
          unreadCount,
        };
      })
    );

    res.status(200).json(groupsWithStats);
  } catch (error) {
    next(error);
  }
};

// Create a new group channel (Administration: admin, school, general_supervisor, pedagogical_supervisor)
const createGroupChannel = async (req, res, next) => {
  const { title, description, groupType = 'custom', targetAudience = ['all'], classId, groupId } = req.body;
  const userId = req.user?.id || req.user?._id;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'عنوان المجموعة مطلوب.' });
  }

  try {
    const cleanClassId = classId && mongoose.isValidObjectId(classId) ? classId : null;
    const cleanGroupId = groupId && mongoose.isValidObjectId(groupId) ? groupId : null;

    let channelId;
    if (groupType === 'class' && cleanClassId) {
      channelId = `group_class_${cleanClassId}`;
    } else if (groupType === 'class_parents' && cleanClassId) {
      channelId = `group_parents_${cleanClassId}`;
    } else if (groupType === 'class_group' && cleanGroupId) {
      channelId = `group_class_group_${cleanGroupId}`;
    } else {
      channelId = `group_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    // Check if channel already exists
    const existing = await ChatGroup.findOne({ channelId });
    if (existing) {
      existing.isActive = true;
      existing.title = title.trim();
      existing.description = description ? description.trim() : '';
      existing.groupType = groupType;
      existing.targetAudience = Array.isArray(targetAudience) && targetAudience.length > 0 ? targetAudience : ['all'];
      existing.classId = cleanClassId;
      existing.groupId = cleanGroupId;
      await existing.save();

      try {
        const { getIO } = require('../sockets/socket.manager');
        getIO().emit('group_channel_created', existing);
      } catch (e) {}

      return res.status(201).json({
        message: 'تم تفعيل وإنشاء المجموعة بنجاح.',
        group: existing,
      });
    }

    const newGroup = await ChatGroup.create({
      channelId,
      title: title.trim(),
      description: description ? description.trim() : '',
      groupType,
      targetAudience: Array.isArray(targetAudience) && targetAudience.length > 0 ? targetAudience : ['all'],
      classId: cleanClassId,
      groupId: cleanGroupId,
      createdBy: mongoose.isValidObjectId(userId) ? userId : null,
      isDefault: false,
      isActive: true,
    });

    try {
      const { getIO } = require('../sockets/socket.manager');
      getIO().emit('group_channel_created', newGroup);
    } catch (e) {}

    res.status(201).json({
      message: 'تم إنشاء المجموعة بنجاح.',
      group: newGroup,
    });
  } catch (error) {
    next(error);
  }
};

// Update an existing group channel (Administration)
const updateGroupChannel = async (req, res, next) => {
  const { channelId } = req.params;
  const { title, description, groupType, targetAudience, classId, groupId } = req.body;

  try {
    let group = await ChatGroup.findOne({ channelId });
    if (!group) {
      return res.status(404).json({ message: 'المجموعة غير موجودة.' });
    }

    if (title && title.trim()) group.title = title.trim();
    if (typeof description === 'string') group.description = description.trim();
    if (groupType) group.groupType = groupType;
    if (Array.isArray(targetAudience) && targetAudience.length > 0) {
      group.targetAudience = targetAudience;
    }
    if (classId !== undefined) {
      group.classId = classId && mongoose.isValidObjectId(classId) ? classId : null;
    }
    if (groupId !== undefined) {
      group.groupId = groupId && mongoose.isValidObjectId(groupId) ? groupId : null;
    }

    await group.save();

    try {
      const { getIO } = require('../sockets/socket.manager');
      getIO().emit('group_channel_updated', group);
    } catch (e) {}

    res.status(200).json({
      message: 'تم تحديث بيانات المجموعة بنجاح.',
      group,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a group channel (Administration)
const deleteGroupChannel = async (req, res, next) => {
  const { channelId } = req.params;

  try {
    const group = await ChatGroup.findOne({ channelId });
    if (!group) {
      return res.status(404).json({ message: 'المجموعة غير موجودة.' });
    }

    group.isActive = false;
    await group.save();

    try {
      const { getIO } = require('../sockets/socket.manager');
      getIO().emit('group_channel_deleted', { channelId });
    } catch (e) {}

    res.status(200).json({
      message: 'تم حذف المجموعة بنجاح.',
      channelId,
    });
  } catch (error) {
    next(error);
  }
};

// Get group messages for a specific channel
const getGroupMessages = async (req, res, next) => {
  const { channelId } = req.params;
  const userId = req.user.id || req.user._id;

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

    // 1. Mark unread messages as read by current user FIRST and register seen timestamp
    const now = new Date();
    const updateResult = await Message.updateMany(
      {
        groupChannelId: { $in: channelVariants },
        sender: { $ne: userId },
        'seenBy.user': { $ne: userId },
      },
      {
        $addToSet: {
          seenBy: { user: userId, seenAt: now },
          readBy: { user: userId, readAt: now },
        },
        $set: { isRead: true },
      }
    );

    if (updateResult.modifiedCount > 0) {
      try {
        const { getIO } = require('../sockets/socket.manager');
        getIO().to(String(channelId)).emit('group_messages_seen', {
          channelId,
          readerId: userId,
          seenAt: now,
        });
      } catch (e) {}
    }

    // 2. Query messages with updated seenBy
    const messages = await Message.find({ groupChannelId: { $in: channelVariants }, conversationType: 'group' })
      .populate('sender', 'firstName lastName role profilePic')
      .populate({
        path: 'replyTo',
        select: 'content sender attachmentUrl mediaType createdAt isDeleted isHidden',
        populate: { path: 'sender', select: 'firstName lastName role' },
      })
      .sort({ createdAt: 1 });

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

    // Broadcast via socket.io to the group room and global notification
    try {
      const { getIO } = require('../sockets/socket.manager');
      const io = getIO();
      const chId = String(channelId);
      io.to(chId).emit('receive_group_message', populatedMsg);
      io.emit('receive_group_message', populatedMsg);
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
      const sId = String(message.sender?._id || message.sender);
      const rId = String(message.receiver?._id || message.receiver);
      const targetRoom = message.conversationType === 'group'
        ? String(message.groupChannelId)
        : [sId, rId].sort().join('_');
      const payload = {
        messageId: message._id,
        reactions: message.reactions,
      };
      io.to(targetRoom).emit('message_reaction_updated', payload);
      if (message.conversationType !== 'group') {
        io.to(sId).emit('message_reaction_updated', payload);
        io.to(rId).emit('message_reaction_updated', payload);
      }
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
        const sId = String(message.sender?._id || message.sender);
        const rId = String(message.receiver?._id || message.receiver);
        const targetRoom = message.conversationType === 'group'
          ? String(message.groupChannelId)
          : [sId, rId].sort().join('_');
        const payload = {
          messageId: message._id,
          seenBy: message.seenBy,
          readAt: now,
          status: 'read',
          isRead: true,
          readerId: userId,
        };
        io.to(targetRoom).emit('message_seen_updated', payload);
        if (message.conversationType !== 'group') {
          io.to(sId).emit('message_seen_updated', payload);
          io.to(rId).emit('message_seen_updated', payload);
        }
      } catch (e) {}
    }

    res.status(200).json({
      messageId: message._id,
      seenBy: message.seenBy,
      readAt: message.readAt,
      status: 'read',
      isRead: true,
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
      const sId = String(message.sender?._id || message.sender);
      const rId = String(message.receiver?._id || message.receiver);
      const targetRoom = message.conversationType === 'group'
        ? String(message.groupChannelId)
        : [sId, rId].sort().join('_');
      const payload = {
        messageId: message._id,
        isHidden: message.isHidden,
        isDeleted: message.isDeleted,
      };
      io.to(targetRoom).emit('message_moderated', payload);
      if (message.conversationType !== 'group') {
        io.to(sId).emit('message_moderated', payload);
        io.to(rId).emit('message_moderated', payload);
      }
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
      const sId = String(message.sender?._id || message.sender);
      const rId = String(message.receiver?._id || message.receiver);
      const targetRoom = message.conversationType === 'group'
        ? String(message.groupChannelId)
        : [sId, rId].sort().join('_');
      const payload = {
        messageId: message._id,
        isDeleted: true,
        content: message.content,
      };
      io.to(targetRoom).emit('message_moderated', payload);
      if (message.conversationType !== 'group') {
        io.to(sId).emit('message_moderated', payload);
        io.to(rId).emit('message_moderated', payload);
      }
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
  createGroupChannel,
  updateGroupChannel,
  deleteGroupChannel,
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
