const AdministrativeRequest = require('../models/administrativeRequest.model');
const Student = require('../models/student.model');
const { createNotification } = require('../services/notification.service');
const fs = require('fs');
const path = require('path');

// Create new administrative request (Parent, Teacher, Student)
const createRequest = async (req, res, next) => {
  const { type, subject, description, studentId, preferredDate } = req.body;
  const user = req.user;

  try {
    if (!type || !subject || !description) {
      return res.status(400).json({ message: 'Le type, l\'objet et la description sont obligatoires.' });
    }

    let linkedStudent = null;
    let studentName = '';
    if (studentId) {
      linkedStudent = await Student.findById(studentId);
      if (linkedStudent) {
        studentName = `${linkedStudent.firstNameArabic || linkedStudent.firstName} ${linkedStudent.lastNameArabic || linkedStudent.lastName}`;
      }
    }

    const year = new Date().getFullYear();
    const count = await AdministrativeRequest.countDocuments();
    const trackingNumber = `REQ-${year}-${String(count + 1).padStart(4, '0')}`;

    const requestDoc = await AdministrativeRequest.create({
      trackingNumber,
      applicant: user.id,
      applicantName: `${user.firstName} ${user.lastName}`,
      applicantRole: user.role,
      student: studentId || undefined,
      studentName,
      type,
      subject,
      description,
      preferredDate: preferredDate ? new Date(preferredDate) : undefined,
      status: 'Nouveau',
    });

    res.status(201).json({
      success: true,
      message: 'Demande administrative enregistrée avec succès',
      request: requestDoc,
    });
  } catch (error) {
    next(error);
  }
};

// Get requests (All for admin, Own for parent/teacher/student)
const getRequests = async (req, res, next) => {
  const user = req.user;
  const { status, type } = req.query;

  try {
    const filter = {};
    if (!['admin', 'school'].includes(user.role)) {
      filter.applicant = user.id;
    }

    if (status) filter.status = status;
    if (type) filter.type = type;

    const requests = await AdministrativeRequest.find(filter)
      .populate('applicant', 'firstName lastName role phoneNumber')
      .populate('student', 'firstName lastName registrationNumber')
      .populate('respondedBy', 'firstName lastName role')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
};

// Get request by tracking number (e.g. REQ-2026-0001)
const getRequestByTrackingNumber = async (req, res, next) => {
  const { trackingNumber } = req.params;

  try {
    const requestDoc = await AdministrativeRequest.findOne({ trackingNumber })
      .populate('applicant', 'firstName lastName role')
      .populate('student', 'firstName lastName registrationNumber')
      .populate('respondedBy', 'firstName lastName');

    if (!requestDoc) {
      return res.status(404).json({ message: 'Numéro de suivi introuvable' });
    }

    res.status(200).json(requestDoc);
  } catch (error) {
    next(error);
  }
};

// Update request status & reply (Admin / School)
const updateRequestStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status, responseMessage, responseAttachmentUrl } = req.body;
  const user = req.user;

  try {
    const requestDoc = await AdministrativeRequest.findById(id);
    if (!requestDoc) {
      return res.status(404).json({ message: 'Demande introuvable' });
    }

    if (status) requestDoc.status = status;
    if (responseMessage !== undefined) requestDoc.responseMessage = responseMessage;
    if (responseAttachmentUrl !== undefined) requestDoc.responseAttachmentUrl = responseAttachmentUrl;

    requestDoc.respondedBy = user.id;
    requestDoc.respondedAt = new Date();
    await requestDoc.save();

    // Notify the applicant
    try {
      createNotification(
        requestDoc.applicant,
        'message',
        `تحديث بخصوص طلبك الإداري رقم ${requestDoc.trackingNumber}: ${status}`,
        requestDoc._id
      );
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: 'Demande mise à jour avec succès',
      request: requestDoc,
    });
  } catch (error) {
    next(error);
  }
};

// Upload attachment for response
const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
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
  createRequest,
  getRequests,
  getRequestByTrackingNumber,
  updateRequestStatus,
  uploadAttachment,
};
