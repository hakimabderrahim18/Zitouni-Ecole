const ParentNotice = require('../models/parentNotice.model');
const Assessment = require('../models/assessment.model');
const Notification = require('../models/notification.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const User = require('../models/user.model');
const { getIO } = require('../sockets/socket.manager');

// In-memory set to prevent duplicate execution during active run
const processingKeys = new Set();

/**
 * Execute sending of a scheduled or immediate notice
 */
const deliverParentNotice = async (notice) => {
  if (!notice || notice.status === 'sent') return;

  const runKey = notice.idempotencyKey || notice._id.toString();
  if (processingKeys.has(runKey)) return;
  processingKeys.add(runKey);

  try {
    // 1. Resolve target parents
    let targetParentUsers = [];

    if (notice.targetAudience === 'all') {
      const allParents = await Parent.find({}).populate('user');
      targetParentUsers = allParents.map((p) => p.user?._id).filter(Boolean);
    } else if (notice.targetAudience === 'cycle' && notice.targetCycle) {
      // Find students in classes matching this cycle
      const students = await Student.find({}).populate('class').populate('parent');
      const filtered = students.filter(
        (s) => s.class?.level === notice.targetCycle && s.parent
      );
      const parentIds = [...new Set(filtered.map((s) => s.parent.toString()))];
      const parents = await Parent.find({ _id: { $in: parentIds } }).populate('user');
      targetParentUsers = parents.map((p) => p.user?._id).filter(Boolean);
    } else if (notice.targetAudience === 'class' && notice.targetClass) {
      const students = await Student.find({ class: notice.targetClass }).populate('parent');
      const parentIds = [...new Set(students.filter((s) => s.parent).map((s) => s.parent.toString()))];
      const parents = await Parent.find({ _id: { $in: parentIds } }).populate('user');
      targetParentUsers = parents.map((p) => p.user?._id).filter(Boolean);
    } else if (notice.targetAudience === 'specific_parents') {
      if (notice.targetParents && notice.targetParents.length > 0) {
        const parents = await Parent.find({ _id: { $in: notice.targetParents } }).populate('user');
        targetParentUsers = parents.map((p) => p.user?._id).filter(Boolean);
      } else if (notice.targetStudents && notice.targetStudents.length > 0) {
        const students = await Student.find({ _id: { $in: notice.targetStudents } }).populate('parent');
        const parentIds = [...new Set(students.filter((s) => s.parent).map((s) => s.parent.toString()))];
        const parents = await Parent.find({ _id: { $in: parentIds } }).populate('user');
        targetParentUsers = parents.map((p) => p.user?._id).filter(Boolean);
      }
    }

    // Deduplicate user IDs
    const uniqueUserIds = [...new Set(targetParentUsers.map((id) => id.toString()))];

    // 2. Deliver notifications to each parent user
    let io = null;
    try {
      io = getIO();
    } catch (e) {
      // Socket not ready or running in worker
    }

    const notifPromises = uniqueUserIds.map(async (userId) => {
      try {
        const notif = await Notification.create({
          recipient: userId,
          title: `رسالة إدارية: ${notice.title}`,
          content: notice.content.length > 90 ? `${notice.content.substring(0, 90)}...` : notice.content,
          type: 'parent_notice',
        });
        if (io) {
          io.to(userId).emit('new_notification', notif);
          io.to(userId).emit('parent_notice_delivered', { noticeId: notice._id, title: notice.title });
        }
      } catch (err) {
        console.error(`Error sending notification to user ${userId}:`, err.message);
      }
    });

    await Promise.all(notifPromises);

    // 3. Update notice status
    notice.status = 'sent';
    notice.sentAt = new Date();
    notice.recipientCount = uniqueUserIds.length;
    await notice.save();

    console.log(`[SCHEDULER] Parent notice "${notice.title}" delivered to ${uniqueUserIds.length} parents.`);
  } catch (err) {
    console.error(`[SCHEDULER] Failed to deliver parent notice ${notice._id}:`, err);
    notice.status = 'failed';
    await notice.save();
  } finally {
    processingKeys.delete(runKey);
  }
};

/**
 * Auto-publish assessments that reached their scheduled publish date/time
 */
const autoPublishAssessments = async () => {
  try {
    const dueAssessments = await Assessment.find({
      status: 'approved',
      isPublished: false,
      scheduledPublishAt: { $lte: new Date(), $ne: null },
      isAutoPublishExecuted: { $ne: true },
    }).populate('class');

    for (const assessment of dueAssessments) {
      console.log(`[SCHEDULER] Auto-publishing assessment "${assessment.assessmentType}" for class "${assessment.class?.name}"`);

      assessment.isPublished = true;
      assessment.publishedAt = new Date();
      assessment.publishScope = 'general';
      assessment.isAutoPublishExecuted = true;
      // Mark all records published
      (assessment.records || []).forEach((r) => {
        r.isPublished = true;
        r.publishedAt = new Date();
      });

      assessment.history.push({
        action: 'publish',
        by: null,
        byName: 'نظام الجدولة الآلي',
        at: new Date(),
        details: 'تم النشر التلقائي للنتائج في الموعد المحدد سلفاً',
      });

      await assessment.save();

      // Notify parents and students
      try {
        let io = null;
        try {
          io = getIO();
        } catch (e) {}

        const students = await Student.find({ class: assessment.class?._id || assessment.class }).populate('user parent');

        for (const st of students) {
          // Notify student user
          if (st.user?._id) {
            const notifStudent = await Notification.create({
              recipient: st.user._id,
              title: `نشر نتائج: ${assessment.subject}`,
              content: `تم نشر نتائج ${assessment.assessmentType} لمادة ${assessment.subject}. يمكنك الآن الاطلاع على علامتك.`,
              type: 'assessment',
            });
            if (io) io.to(st.user._id.toString()).emit('new_notification', notifStudent);
          }

          // Notify parent user
          if (st.parent) {
            const parentDoc = await Parent.findById(st.parent).populate('user');
            if (parentDoc?.user?._id) {
              const notifParent = await Notification.create({
                recipient: parentDoc.user._id,
                title: `كشف نقاط جديد: ${st.user?.firstName || 'ابنكم'}`,
                content: `تم اعتماد ونشر نتائج ${assessment.assessmentType} لمادة ${assessment.subject} لقسم ${assessment.class?.name}.`,
                type: 'assessment',
              });
              if (io) io.to(parentDoc.user._id.toString()).emit('new_notification', notifParent);
            }
          }
        }
      } catch (notifErr) {
        console.error('[SCHEDULER] Error sending publish notifications:', notifErr.message);
      }
    }
  } catch (err) {
    console.error('[SCHEDULER] Error in autoPublishAssessments:', err);
  }
};

/**
 * Periodically scan for scheduled notices and scheduled assessment publishing
 */
const checkScheduledTasks = async () => {
  try {
    // 1. Process scheduled parent notices
    const now = new Date();
    const pendingNotices = await ParentNotice.find({
      status: 'scheduled',
      scheduledDate: { $lte: now },
    });

    for (const notice of pendingNotices) {
      await deliverParentNotice(notice);
    }

    // 2. Process scheduled assessment publications
    await autoPublishAssessments();
  } catch (err) {
    console.error('[SCHEDULER] Error in checkScheduledTasks:', err.message);
  }
};

const initScheduledTasks = () => {
  console.log('[SCHEDULER] Initialized scheduler for Parent Notices and Assessment Auto-Publishing (30s interval).');
  // Check immediately, then every 30 seconds
  checkScheduledTasks();
  setInterval(checkScheduledTasks, 30 * 1000);
};

module.exports = {
  deliverParentNotice,
  autoPublishAssessments,
  initScheduledTasks,
};
