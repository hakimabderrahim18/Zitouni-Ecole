const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const Student = require('../models/student.model');
const { getIO } = require('../sockets/socket.manager');

const createAndSendNotification = async (recipientId, title, content, type) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      content,
      type,
    });

    try {
      const io = getIO();
      io.to(recipientId.toString()).emit('new_notification', notification);
    } catch (socketError) {
      // Socket not initialized or user is offline
    }

    return notification;
  } catch (err) {
    console.error('Failed to create or send notification:', err);
  }
};

// Notify for new message
const notifyForMessage = async (message) => {
  try {
    const sender = await User.findById(message.sender);
    const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'Un utilisateur';
    
    await createAndSendNotification(
      message.receiver,
      `Nouveau message de ${senderName}`,
      message.content ? message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '') : 'Fichier joint',
      'message'
    );
  } catch (err) {
    console.error('Failed to notify for message:', err);
  }
};

// Notify for new announcement (post)
const notifyForAnnouncement = async (post) => {
  try {
    const publisher = await User.findById(post.publisher);
    const publisherName = publisher ? `${publisher.firstName} ${publisher.lastName}` : 'L\'administration';

    if (post.isGlobal) {
      // Find all users (excluding publisher)
      const users = await User.find({ _id: { $ne: post.publisher } });
      for (const u of users) {
        await createAndSendNotification(
          u._id,
          `Nouvelle annonce générale`,
          `"${post.title}" par ${publisherName}`,
          'post'
        );
      }
    } else if (post.targetClass) {
      // Find targeted students
      const query = { class: post.targetClass };
      if (post.targetGroup) {
        query.group = post.targetGroup;
      }
      
      const students = await Student.find(query).populate('parent');
      for (const student of students) {
        // Notify student
        await createAndSendNotification(
          student.user,
          `Nouvelle annonce pour votre classe`,
          `"${post.title}" par ${publisherName}`,
          'post'
        );
        // Notify parent
        if (student.parent && student.parent.user) {
          await createAndSendNotification(
            student.parent.user,
            `Nouvelle annonce concernant votre enfant`,
            `"${post.title}" par ${publisherName}`,
            'post'
          );
        }
      }
    }
  } catch (err) {
    console.error('Failed to notify for announcement:', err);
  }
};

// Notify for new course upload
const notifyForCourse = async (course) => {
  try {
    const query = { class: course.class };
    if (course.group) {
      query.group = course.group;
    }

    const students = await Student.find(query).populate('parent');
    for (const student of students) {
      // Notify student
      await createAndSendNotification(
        student.user,
        `Nouveau support de cours disponible`,
        `Le cours de "${course.subject}" : "${course.title}" a été ajouté.`,
        'course'
      );
      // Notify parent
      if (student.parent && student.parent.user) {
        await createAndSendNotification(
          student.parent.user,
          `Nouveau support de cours disponible (Enfant)`,
          `Le cours de "${course.subject}" : "${course.title}" a été ajouté pour la classe de votre enfant.`,
          'course'
        );
      }
    }
  } catch (err) {
    console.error('Failed to notify for course:', err);
  }
};

// Notify for schedule changes (timetable, exam, etc.)
const notifyForSchedule = async (schedule) => {
  try {
    // If it's a global food menu or bus route
    if (!schedule.class) {
      const users = await User.find({ role: { $in: ['student', 'parent'] } });
      for (const u of users) {
        await createAndSendNotification(
          u._id,
          `Mise à jour du planning général`,
          `Le planning "${schedule.title}" (${schedule.type}) a été modifié.`,
          'schedule'
        );
      }
      return;
    }

    const query = { class: schedule.class };
    if (schedule.group) {
      query.group = schedule.group;
    }

    const students = await Student.find(query).populate('parent');
    for (const student of students) {
      // Notify student
      await createAndSendNotification(
        student.user,
        `Mise à jour de l'emploi du temps / planning`,
        `Le planning "${schedule.title}" (${schedule.type}) a été mis à jour.`,
        'schedule'
      );
      // Notify parent
      if (student.parent && student.parent.user) {
        await createAndSendNotification(
          student.parent.user,
          `Mise à jour de l'emploi du temps de votre enfant`,
          `Le planning "${schedule.title}" (${schedule.type}) de votre enfant a été mis à jour.`,
          'schedule'
        );
      }
    }
  } catch (err) {
    console.error('Failed to notify for schedule:', err);
  }
};

// Notify for student absence or tardiness (Articles 25, 26)
const notifyForAbsenceOrLate = async (attendanceRecord, studentDoc, parentUserId) => {
  try {
    if (!parentUserId) return;
    const studentName = studentDoc.firstNameArabic && studentDoc.lastNameArabic
      ? `${studentDoc.firstNameArabic} ${studentDoc.lastNameArabic}`
      : `${studentDoc.user?.firstName || ''} ${studentDoc.user?.lastName || ''}`.trim() || 'التلميذ';

    const dateFormatted = new Date(attendanceRecord.date).toLocaleDateString('fr-FR');
    let title = 'إشعار حضور وغياب';
    let content = '';

    if (attendanceRecord.status === 'Absent' || attendanceRecord.status === 'Unexcused') {
      title = 'إشعار غياب / Notification d\'absence';
      content = `نحيطكم علماً بأنه تم تسجيل غياب ابنكم/ابنتكم (${studentName}) بتاريخ ${dateFormatted} (الحصة: ${attendanceRecord.session}). يرجى تقديم التبرير في أقرب وقت.`;
    } else if (attendanceRecord.status === 'Late') {
      title = 'إشعار تأخر / Notification de retard';
      content = `تم تسجيل تأخر ابنكم/ابنتكم (${studentName}) بتاريخ ${dateFormatted} بـ ${attendanceRecord.lateMinutes || 15} دقيقة.`;
    } else if (attendanceRecord.status === 'ExitPass') {
      title = 'إذن خروج مرخص / Autorisation de sortie';
      content = `تم إصدار إذن خروج مرخص لابنكم/ابنتكم (${studentName}) بتاريخ ${dateFormatted}.`;
    } else {
      return;
    }

    await createAndSendNotification(parentUserId, title, content, 'attendance');
  } catch (err) {
    console.error('Failed to notify parent for attendance:', err);
  }
};

// Notify for 3-Absence Warning (Article 26 - Page 18: استدعاء وإنذار)
const notifyForAbsenceWarning = async (warningRecord, studentDoc, parentUserId) => {
  try {
    if (!parentUserId) return;
    const studentName = studentDoc.firstNameArabic && studentDoc.lastNameArabic
      ? `${studentDoc.firstNameArabic} ${studentDoc.lastNameArabic}`
      : `${studentDoc.user?.firstName || ''} ${studentDoc.user?.lastName || ''}`.trim() || 'التلميذ';

    const title = '⚠️ إنذار واستدعاء ولي الأمر (تجاوز 3 غيابات)';
    const content = `نلفت انتباهكم إلى أن التلميذ (${studentName}) قد استنفد 3 غيابات غير مبررة. يرجى الحضور إلى إدارة مؤسسة حبر وألوان لتسوية الوضعية وتفادي الإجراءات التأديبية.`;

    await createAndSendNotification(parentUserId, title, content, 'warning');
  } catch (err) {
    console.error('Failed to notify for absence warning:', err);
  }
};

module.exports = {
  createAndSendNotification,
  notifyForMessage,
  notifyForAnnouncement,
  notifyForCourse,
  notifyForSchedule,
  notifyForAbsenceOrLate,
  notifyForAbsenceWarning,
};
