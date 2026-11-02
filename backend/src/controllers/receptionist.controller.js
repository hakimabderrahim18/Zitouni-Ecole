const VisitorLog = require('../models/visitorLog.model');
const ExitPass = require('../models/exitPass.model');
const Receptionist = require('../models/receptionist.model');

// Get Receptionist Dashboard Data
const getReceptionistDashboardStats = async (req, res, next) => {
  try {
    const receptionist = await Receptionist.findOne({ user: req.user.id });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const visitorsToday = await VisitorLog.find({
      date: { $gte: todayStart, $lte: todayEnd },
    }).sort({ checkInTime: -1 });

    const exitPassesToday = await ExitPass.find({
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['Approved', 'Used'] },
    })
      .populate({
        path: 'student',
        populate: [
          { path: 'user', select: 'firstName lastName profilePic phoneNumber username' },
          { path: 'parent', populate: { path: 'user', select: 'firstName lastName phoneNumber' } },
        ],
      })
      .populate('class', 'name level')
      .populate('issuedBy', 'firstName lastName role')
      .populate('approvedBy', 'firstName lastName role')
      .populate('requestedByParent', 'firstName lastName phoneNumber')
      .populate('verifiedByReceptionist', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      receptionist,
      visitorsToday,
      exitPassesToday,
    });
  } catch (error) {
    next(error);
  }
};

// Check-in a visitor
const recordVisitorCheckIn = async (req, res, next) => {
  const { visitorName, visitorPhone, visitorIdCard, visitType, purpose, personToVisit } = req.body;

  try {
    if (!visitorName || !visitorPhone || !purpose) {
      return res.status(400).json({ message: 'يرجى إدخال اسم الزائر، رقم الهاتف، وسبب الزيارة.' });
    }

    const visitorLog = await VisitorLog.create({
      visitorName: String(visitorName).trim(),
      visitorPhone: String(visitorPhone).trim(),
      visitorIdCard: visitorIdCard ? String(visitorIdCard).trim() : '',
      visitType: visitType || 'Parent / ولي أمر',
      purpose: String(purpose).trim(),
      personToVisit: personToVisit ? String(personToVisit).trim() : 'الإدارة العامة',
      checkInTime: new Date(),
      status: 'In School',
      recordedBy: req.user.id,
    });

    res.status(201).json({ message: 'تم تسجيل دخول الزائر بنجاح وتوثيق الزيارة في السجل اليومي.', visitorLog });
  } catch (error) {
    next(error);
  }
};

// Check-out a visitor
const recordVisitorCheckOut = async (req, res, next) => {
  const { id } = req.params;

  try {
    const visitorLog = await VisitorLog.findById(id);
    if (!visitorLog) {
      return res.status(404).json({ message: 'Visiteur introuvable' });
    }

    visitorLog.checkOutTime = new Date();
    visitorLog.status = 'Departed';
    await visitorLog.save();

    res.status(200).json({ message: 'Sortie du visiteur enregistrée', visitorLog });
  } catch (error) {
    next(error);
  }
};

// Verify/Grant Physical Exit Authorization for Student Exit Pass
const verifyExitPass = async (req, res, next) => {
  const { id } = req.params;

  try {
    const pass = await ExitPass.findById(id);
    if (!pass) {
      return res.status(404).json({ message: 'Carte d\'autorisation introuvable' });
    }

    pass.status = 'Used';
    pass.verifiedByReceptionist = req.user.id;
    pass.verifiedAt = new Date();
    await pass.save();

    await pass.populate({
      path: 'student',
      populate: { path: 'user', select: 'firstName lastName profilePic phoneNumber' },
    });
    await pass.populate('class', 'name level');

    res.status(200).json({ message: 'Sortie de l\'élève autorisée et enregistrée par la réception', pass });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReceptionistDashboardStats,
  recordVisitorCheckIn,
  recordVisitorCheckOut,
  verifyExitPass,
};
