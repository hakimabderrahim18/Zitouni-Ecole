const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Message = require('../models/message.model');
const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');

// Compute the set of user IDs the given user is allowed to converse with,
// following the school communication rules:
//   - Administration (admin/school) can talk to everyone.
//   - Teachers can talk to: other teachers, administration, and the students
//     (and their parents) of the classes/groups they are assigned to.
//   - Students can talk to: classmates (same class), their own teachers, and administration.
//   - Parents can talk to: their own children, those children's teachers, and administration.
const computeAllowedContactIds = async (reqUser) => {
  const myUserId = reqUser.id.toString();
  const role = reqUser.role;

  // Administration reaches everyone
  if (role === 'admin' || role === 'school') {
    const everyone = await User.find({ _id: { $ne: myUserId } }).select('_id');
    return new Set(everyone.map((u) => u._id.toString()));
  }

  const allowed = new Set();

  // Everyone may reach the administration
  const admins = await User.find({ role: { $in: ['admin', 'school'] } }).select('_id');
  admins.forEach((a) => allowed.add(a._id.toString()));

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
        allowed.add(s.user.toString());
        if (s.parent) parentIds.push(s.parent);
      });
      const parents = await Parent.find({ _id: { $in: parentIds } }).select('user');
      parents.forEach((p) => allowed.add(p.user.toString()));
    }
  } else if (role === 'student') {
    const student = await Student.findOne({ user: myUserId });
    if (student) {
      // Classmates (same class)
      const classmates = await Student.find({ class: student.class, user: { $ne: myUserId } }).select('user');
      classmates.forEach((s) => allowed.add(s.user.toString()));
      // Their teachers
      const teachers = await Teacher.find({
        $or: [{ groups: student.group }, { classes: student.class }],
      }).select('user');
      teachers.forEach((t) => allowed.add(t.user.toString()));
    }
  } else if (role === 'parent') {
    const parent = await Parent.findOne({ user: myUserId });
    if (parent && parent.children.length > 0) {
      const children = await Student.find({ _id: { $in: parent.children } }).select('user group class');
      const groupIds = [];
      const classIds = [];
      children.forEach((c) => {
        allowed.add(c.user.toString());
        if (c.group) groupIds.push(c.group);
        if (c.class) classIds.push(c.class);
      });
      const teachers = await Teacher.find({
        $or: [{ groups: { $in: groupIds } }, { classes: { $in: classIds } }],
      }).select('user');
      teachers.forEach((t) => allowed.add(t.user.toString()));
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
      .select('firstName lastName role profilePic')
      .sort({ role: 1, lastName: 1, firstName: 1 });
    res.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
};

// Get message history between two users
const getMessageHistory = async (req, res, next) => {
  const { otherUserId } = req.params;
  const currentUserId = req.user.id;

  try {
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    }).sort({ createdAt: 1 });

    // Mark as read if receiving messages
    await Message.updateMany({ sender: otherUserId, receiver: currentUserId, isRead: false }, { isRead: true });

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

// Retrieve recent chats list
const getConversations = async (req, res, next) => {
  const currentUserId = req.user.id;

  try {
    // Aggregation pipeline to find unique conversation partners
    const chats = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: new mongoose.Types.ObjectId(currentUserId) }, { receiver: new mongoose.Types.ObjectId(currentUserId) }],
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

    // Populate user details for each chat partner
    const populatedChats = await Promise.all(
      chats.map(async (chat) => {
        const user = await User.findById(chat._id).select('firstName lastName role profilePic');
        return {
          user,
          lastMessage: chat.lastMessage,
          lastUpdated: chat.lastUpdated,
          unreadCount: chat.unreadCount,
        };
      })
    );

    res.status(200).json(populatedChats);
  } catch (error) {
    next(error);
  }
};

// Audit logs of all system conversations (restricted to School Administration & Platform Admins)
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

// Send a message via REST API
const sendMessage = async (req, res, next) => {
  const { receiverId, content, attachmentUrl, attachmentName } = req.body;
  const senderId = req.user.id;

  try {
    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver is required' });
    }

    // Enforce the communication rules unless the sender is administration
    if (!['admin', 'school'].includes(req.user.role)) {
      const allowedIds = await computeAllowedContactIds(req.user);
      if (!allowedIds.has(receiverId.toString())) {
        return res.status(403).json({ message: 'You are not allowed to message this user.' });
      }
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
      attachmentUrl: attachmentUrl || '',
      attachmentName: attachmentName || '',
    });

    // Try to broadcast via socket.io
    try {
      const { getIO } = require('../sockets/socket.manager');
      const io = getIO();
      const room = [senderId, receiverId].sort().join('_');
      io.to(room).emit('receive_direct_message', message);
    } catch (socketError) {
      // socket.io not initialized yet or not active
    }

    // Trigger message notification in the background
    try {
      const { notifyForMessage } = require('../services/notification.service');
      notifyForMessage(message);
    } catch (notifyErr) {
      console.error('Failed to notify for message:', notifyErr);
    }

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

// Handle file attachment upload
const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni / No file provided' });
    }

    const filename = `${Date.now()}-${req.file.originalname}`;
    const uploadsDir = path.join(__dirname, '../../uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    res.status(200).json({
      url: `/uploads/${filename}`,
      name: req.file.originalname,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessageHistory,
  getConversations,
  auditAllConversations,
  sendMessage,
  uploadAttachment,
  getContacts,
};
