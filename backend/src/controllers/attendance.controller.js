const Attendance = require('../models/attendance.model');
const AbsenceWarning = require('../models/absenceWarning.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const Class = require('../models/class.model');
const ExitPass = require('../models/exitPass.model');
const { notifyForAbsenceOrLate, notifyForAbsenceWarning } = require('../services/notification.service');

// 1. Mark attendance for a class (Batch or single)
const markAttendance = async (req, res, next) => {
  try {
    const { classId, groupId, date, session, records } = req.body;

    if (!classId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'classId, date et records (tableau) sont requis.' });
    }

    if (req.user && req.user.role === 'teacher') {
      const Teacher = require('../models/teacher.model');
      const teacher = await Teacher.findOne({ user: req.user.id });
      const isAssigned = (teacher?.classes || []).some(
        (c) => (c._id ? c._id.toString() : c.toString()) === classId.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({ message: 'Accès refusé: vous n\'êtes pas assigné à cette classe.' });
      }
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(12, 0, 0, 0); // Normalize date to midday

    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const currentSession = session || 'Daily';
    const savedRecords = [];
    const triggeredWarnings = [];

    for (const item of records) {
      const { studentId, status, lateMinutes, remarks } = item;

      // Status translation support (FR/EN/AR)
      let normalizedStatus = 'Present';
      if (['Present', 'حاضر'].includes(status)) normalizedStatus = 'Present';
      else if (['Absent', 'غائب'].includes(status)) normalizedStatus = 'Absent';
      else if (['Late', 'متأخر'].includes(status)) normalizedStatus = 'Late';
      else if (['Excused', 'غياب مبرر', 'مبرر'].includes(status)) normalizedStatus = 'Excused';
      else if (['Unexcused', 'غياب غير مبرر', 'غير مبرر'].includes(status)) normalizedStatus = 'Unexcused';
      else if (['ExitPass', 'خروج مرخص', 'إذن بالخروج'].includes(status)) normalizedStatus = 'ExitPass';

      let existingRecord = await Attendance.findOne({
        student: studentId,
        date: { $gte: startOfDay, $lte: endOfDay },
        session: currentSession,
      });

      let record;
      if (existingRecord) {
        existingRecord.status = normalizedStatus;
        existingRecord.lateMinutes = normalizedStatus === 'Late' ? (Number(lateMinutes) || 15) : 0;
        if (remarks !== undefined) existingRecord.remarks = remarks;
        existingRecord.recordedBy = req.user.id;
        record = await existingRecord.save();
      } else {
        try {
          record = await Attendance.create({
            student: studentId,
            class: classId,
            group: groupId || null,
            date: attendanceDate,
            session: currentSession,
            status: normalizedStatus,
            lateMinutes: normalizedStatus === 'Late' ? (Number(lateMinutes) || 15) : 0,
            remarks: remarks || '',
            recordedBy: req.user.id,
          });
        } catch (createErr) {
          if (createErr.code === 11000) {
            record = await Attendance.findOne({
              student: studentId,
              date: { $gte: startOfDay, $lte: endOfDay },
              session: currentSession,
            });
            if (record) {
              record.status = normalizedStatus;
              record.lateMinutes = normalizedStatus === 'Late' ? (Number(lateMinutes) || 15) : 0;
              if (remarks !== undefined) record.remarks = remarks;
              record.recordedBy = req.user.id;
              await record.save();
            } else {
              throw createErr;
            }
          } else {
            throw createErr;
          }
        }
      }

      savedRecords.push(record);

      // Fetch student with parent information
      const studentDoc = await Student.findById(studentId).populate('user').populate('parent');
      const parentUserId = studentDoc?.parent?.user;

      // Automatic digital Exit Pass issuance (Article 28: تصاريح خروج تلقائية)
      if (normalizedStatus === 'ExitPass') {
        let exitPass = null;
        if (record.exitPassRef) {
          exitPass = await ExitPass.findById(record.exitPassRef);
        }
        if (!exitPass) {
          exitPass = await ExitPass.create({
            student: studentId,
            class: classId || studentDoc?.class,
            reason: remarks || 'تصريح خروج مرخص ومسجل آلياً عبر ورقة الحضور',
            exitTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            accompaniedBy: studentDoc?.parent?.fatherNameArabic || studentDoc?.parent?.phoneNumber || 'ولي الأمر / مرخص له',
            issuedBy: req.user.id,
            status: 'Approved',
            date: attendanceDate,
          });
          record.exitPassRef = exitPass._id;
          await record.save();
        }
      }

      // Send immediate parent notification for absence, tardiness, or exit pass (Article 26)
      if (['Absent', 'Unexcused', 'Late', 'ExitPass'].includes(normalizedStatus) && parentUserId) {
        await notifyForAbsenceOrLate(record, studentDoc, parentUserId);
        record.notificationSent = true;
        record.notificationChannel = record.notificationChannel === 'WhatsApp' ? 'Both' : 'App';
        record.notificationStatus = 'Sent';
        await record.save();
      }

      // Check 3-Absence Threshold (Article 26 / Page 18: بعد ثلاث غيابات إشعار مناسب إنذار بالحضور للمؤسسة)
      if (['Absent', 'Unexcused'].includes(normalizedStatus)) {
        const unexcusedCount = await Attendance.countDocuments({
          student: studentId,
          status: { $in: ['Absent', 'Unexcused'] },
        });

        // Determine if warning level should be triggered (multiples of 3: 3, 6, 9...)
        if (unexcusedCount >= 3 && unexcusedCount % 3 === 0) {
          const warningLevel = Math.floor(unexcusedCount / 3);
          
          // Check if warning for this level was already issued
          const existingWarning = await AbsenceWarning.findOne({
            student: studentId,
            warningLevel,
            status: { $ne: 'Dismissed' },
          });

          if (!existingWarning) {
            // Find past 3 unexcused absence dates
            const pastAbsences = await Attendance.find({
              student: studentId,
              status: { $in: ['Absent', 'Unexcused'] },
            })
              .sort({ date: -1 })
              .limit(3);

            const absenceDates = pastAbsences.map(a => a.date);

            const newWarning = await AbsenceWarning.create({
              student: studentId,
              parent: studentDoc?.parent?._id || null,
              class: classId,
              warningLevel,
              absenceCount: unexcusedCount,
              absenceDates,
              issuedBy: req.user.id,
            });

            triggeredWarnings.push(newWarning);

            // Notify parent about formal warning / convocation
            if (parentUserId) {
              await notifyForAbsenceWarning(newWarning, studentDoc, parentUserId);
            }

            // Flag on current attendance record
            record.warningThresholdTriggered = true;
            await record.save();
          }
        }
      }
    }

    res.status(200).json({
      message: `Enregistrement effectué pour ${savedRecords.length} élève(s).`,
      savedCount: savedRecords.length,
      triggeredWarningsCount: triggeredWarnings.length,
      warnings: triggeredWarnings,
      records: savedRecords,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get attendance for a class on a date
const getClassAttendance = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { date, session } = req.query;

    if (req.user && req.user.role === 'teacher') {
      const Teacher = require('../models/teacher.model');
      const teacher = await Teacher.findOne({ user: req.user.id });
      const isAssigned = (teacher?.classes || []).some(
        (c) => (c._id ? c._id.toString() : c.toString()) === classId.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({ message: 'Accès refusé: vous n\'êtes pas assigné à cette classe.' });
      }
    }

    const query = { class: classId };

    if (date) {
      const attendanceDate = new Date(date);
      const startOfDay = new Date(attendanceDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(attendanceDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (session) {
      query.session = session;
    }

    const records = await Attendance.find(query)
      .populate({
        path: 'student',
        populate: [
          { path: 'user', select: 'firstName lastName email phoneNumber profilePic' },
          { path: 'parent', select: 'fatherNameArabic motherNameArabic phoneNumber' },
        ],
      })
      .populate('recordedBy', 'firstName lastName role')
      .populate('justifiedBy', 'firstName lastName role')
      .populate('exitPassRef')
      .sort({ createdAt: -1 });

    // Also get active warnings for students in this class
    const studentIds = records.map(r => r.student?._id).filter(Boolean);
    const activeWarnings = await AbsenceWarning.find({
      student: { $in: studentIds },
      status: { $in: ['Pending', 'Delivered'] },
    });

    const warningsMap = {};
    activeWarnings.forEach(w => {
      warningsMap[w.student.toString()] = w;
    });

    const enrichedRecords = records.map(r => {
      const doc = r.toObject();
      doc.activeWarning = r.student ? warningsMap[r.student._id.toString()] || null : null;
      return doc;
    });

    res.status(200).json(enrichedRecords);
  } catch (error) {
    next(error);
  }
};

// 3. Get full student attendance history
const getStudentAttendanceHistory = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const records = await Attendance.find({ student: studentId })
      .populate('class', 'name level')
      .populate('recordedBy', 'firstName lastName role')
      .sort({ date: -1 });

    const totalSessions = records.length;
    const presentCount = records.filter(r => r.status === 'Present').length;
    const absentCount = records.filter(r => r.status === 'Absent' || r.status === 'Unexcused').length;
    const lateCount = records.filter(r => r.status === 'Late').length;
    const excusedCount = records.filter(r => r.status === 'Excused').length;
    const exitPassCount = records.filter(r => r.status === 'ExitPass').length;

    const warnings = await AbsenceWarning.find({ student: studentId })
      .populate('issuedBy', 'firstName lastName')
      .sort({ issueDate: -1 });

    res.status(200).json({
      summary: {
        totalSessions,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        exitPassCount,
        warningCount: warnings.length,
      },
      warnings,
      records,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Submit justification for an absence (Parent, Student or Supervisor)
const submitJustification = async (req, res, next) => {
  try {
    const { attendanceId } = req.params;
    const { justificationReason, justificationAttachmentUrl } = req.body;

    const record = await Attendance.findById(attendanceId);
    if (!record) {
      return res.status(404).json({ message: 'Enregistrement d\'absence introuvable.' });
    }

    record.justificationReason = justificationReason || record.justificationReason;
    if (justificationAttachmentUrl) {
      record.justificationAttachmentUrl = justificationAttachmentUrl;
    }
    record.justificationStatus = 'Pending';
    await record.save();

    res.status(200).json({
      message: 'Titre de justification soumis avec succès. En attente de validation par l\'administration.',
      record,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Review justification (Accept or Reject by Supervisor or Admin)
const reviewJustification = async (req, res, next) => {
  try {
    const { attendanceId } = req.params;
    const { decision, remarks } = req.body; // decision: 'Approved' | 'Rejected'

    if (!['Approved', 'Rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Décision invalide. Valeurs acceptées: Approved ou Rejected.' });
    }

    const record = await Attendance.findById(attendanceId);
    if (!record) {
      return res.status(404).json({ message: 'Enregistrement d\'absence introuvable.' });
    }

    record.justificationStatus = decision;
    record.justifiedAt = new Date();
    record.justifiedBy = req.user.id;
    if (remarks) record.remarks = remarks;

    if (decision === 'Approved') {
      record.status = 'Excused';
    } else {
      record.status = 'Unexcused';
    }

    await record.save();

    res.status(200).json({
      message: decision === 'Approved' ? 'Justification acceptée avec succès.' : 'Justification rejetée.',
      record,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Get all absence warnings across the school
const getAbsenceWarnings = async (req, res, next) => {
  try {
    const { status, classId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (classId) query.class = classId;

    const warnings = await AbsenceWarning.find(query)
      .populate({
        path: 'student',
        populate: [
          { path: 'user', select: 'firstName lastName email phoneNumber profilePic' },
          { path: 'parent', select: 'fatherNameArabic motherNameArabic phoneNumber' },
        ],
      })
      .populate('class', 'name level')
      .populate('issuedBy', 'firstName lastName role')
      .sort({ issueDate: -1 });

    res.status(200).json(warnings);
  } catch (error) {
    next(error);
  }
};

// 7. Resolve / Close an Absence Warning (after parent visits)
const resolveAbsenceWarning = async (req, res, next) => {
  try {
    const { warningId } = req.params;
    const { resolutionNotes, status } = req.body;

    const warning = await AbsenceWarning.findById(warningId);
    if (!warning) {
      return res.status(404).json({ message: 'Avertissement introuvable.' });
    }

    warning.status = status || 'Resolved';
    warning.resolutionNotes = resolutionNotes || warning.resolutionNotes;
    warning.resolvedAt = new Date();
    await warning.save();

    res.status(200).json({
      message: 'Avertissement résolu et archivé avec succès.',
      warning,
    });
  } catch (error) {
    next(error);
  }
};

// 8. Today's global statistics (for Dashboards)
const getAttendanceTodayStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const records = await Attendance.find({ date: today });
    const totalMarked = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent' || r.status === 'Unexcused').length;
    const late = records.filter(r => r.status === 'Late').length;
    const excused = records.filter(r => r.status === 'Excused').length;
    const exitPass = records.filter(r => r.status === 'ExitPass').length;

    const pendingWarnings = await AbsenceWarning.countDocuments({ status: 'Pending' });
    const pendingJustifications = await Attendance.countDocuments({ justificationStatus: 'Pending' });

    res.status(200).json({
      date: today,
      totalMarked,
      present,
      absent,
      late,
      excused,
      exitPass,
      pendingWarnings,
      pendingJustifications,
    });
  } catch (error) {
    next(error);
  }
};

// 9. Log WhatsApp notification delivery (Article 26)
const logWhatsAppNotification = async (req, res, next) => {
  try {
    const { attendanceId } = req.params;
    const record = await Attendance.findById(attendanceId);
    if (!record) {
      return res.status(404).json({ message: 'Enregistrement introuvable' });
    }

    record.whatsappSentAt = new Date();
    record.notificationSent = true;
    record.notificationChannel = record.notificationChannel === 'App' ? 'Both' : 'WhatsApp';
    record.notificationStatus = 'Sent';
    await record.save();

    res.status(200).json({ message: 'Envoi WhatsApp enregistré avec succès', record });
  } catch (error) {
    next(error);
  }
};

// 10. Log Warning WhatsApp notification (Article 26)
const logWarningWhatsApp = async (req, res, next) => {
  try {
    const { warningId } = req.params;
    const warning = await AbsenceWarning.findById(warningId);
    if (!warning) {
      return res.status(404).json({ message: 'Avertissement introuvable' });
    }

    warning.whatsappSentAt = new Date();
    warning.whatsappStatus = 'Sent';
    await warning.save();

    res.status(200).json({ message: 'Envoi WhatsApp de l\'avertissement enregistré avec succès', warning });
  } catch (error) {
    next(error);
  }
};

// 11. Generate Weekly or Monthly Attendance & Absence Report (Article 26)
const exportAttendanceReport = async (req, res, next) => {
  try {
    const { classId, periodType, startDate, endDate } = req.query;

    const query = {};
    if (classId && classId !== 'all') {
      query.class = classId;
    }

    let start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    query.date = { $gte: start, $lte: end };

    const records = await Attendance.find(query)
      .populate({
        path: 'student',
        populate: [
          { path: 'user', select: 'firstName lastName email phoneNumber' },
          { path: 'parent', select: 'fatherNameArabic motherNameArabic phoneNumber' },
        ],
      })
      .populate('class', 'name level')
      .populate('recordedBy', 'firstName lastName role')
      .sort({ date: -1 });

    // Aggregate by student
    const studentMap = {};
    records.forEach(r => {
      const sId = r.student?._id?.toString() || 'unknown';
      if (!studentMap[sId]) {
        const u = r.student?.user || {};
        const p = r.student?.parent || {};
        studentMap[sId] = {
          studentId: sId,
          name: r.student?.firstNameArabic && r.student?.lastNameArabic
            ? `${r.student.firstNameArabic} ${r.student.lastNameArabic}`
            : `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'تلميذ',
          nationalId: r.student?.nationalIdDigitization || r.student?.registrationNumber || '—',
          className: r.class?.name || '—',
          parentPhone: p.phoneNumber || u.phoneNumber || '—',
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          unexcused: 0,
          exitPass: 0,
          total: 0,
        };
      }

      studentMap[sId].total += 1;
      if (r.status === 'Present') studentMap[sId].present += 1;
      else if (r.status === 'Absent') studentMap[sId].absent += 1;
      else if (r.status === 'Late') studentMap[sId].late += 1;
      else if (r.status === 'Excused') studentMap[sId].excused += 1;
      else if (r.status === 'Unexcused') studentMap[sId].unexcused += 1;
      else if (r.status === 'ExitPass') studentMap[sId].exitPass += 1;
    });

    const studentsSummary = Object.values(studentMap);

    res.status(200).json({
      periodType: periodType || 'custom',
      startDate: start,
      endDate: end,
      totalRecords: records.length,
      studentsCount: studentsSummary.length,
      studentsSummary,
      records,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getClassAttendance,
  getStudentAttendanceHistory,
  submitJustification,
  reviewJustification,
  getAbsenceWarnings,
  resolveAbsenceWarning,
  getAttendanceTodayStats,
  logWhatsAppNotification,
  logWarningWhatsApp,
  exportAttendanceReport,
};
