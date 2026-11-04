const Parent = require('../models/parent.model');
const Student = require('../models/student.model');
const Attendance = require('../models/attendance.model');
const Payment = require('../models/payment.model');
const ExitPass = require('../models/exitPass.model');
const pdfService = require('../services/pdf.service');
const User = require('../models/user.model');

// Get parent's children details
const getChildren = async (req, res, next) => {
  try {
    const parent = await Parent.findOne({ user: req.user.id }).populate({
      path: 'children',
      populate: { path: 'user class group' },
    });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    res.status(200).json(parent.children);
  } catch (error) {
    next(error);
  }
};

// View attendance for a specific child
const getChildAttendance = async (req, res, next) => {
  const { studentId } = req.params;

  try {
    const parent = await Parent.findOne({ user: req.user.id });
    if (!parent.children.includes(studentId)) {
      return res.status(403).json({ message: 'Unauthorized access to this student' });
    }

    const attendanceRecords = await Attendance.find({ student: studentId })
      .populate('recordedBy', 'firstName lastName role')
      .populate('class', 'name')
      .populate('group', 'name')
      .sort({ date: -1 });
    res.status(200).json(attendanceRecords);
  } catch (error) {
    next(error);
  }
};

// View child payments list
const getPayments = async (req, res, next) => {
  try {
    const parent = await Parent.findOne({ user: req.user.id });
    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    const payments = await Payment.find({ parent: parent._id })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'firstName lastName' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
};

// Initiate payment (Mock integration pattern)
const payBill = async (req, res, next) => {
  const { paymentId, paymentMethod } = req.body;

  try {
    const parent = await Parent.findOne({ user: req.user.id }).populate('user');
    const payment = await Payment.findOne({ _id: paymentId, parent: parent._id });

    if (!payment) {
      return res.status(404).json({ message: 'Bill statement not found' });
    }

    // Process Mock Payment
    payment.status = 'Paid';
    payment.paymentMethod = paymentMethod || 'Mock';
    payment.transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(4, 9).toUpperCase()}`;
    payment.paidAt = new Date();

    const student = await Student.findById(payment.student).populate('user');

    // Generate PDF receipt locally
    const pdfBuffer = await pdfService.generateReceiptPDF(payment, parent.user, student.user);

    // Save mock URL (usually uploaded to S3 or Cloudinary)
    payment.receiptUrl = `/api/parents/receipts/${payment._id}`;
    await payment.save();

    res.status(200).json({ message: 'Payment successfully processed!', payment });
  } catch (error) {
    next(error);
  }
};

// Download Invoice Receipt PDF
const downloadReceipt = async (req, res, next) => {
  const { paymentId } = req.params;

  try {
    const payment = await Payment.findById(paymentId)
      .populate({ path: 'parent', populate: { path: 'user' } })
      .populate({ path: 'student', populate: { path: 'user' } });

    if (!payment) {
      return res.status(404).json({ message: 'Payment receipt not found' });
    }

    const pdfBuffer = await pdfService.generateReceiptPDF(payment, payment.parent.user, payment.student.user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt_${payment._id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// View schedules/timetables for a specific child
const getChildSchedules = async (req, res, next) => {
  const { studentId } = req.params;

  try {
    const parent = await Parent.findOne({ user: req.user.id });
    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    if (!parent.children.includes(studentId)) {
      return res.status(403).json({ message: 'Unauthorized access to this student' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const Schedule = require('../models/schedule.model');
    const schedules = await Schedule.find({
      $or: [
        { class: student.class, group: student.group },
        { class: student.class, group: null },
        { class: null, group: null },
      ],
      isActive: true,
    });

    res.status(200).json(schedules);
  } catch (error) {
    next(error);
  }
};

// Download the internal regulations document (القانون الداخلي) published by the administration
const downloadRegulations = async (req, res, next) => {
  try {
    const AdminDocument = require('../models/document.model');
    const path = require('path');
    const fs = require('fs');

    const doc = await AdminDocument.findOne({ type: 'parent_regulations' });
    if (!doc) {
      return res.status(404).json({ message: 'No internal regulations document has been published yet.' });
    }

    const filePath = path.join(__dirname, '../../uploads/documents', doc.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Regulations file is missing.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reglement-interieur.pdf"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    next(error);
  }
};

// Parent submits re-enrollment for one of their linked children (Page 14)
const submitChildReEnrollment = async (req, res, next) => {
  const {
    studentId,
    targetClassId,
    regime = 'نصف داخلي',
    academicYear = '2026-2027',
    notes = '',
    documentsSubmitted = {},
    documentFiles = {},
    documentReferences = {},
  } = req.body;

  try {
    const parent = await Parent.findOne({ user: req.user.id });
    if (!parent) {
      return res.status(404).json({ message: 'حساب ولي الأمر غير موجود.' });
    }

    if (!parent.children.some((c) => String(c) === String(studentId))) {
      return res.status(403).json({ message: 'هذا التلميذ غير مرتبط بحسابك كولي أمر.' });
    }

    const student = await Student.findById(studentId).populate('user').populate('class');
    if (!student) {
      return res.status(404).json({ message: 'التلميذ غير موجود.' });
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

    // Automatic Brother/Sister Discount Check (Top of Page 14)
    let discountType = 'none';
    let discountPercentage = 0;
    let discountAmount = 0;
    let discountReason = '';
    const baseAmount = student.tuitionBaseAmount || 15000;

    if (parent.children.length > 1) {
      discountType = 'fratrie';
      discountPercentage = 15;
      discountAmount = Math.round((baseAmount * 15) / 100);
      discountReason = `تخفيض الإخوة التلقائي (${parent.children.length} أبناء متمدرسين بالمؤسسة)`;
    }
    const finalAmount = Math.max(0, baseAmount - discountAmount);

    const yearPrefix = academicYear.split('-')[0];
    const receiptNumber = `RE-REC-${yearPrefix}-${String(student.registrationNumber || Date.now()).slice(-4)}`;

    const auditEntry = {
      action: 'PARENT_RE_ENROLLMENT_REQUEST',
      modifiedBy: req.user._id,
      modifiedByName: `${req.user.firstName} ${req.user.lastName} (ولي الأمر)`,
      timestamp: new Date(),
      details: isWaitlisted
        ? `طلب إعادة تسجيل للموسم ${academicYear} في قائمة الانتظار (الرتبة ${waitlistRank}) لامتلاء قسم ${targetClass.name}`
        : `تقديم طلب إعادة تسجيل من طرف الولي من ${previousClassName} إلى ${targetClass.name} للموسم ${academicYear} مع تخفيض ${discountPercentage}%`,
    };

    student.enrollmentType = 're-enrollment';
    student.previousClass = previousClass;
    student.previousAcademicYear = previousYear;
    student.academicYear = academicYear;
    student.class = targetClassId;
    student.regime = regime;
    student.tuitionBaseAmount = baseAmount;
    student.discountType = discountType;
    student.discountPercentage = discountPercentage;
    student.discountAmount = discountAmount;
    student.discountReason = discountReason;
    student.tuitionAmount = finalAmount;
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
        ? 'تم تقديم طلب إعادة التسجيل وإدراج التلميذ في قائمة الانتظار لامتلاء القسم.'
        : 'تم تقديم طلب إعادة تسجيل التلميذ بنجاح، وهو قيد المراجعة الإدارية.',
      student: populatedStudent,
      receiptNumber,
      isWaitlisted,
      waitlistRank,
    });
  } catch (error) {
    next(error);
  }
};

// Get re-enrollment info for parent (children + available classes) (Page 14)
const getParentReEnrollmentInfo = async (req, res, next) => {
  try {
    const parent = await Parent.findOne({ user: req.user.id }).populate({
      path: 'children',
      populate: { path: 'user class group previousClass' },
    });

    if (!parent) {
      return res.status(404).json({ message: 'حساب ولي الأمر غير موجود.' });
    }

    const Class = require('../models/class.model');
    const allClasses = await Class.find().sort({ level: 1, name: 1 });

    res.status(200).json({
      children: parent.children,
      allClasses,
      hasFratrieDiscount: parent.children.length > 1,
      fratrieDiscountRate: parent.children.length > 1 ? 15 : 0,
    });
  } catch (error) {
    next(error);
  }
};

// Retrieve only the distinct classes of the parent's registered children
const getParentChildrenClasses = async (req, res, next) => {
  try {
    const parent = await Parent.findOne({ user: req.user.id });
    if (!parent || !parent.children || parent.children.length === 0) {
      return res.status(200).json([]);
    }

    const students = await Student.find({ _id: { $in: parent.children } })
      .populate('class')
      .populate('user', 'firstName lastName');

    const classMap = new Map();
    students.forEach((student) => {
      if (student.class && student.class._id) {
        const cId = student.class._id.toString();
        const childName = student.firstNameArabic || student.user?.firstName || 'الابن';
        if (!classMap.has(cId)) {
          classMap.set(cId, {
            _id: student.class._id,
            name: student.class.name,
            description: student.class.description || '',
            level: student.class.level || '',
            childNames: [childName],
          });
        } else {
          classMap.get(cId).childNames.push(childName);
        }
      }
    });

    res.status(200).json(Array.from(classMap.values()));
  } catch (error) {
    next(error);
  }
};

// Parent requests an Exit Pass (Autorisation de sortie) for a child
const requestExitPass = async (req, res, next) => {
  const { studentId, reason, exitTime, accompaniedBy, date } = req.body;

  try {
    if (!studentId || !reason || !exitTime) {
      return res.status(400).json({ message: 'يرجى تحديد التلميذ، سبب الخروج، وساعة الخروج المطلوبة.' });
    }

    const parent = await Parent.findOne({ user: req.user.id });
    if (!parent) {
      return res.status(404).json({ message: 'ملف ولي الأمر غير موجود.' });
    }

    if (!parent.children.some((c) => String(c) === String(studentId))) {
      return res.status(403).json({ message: 'هذا التلميذ غير مسجل ضمن أبنائك.' });
    }

    const student = await Student.findById(studentId).populate('class');
    if (!student) {
      return res.status(404).json({ message: 'التلميذ غير موجود.' });
    }

    const pass = await ExitPass.create({
      student: studentId,
      class: student.class?._id || student.class,
      reason,
      exitTime,
      accompaniedBy: accompaniedBy || `${req.user?.firstName || 'ولي الأمر'} ${req.user?.lastName || ''}`.trim(),
      status: 'Pending',
      requestedByParent: req.user.id,
      date: date ? new Date(date) : new Date(),
    });

    await pass.populate({
      path: 'student',
      populate: { path: 'user', select: 'firstName lastName phoneNumber' },
    });
    await pass.populate('class', 'name level');

    res.status(201).json({
      message: 'تم إرسال طلب ترخيص الخروج إلى إدارة المدرسة بنجاح. ستتم مراجعته والموافقة عليه.',
      pass,
    });
  } catch (error) {
    next(error);
  }
};

// Get Parent's Exit Passes
const getParentExitPasses = async (req, res, next) => {
  try {
    const parent = await Parent.findOne({ user: req.user.id });
    if (!parent) {
      return res.status(404).json({ message: 'ملف ولي الأمر غير موجود.' });
    }

    const passes = await ExitPass.find({
      $or: [
        { requestedByParent: req.user.id },
        { student: { $in: parent.children } },
      ],
    })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'firstName lastName phoneNumber' },
      })
      .populate('class', 'name level')
      .populate('approvedBy', 'firstName lastName role')
      .populate('verifiedByReceptionist', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json(passes);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChildren,
  getChildAttendance,
  getChildSchedules,
  getPayments,
  payBill,
  downloadReceipt,
  downloadRegulations,
  submitChildReEnrollment,
  getParentReEnrollmentInfo,
  getParentChildrenClasses,
  requestExitPass,
  getParentExitPasses,
};
