const Supervisor = require('../models/supervisor.model');
const StaffAttendance = require('../models/staffAttendance.model');
const MaterialDamage = require('../models/materialDamage.model');
const CanteenReservation = require('../models/canteenReservation.model');
const ExitPass = require('../models/exitPass.model');
const User = require('../models/user.model');
const Class = require('../models/class.model');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');
const Attendance = require('../models/attendance.model');
const { SalaryDeduction, Payroll } = require('../models/finance.model');

// Get supervisor dashboard summary
const getSupervisorDashboardStats = async (req, res, next) => {
  try {
    const supervisor = await Supervisor.findOne({ user: req.user.id }).populate('assignedClasses assignedTeachers');
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const staffAttendanceToday = await StaffAttendance.find({
      date: { $gte: todayStart, $lte: todayEnd },
    }).populate('staffUser', 'firstName lastName role phoneNumber profilePic username');

    const damagesToday = await MaterialDamage.find({
      date: { $gte: todayStart, $lte: todayEnd },
    }).populate('reportedBy', 'firstName lastName role');

    const canteenToday = await CanteenReservation.find({
      date: { $gte: todayStart, $lte: todayEnd },
    }).populate('user', 'firstName lastName role');

    const exitPassesToday = await ExitPass.find({
      date: { $gte: todayStart, $lte: todayEnd },
    }).populate('student class');

    // Fetch teachers, supervisors, classes, and students for assignment, exit passes, and attendance
    const allTeachers = await Teacher.find().populate('user', 'firstName lastName phoneNumber username profilePic baseSalary salaryDeductionPerAbsence');
    const allPedagogicalSupervisors = await Supervisor.find({ supervisorType: 'pedagogical_supervisor' })
      .populate('user', 'firstName lastName phoneNumber username profilePic baseSalary salaryDeductionPerAbsence')
      .populate('assignedClasses', 'name level');
    const allClasses = await Class.find();
    const students = await Student.find()
      .populate('user', 'firstName lastName username phoneNumber profilePic')
      .populate('class', 'name level');

    res.status(200).json({
      supervisor,
      staffAttendanceToday,
      damagesToday,
      canteenToday,
      exitPassesToday,
      allTeachers,
      allPedagogicalSupervisors,
      allClasses,
      students,
    });
  } catch (error) {
    next(error);
  }
};

// Record staff attendance (teachers and supervisors) + Trigger automated deduction if absent
const recordStaffAttendance = async (req, res, next) => {
  const { staffUserId, status, remarks, date } = req.body;

  try {
    if (!staffUserId || !status) {
      return res.status(400).json({ message: 'Personnel et statut requis' });
    }

    const targetUser = await User.findById(staffUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Employé introuvable' });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(12, 0, 0, 0);

    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    let attendance = await StaffAttendance.findOne({
      staffUser: staffUserId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    let deductionApplied = false;
    let deductionAmount = 0;

    // Check automated deduction if marked Absent
    if (status === 'Absent') {
      deductionApplied = true;
      deductionAmount = targetUser.salaryDeductionPerAbsence || 2000;

      const monthStr = attendanceDate.toISOString().slice(0, 7); // 'YYYY-MM'

      // Check if deduction already exists for this absence
      let deduction = await SalaryDeduction.findOne({
        user: staffUserId,
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      if (!deduction) {
        deduction = await SalaryDeduction.create({
          user: staffUserId,
          date: attendanceDate,
          amount: deductionAmount,
          reason: `Absence non justifiée le ${attendanceDate.toLocaleDateString('fr-FR')}`,
          deductedAutomatically: true,
          month: monthStr,
        });
      }

      // Update payroll for that month if exists
      let payroll = await Payroll.findOne({ user: staffUserId, month: monthStr });
      if (payroll) {
        payroll.totalAbsenceDays = (payroll.totalAbsenceDays || 0) + 1;
        payroll.totalDeductions = (payroll.totalDeductions || 0) + deductionAmount;
        payroll.netSalary = Math.max(0, payroll.baseSalary - payroll.totalDeductions + (payroll.bonuses || 0));
        await payroll.save();
      }
    } else {
      // If status changed from Absent to something else, clean up any existing deduction for today
      const startOfDay = new Date(attendanceDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(attendanceDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingDeduction = await SalaryDeduction.findOneAndDelete({
        user: staffUserId,
        date: { $gte: startOfDay, $lte: endOfDay },
        deductedAutomatically: true,
      });

      if (existingDeduction) {
        const monthStr = attendanceDate.toISOString().slice(0, 7);
        let payroll = await Payroll.findOne({ user: staffUserId, month: monthStr });
        if (payroll && payroll.totalDeductions >= existingDeduction.amount) {
          payroll.totalAbsenceDays = Math.max(0, (payroll.totalAbsenceDays || 1) - 1);
          payroll.totalDeductions -= existingDeduction.amount;
          payroll.netSalary = Math.max(0, payroll.baseSalary - payroll.totalDeductions + (payroll.bonuses || 0));
          await payroll.save();
        }
      }
    }

    if (attendance) {
      attendance.status = status;
      attendance.remarks = remarks || attendance.remarks;
      attendance.recordedBy = req.user.id;
      attendance.deductionApplied = deductionApplied;
      attendance.deductionAmount = deductionAmount;
      await attendance.save();
    } else {
      attendance = await StaffAttendance.create({
        staffUser: staffUserId,
        role: targetUser.role,
        date: attendanceDate,
        status,
        remarks: remarks || '',
        recordedBy: req.user.id,
        deductionApplied,
        deductionAmount,
      });
    }

    await attendance.populate('staffUser', 'firstName lastName role phoneNumber profilePic username');

    res.status(200).json({
      message: status === 'Absent' 
        ? `Absence enregistrée. Déduction automatique de ${deductionAmount} DZD appliquée.` 
        : 'Présence enregistrée avec succès.',
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

// Record Material Damage
const recordMaterialDamage = async (req, res, next) => {
  const { itemDescription, location, estimatedCost } = req.body;

  try {
    if (!itemDescription || !location) {
      return res.status(400).json({ message: 'Description et lieu requis' });
    }

    const damage = await MaterialDamage.create({
      itemDescription,
      location,
      estimatedCost: Number(estimatedCost) || 0,
      reportedBy: req.user.id,
    });

    await damage.populate('reportedBy', 'firstName lastName role');

    res.status(201).json({ message: 'Rapport de détérioration envoyé au Superviseur Général', damage });
  } catch (error) {
    next(error);
  }
};

// Update Material Damage (by General Supervisor)
const updateMaterialDamage = async (req, res, next) => {
  const { id } = req.params;
  const { status, generalSupervisorRemarks, estimatedCost } = req.body;

  try {
    const damage = await MaterialDamage.findById(id);
    if (!damage) {
      return res.status(404).json({ message: 'Rapport introuvable' });
    }

    if (status) damage.status = status;
    if (generalSupervisorRemarks !== undefined) damage.generalSupervisorRemarks = generalSupervisorRemarks;
    if (estimatedCost !== undefined) damage.estimatedCost = Number(estimatedCost);

    await damage.save();
    await damage.populate('reportedBy', 'firstName lastName role');

    res.status(200).json({ message: 'Statut du rapport mis à jour', damage });
  } catch (error) {
    next(error);
  }
};

// Canteen Reservations
const createCanteenReservation = async (req, res, next) => {
  const { mealType, date, remarks } = req.body;

  try {
    const reservationDate = date ? new Date(date) : new Date();
    reservationDate.setHours(12, 0, 0, 0);

    const startOfDay = new Date(reservationDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reservationDate);
    endOfDay.setHours(23, 59, 59, 999);

    let reservation = await CanteenReservation.findOne({
      user: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (reservation) {
      reservation.mealType = mealType || reservation.mealType;
      reservation.remarks = remarks || reservation.remarks;
      await reservation.save();
    } else {
      reservation = await CanteenReservation.create({
        user: req.user.id,
        mealType: mealType || 'Déjeuner (Glaçé/Normal)',
        date: reservationDate,
        remarks: remarks || '',
      });
    }

    await reservation.populate('user', 'firstName lastName role profilePic');

    res.status(200).json({ message: 'Réservation cantine enregistrée', reservation });
  } catch (error) {
    next(error);
  }
};

// Assign pedagogical supervisor to classes (by General Supervisor)
const assignClassesToSupervisor = async (req, res, next) => {
  const { supervisorId, classIds } = req.body;

  try {
    const supervisor = await Supervisor.findById(supervisorId);
    if (!supervisor) {
      return res.status(404).json({ message: 'Superviseur introuvable' });
    }

    supervisor.assignedClasses = classIds || [];
    await supervisor.save();

    await supervisor.populate('user', 'firstName lastName phoneNumber username profilePic');
    await supervisor.populate('assignedClasses', 'name level');

    res.status(200).json({ message: 'Affectation des classes mise à jour', supervisor });
  } catch (error) {
    next(error);
  }
};

// Create Student Exit Pass (by Pedagogical Supervisor or Teacher)
const createExitPass = async (req, res, next) => {
  const { studentId, classId, reason, exitTime, accompaniedBy } = req.body;

  try {
    if (!studentId || !reason || !exitTime) {
      return res.status(400).json({ message: 'Étudiant, motif et heure de sortie requis' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Étudiant introuvable' });
    }

    const pass = await ExitPass.create({
      student: studentId,
      class: classId || student.class,
      reason,
      exitTime,
      accompaniedBy: accompaniedBy || 'Parent / Tuteur',
      issuedBy: req.user.id,
      status: 'Approved',
    });

    await pass.populate({
      path: 'student',
      populate: { path: 'user', select: 'firstName lastName profilePic phoneNumber' },
    });
    await pass.populate('class', 'name');

    res.status(201).json({ message: 'Carte d\'autorisation de sortie créée avec succès', pass });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSupervisorDashboardStats,
  recordStaffAttendance,
  recordMaterialDamage,
  updateMaterialDamage,
  createCanteenReservation,
  assignClassesToSupervisor,
  createExitPass,
};
