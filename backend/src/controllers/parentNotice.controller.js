const ParentNotice = require('../models/parentNotice.model');
const Parent = require('../models/parent.model');
const Student = require('../models/student.model');
const AuditLog = require('../models/auditLog.model');
const { deliverParentNotice } = require('../services/scheduler.service');
const crypto = require('crypto');

/**
 * Helper to log audit
 */
const logAudit = async (user, action, targetId, details) => {
  try {
    await AuditLog.create({
      user: user._id,
      action,
      targetType: 'ParentNotice',
      targetId: targetId ? targetId.toString() : '',
      reason: details || '',
    });
  } catch (err) {
    console.error('AuditLog error:', err.message);
  }
};

/**
 * 1. Admin: Create Notice / Announcement to Parents
 */
const createNotice = async (req, res) => {
  try {
    const {
      title,
      content,
      noticeType = 'announcement',
      targetAudience = 'all',
      targetCycle = '',
      targetClass = null,
      targetStudents = [],
      targetParents = [],
      sendType = 'immediate',
      scheduledDate = null,
      appointmentDate = null,
      appointmentEndTime = '',
      appointmentLocation = 'مقر المؤسسة - قاعة الاستقبال',
      attachmentUrl = '',
      attachmentName = '',
      attachmentType = '',
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'عنوان الرسالة أو الإعلان إلزامي.' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'نص الرسالة بالتفصيل إلزامي.' });
    }

    // Generate unique idempotency key to prevent double dispatch
    const idempotencyKey = crypto.randomBytes(16).toString('hex');

    const notice = new ParentNotice({
      title: title.trim(),
      content: content.trim(),
      noticeType,
      targetAudience,
      targetCycle,
      targetClass: targetClass || null,
      targetStudents,
      targetParents,
      sendType,
      scheduledDate: sendType === 'scheduled' ? new Date(scheduledDate) : null,
      idempotencyKey,
      appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
      appointmentEndTime: appointmentEndTime.trim(),
      appointmentLocation: appointmentLocation.trim(),
      attachmentUrl,
      attachmentName,
      attachmentType,
      status: sendType === 'scheduled' ? 'scheduled' : 'sent',
      sender: req.user._id,
      senderName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'إدارة مدرسة حبر',
      sentAt: sendType === 'immediate' ? new Date() : null,
    });

    await notice.save();

    if (sendType === 'immediate') {
      // Deliver immediately
      await deliverParentNotice(notice);
    }

    await logAudit(
      req.user,
      'PARENT_NOTICE_CREATE',
      notice._id,
      `إنشاء رسالة أولياء: ${notice.title} (${sendType === 'scheduled' ? 'مجدولة' : 'فورية'})`
    );

    res.status(201).json({
      message: sendType === 'scheduled' ? 'تمت جدولة إرسال الرسالة بنجاح.' : 'تم إرسال الرسالة للأولياء بنجاح.',
      notice,
    });
  } catch (err) {
    console.error('Error creating parent notice:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء الرسالة.' });
  }
};

/**
 * 2. Admin: Get All Notices
 */
const getAllNotices = async (req, res) => {
  try {
    const { status, noticeType, targetAudience, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (noticeType) filter.noticeType = noticeType;
    if (targetAudience) filter.targetAudience = targetAudience;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const notices = await ParentNotice.find(filter)
      .populate('targetClass', 'name level')
      .populate('sender', 'firstName lastName')
      .sort({ createdAt: -1 });

    const totalCount = await ParentNotice.countDocuments();
    const sentCount = await ParentNotice.countDocuments({ status: 'sent' });
    const scheduledCount = await ParentNotice.countDocuments({ status: 'scheduled' });

    res.status(200).json({
      notices,
      metrics: {
        total: totalCount,
        sent: sentCount,
        scheduled: scheduledCount,
      },
    });
  } catch (err) {
    console.error('Error fetching parent notices:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء تحميل الرسائل.' });
  }
};

/**
 * 3. Admin: Get Notice by ID
 */
const getNoticeById = async (req, res) => {
  try {
    const notice = await ParentNotice.findById(req.params.id)
      .populate('targetClass', 'name level')
      .populate('targetStudents', 'firstNameArabic lastNameArabic registrationNumber')
      .populate('targetParents', 'fatherNameArabic motherNameArabic')
      .populate('readBy.user', 'firstName lastName');

    if (!notice) {
      return res.status(404).json({ message: 'الرسالة غير موجودة.' });
    }

    res.status(200).json(notice);
  } catch (err) {
    console.error('Error getting notice by ID:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء تحميل تفاصيل الرسالة.' });
  }
};

/**
 * 4. Admin: Duplicate or Resend Notice
 */
const resendNotice = async (req, res) => {
  try {
    const original = await ParentNotice.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ message: 'الرسالة الأصلية غير موجودة.' });
    }

    const newKey = crypto.randomBytes(16).toString('hex');
    const duplicate = new ParentNotice({
      title: original.title,
      content: original.content,
      noticeType: original.noticeType,
      targetAudience: original.targetAudience,
      targetCycle: original.targetCycle,
      targetClass: original.targetClass,
      targetStudents: original.targetStudents,
      targetParents: original.targetParents,
      sendType: 'immediate',
      idempotencyKey: newKey,
      appointmentDate: original.appointmentDate,
      appointmentEndTime: original.appointmentEndTime,
      appointmentLocation: original.appointmentLocation,
      attachmentUrl: original.attachmentUrl,
      attachmentName: original.attachmentName,
      status: 'sent',
      sender: req.user._id,
      senderName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'إدارة مدرسة حبر',
    });

    await duplicate.save();
    await deliverParentNotice(duplicate);

    await logAudit(req.user, 'PARENT_NOTICE_RESEND', duplicate._id, `إعادة إرسال رسالة: ${duplicate.title}`);

    res.status(200).json({ message: 'تمت إعادة إرسال الرسالة للأولياء بنجاح.', notice: duplicate });
  } catch (err) {
    console.error('Error resending notice:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء إعادة إرسال الرسالة.' });
  }
};

/**
 * 5. Admin: Cancel Scheduled Notice
 */
const cancelNotice = async (req, res) => {
  try {
    const notice = await ParentNotice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'الرسالة غير موجودة.' });
    }

    if (notice.status === 'sent') {
      return res.status(400).json({ message: 'لا يمكن إلغاء رسالة تم إرسالها بالفعل.' });
    }

    notice.status = 'cancelled';
    await notice.save();

    await logAudit(req.user, 'PARENT_NOTICE_CANCEL', notice._id, `إلغاء رسالة مجدولة: ${notice.title}`);

    res.status(200).json({ message: 'تم إلغاء الرسالة المجدولة بنجاح.', notice });
  } catch (err) {
    console.error('Error cancelling notice:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء إلغاء الرسالة.' });
  }
};

/**
 * 6. Admin: Delete Notice
 */
const deleteNotice = async (req, res) => {
  try {
    const notice = await ParentNotice.findByIdAndDelete(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'الرسالة غير موجودة.' });
    }

    await logAudit(req.user, 'PARENT_NOTICE_DELETE', req.params.id, `حذف رسالة: ${notice.title}`);

    res.status(200).json({ message: 'تم حذف الرسالة بنجاح.' });
  } catch (err) {
    console.error('Error deleting notice:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء حذف الرسالة.' });
  }
};

/**
 * 7. Parent: Get My Notices & Invitations
 */
const getParentNotices = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id }).populate({
      path: 'children',
      populate: { path: 'class', select: 'level _id name' },
    });

    if (!parent) {
      return res.status(404).json({ message: 'حساب الولي غير موجود.' });
    }

    const childIds = (parent.children || []).map((c) => c._id);
    const classIds = (parent.children || []).map((c) => c.class?._id).filter(Boolean);
    const cycles = [...new Set((parent.children || []).map((c) => c.class?.level).filter(Boolean))];

    // Find notices matching this parent
    const notices = await ParentNotice.find({
      status: 'sent',
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'cycle', targetCycle: { $in: cycles } },
        { targetAudience: 'class', targetClass: { $in: classIds } },
        { targetAudience: 'specific_parents', targetParents: parent._id },
        { targetAudience: 'specific_parents', targetStudents: { $in: childIds } },
      ],
    })
      .populate('targetClass', 'name level')
      .sort({ sentAt: -1, createdAt: -1 });

    const formattedNotices = notices.map((n) => {
      const isRead = (n.readBy || []).some((r) => r.user?.toString() === req.user._id.toString());
      return {
        _id: n._id,
        title: n.title,
        content: n.content,
        noticeType: n.noticeType,
        targetAudience: n.targetAudience,
        className: n.targetClass?.name || '',
        appointmentDate: n.appointmentDate,
        appointmentEndTime: n.appointmentEndTime,
        appointmentLocation: n.appointmentLocation,
        attachmentUrl: n.attachmentUrl,
        attachmentName: n.attachmentName,
        senderName: n.senderName,
        sentAt: n.sentAt || n.createdAt,
        isRead,
      };
    });

    res.status(200).json({ notices: formattedNotices });
  } catch (err) {
    console.error('Error getting parent notices:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء تحميل مراسلات الإدارة.' });
  }
};

/**
 * 8. Parent: Mark Notice as Read
 */
const markNoticeRead = async (req, res) => {
  try {
    const notice = await ParentNotice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'الرسالة غير موجودة.' });
    }

    const alreadyRead = (notice.readBy || []).some((r) => r.user?.toString() === req.user._id.toString());
    if (!alreadyRead) {
      notice.readBy.push({
        user: req.user._id,
        readAt: new Date(),
      });
      await notice.save();
    }

    res.status(200).json({ message: 'تم تسجيل قراءة الرسالة بنجاح.' });
  } catch (err) {
    console.error('Error marking notice read:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل القراءة.' });
  }
};

module.exports = {
  createNotice,
  getAllNotices,
  getNoticeById,
  resendNotice,
  cancelNotice,
  deleteNotice,
  getParentNotices,
  markNoticeRead,
};
