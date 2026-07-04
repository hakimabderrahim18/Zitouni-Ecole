const Parent = require('../models/parent.model');
const Student = require('../models/student.model');
const Attendance = require('../models/attendance.model');
const Payment = require('../models/payment.model');
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

    const attendanceRecords = await Attendance.find({ student: studentId }).sort({ date: -1 });
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

module.exports = {
  getChildren,
  getChildAttendance,
  getChildSchedules,
  getPayments,
  payBill,
  downloadReceipt,
  downloadRegulations,
};
