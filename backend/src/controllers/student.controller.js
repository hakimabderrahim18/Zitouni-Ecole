const Course = require('../models/course.model');
const Announcement = require('../models/announcement.model');
const Student = require('../models/student.model');
const Schedule = require('../models/schedule.model');

// Retrieve courses relevant to student
const getCourses = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const courses = await Course.find({
      class: student.class,
      $or: [{ group: student.group }, { group: null }],
    }).populate({
      path: 'teacher',
      populate: { path: 'user', select: 'firstName lastName profilePic' },
    });

    res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
};

// Retrieve student announcements feed
const getAnnouncements = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const announcements = await Announcement.find({
      $or: [
        { isGlobal: true },
        { targetClass: student.class, targetGroup: student.group },
        { targetClass: student.class, targetGroup: null },
      ],
    }).populate('publisher', 'firstName lastName profilePic');

    res.status(200).json(announcements);
  } catch (error) {
    next(error);
  }
};

// Get Schedules (class timetable, exam, transport, food menus)
const getSchedules = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const schedules = await Schedule.find({
      $or: [
        { class: student.class, group: student.group },
        { class: student.class, group: null },
        { class: null, group: null }, // global schedules (e.g. food programs)
      ],
      isActive: true,
    });

    res.status(200).json(schedules);
  } catch (error) {
    next(error);
  }
};

// Get student attendance history
const getAttendance = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const Attendance = require('../models/attendance.model');
    const attendance = await Attendance.find({ student: student._id })
      .populate('recordedBy', 'firstName lastName role')
      .populate('class', 'name')
      .populate('group', 'name')
      .sort({ date: -1 });

    res.status(200).json(attendance);
  } catch (error) {
    next(error);
  }
};

// Get student's current enrollment profile and re-enrollment status (Page 14)
const getStudentEnrollmentInfo = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id })
      .populate('user')
      .populate('class')
      .populate('previousClass')
      .populate('group')
      .populate({
        path: 'parent',
        populate: { path: 'user' },
      });

    if (!student) {
      return res.status(404).json({ message: 'الملف المدرسي للتلميذ غير موجود.' });
    }

    const Class = require('../models/class.model');
    const allClasses = await Class.find().sort({ level: 1, name: 1 });

    res.status(200).json({
      student,
      allClasses,
    });
  } catch (error) {
    next(error);
  }
};

// Student self-submits a re-enrollment request for next year / grade (Page 14)
const submitStudentReEnrollment = async (req, res, next) => {
  const {
    targetClassId,
    regime = 'نصف داخلي',
    academicYear = '2026-2027',
    notes = '',
    documentsSubmitted = {},
    documentFiles = {},
    documentReferences = {},
  } = req.body;

  try {
    const student = await Student.findOne({ user: req.user.id })
      .populate('user')
      .populate('class');

    if (!student) {
      return res.status(404).json({ message: 'الملف المدرسي للتلميذ غير موجود.' });
    }

    const Class = require('../models/class.model');
    const targetClass = await Class.findById(targetClassId);
    if (!targetClass) {
      return res.status(400).json({ message: 'القسم المراد إعادة التسجيل فيه غير صالح.' });
    }

    const previousClass = student.class?._id || student.class;
    const previousClassName = student.class?.name || 'القسم السابق';
    const previousYear = student.academicYear || '2025-2026';

    // Capacity & Waitlist check (Page 15)
    const existingInClass = await Student.countDocuments({
      _id: { $ne: student._id },
      class: targetClassId,
      isWaitlisted: { $ne: true },
    });
    const classCapacity = targetClass.capacity || 30;
    const isWaitlisted = existingInClass >= classCapacity;
    let waitlistRank = 0;
    if (isWaitlisted) {
      const waitlistCount = await Student.countDocuments({
        class: targetClassId,
        isWaitlisted: true,
      });
      waitlistRank = waitlistCount + 1;
    }

    const yearPrefix = academicYear.split('-')[0];
    const receiptNumber = `RE-REC-${yearPrefix}-${String(student.registrationNumber || Date.now()).slice(-4)}`;

    const auditEntry = {
      action: 'RE_ENROLLMENT_REQUEST',
      modifiedBy: req.user._id,
      modifiedByName: `${req.user.firstName} ${req.user.lastName} (التلميذ نفسه)`,
      timestamp: new Date(),
      details: isWaitlisted
        ? `طلب إعادة تسجيل للموسم ${academicYear} في قائمة الانتظار (الرتبة ${waitlistRank}) لامتلاء قسم ${targetClass.name}`
        : `تقديم طلب إعادة تسجيل إلكتروني من ${previousClassName} إلى ${targetClass.name} للموسم ${academicYear}`,
    };

    student.enrollmentType = 're-enrollment';
    student.previousClass = previousClass;
    student.previousAcademicYear = previousYear;
    student.academicYear = academicYear;
    student.class = targetClassId;
    student.regime = regime;
    student.receiptNumber = receiptNumber;
    student.registrationDate = new Date();
    student.isWaitlisted = isWaitlisted;
    student.waitlistRank = waitlistRank;
    student.registrationStatus = isWaitlisted ? 'waitlist' : 'under_review';
    student.documentsSubmitted = {
      birthCertificate: !!documentsSubmitted.birthCertificate || !!documentFiles.birthCertificate,
      photos: !!documentsSubmitted.photos || !!documentFiles.photos,
      medicalCertificate: !!documentsSubmitted.medicalCertificate || !!documentFiles.medicalCertificate,
      vaccinationRecord: !!documentsSubmitted.vaccinationRecord || !!documentFiles.vaccinationRecord,
      schoolCertificate: !!documentsSubmitted.schoolCertificate || !!documentFiles.schoolCertificate,
      signedCharter: !!documentsSubmitted.signedCharter || !!documentFiles.signedCharter,
    };
    student.documentFiles = {
      birthCertificate: documentFiles.birthCertificate || student.documentFiles?.birthCertificate || '',
      photos: documentFiles.photos || student.documentFiles?.photos || '',
      medicalCertificate: documentFiles.medicalCertificate || student.documentFiles?.medicalCertificate || '',
      vaccinationRecord: documentFiles.vaccinationRecord || student.documentFiles?.vaccinationRecord || '',
      schoolCertificate: documentFiles.schoolCertificate || student.documentFiles?.schoolCertificate || '',
      signedCharter: documentFiles.signedCharter || student.documentFiles?.signedCharter || '',
    };
    student.documentReferences = {
      birthCertificate: documentReferences.birthCertificate || student.documentReferences?.birthCertificate || '',
      photos: documentReferences.photos || student.documentReferences?.photos || '',
      medicalCertificate: documentReferences.medicalCertificate || student.documentReferences?.medicalCertificate || '',
      vaccinationRecord: documentReferences.vaccinationRecord || student.documentReferences?.vaccinationRecord || '',
      schoolCertificate: documentReferences.schoolCertificate || student.documentReferences?.schoolCertificate || '',
      signedCharter: documentReferences.signedCharter || student.documentReferences?.signedCharter || '',
    };
    if (notes) student.notes = notes;

    student.auditHistory.push(auditEntry);
    await student.save();

    const populatedStudent = await Student.findById(student._id)
      .populate('user')
      .populate('class')
      .populate('previousClass')
      .populate('group')
      .populate({
        path: 'parent',
        populate: { path: 'user' },
      });

    res.status(200).json({
      message: isWaitlisted
        ? 'تم تقديم طلب إعادة التسجيل وإدراجك في قائمة الانتظار لامتلاء القسم.'
        : 'تم تقديم طلب إعادة التسجيل بنجاح، وهو قيد المراجعة الإدارية.',
      student: populatedStudent,
      receiptNumber,
      isWaitlisted,
      waitlistRank,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourses,
  getAnnouncements,
  getSchedules,
  getAttendance,
  getStudentEnrollmentInfo,
  submitStudentReEnrollment,
};
