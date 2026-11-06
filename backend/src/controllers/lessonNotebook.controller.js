const LessonNotebook = require('../models/lessonNotebook.model');
const Class = require('../models/class.model');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const User = require('../models/user.model');
const path = require('path');
const fs = require('fs');

// Get Lessons for a class or teacher with filters
const getLessons = async (req, res, next) => {
  const { classId, subject, date, hasHomework } = req.query;
  const user = req.user;
  const role = user.role;

  try {
    const filter = {};

    if (role === 'student') {
      const student = await Student.findOne({ user: user.id });
      if (!student || !student.class) {
        return res.status(200).json([]);
      }
      filter.class = student.class;
    } else if (role === 'parent') {
      const parent = await Parent.findOne({ user: user.id });
      if (!parent || !parent.children || parent.children.length === 0) {
        return res.status(200).json([]);
      }
      const children = await Student.find({ _id: { $in: parent.children } }).select('class');
      const classIds = children.map((c) => c.class).filter(Boolean);
      if (classId && classIds.some((id) => id.toString() === classId.toString())) {
        filter.class = classId;
      } else {
        filter.class = { $in: classIds };
      }
    } else if (role === 'teacher') {
      const teacher = await Teacher.findOne({ user: user.id });
      const teacherClasses = (teacher?.classes || []).map((c) => (c._id ? c._id.toString() : c.toString()));
      if (classId) {
        if (!teacherClasses.includes(classId.toString())) {
          return res.status(200).json([]);
        }
        filter.class = classId;
      } else {
        filter.class = { $in: teacher?.classes || [] };
      }
    } else if (classId) {
      filter.class = classId;
    }

    if (subject) {
      filter.subject = subject;
    }

    if (hasHomework === 'true') {
      filter['homework.hasHomework'] = true;
    }

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      filter.date = { $gte: dayStart, $lte: dayEnd };
    }

    const lessons = await LessonNotebook.find(filter)
      .populate('class', 'name level section')
      .populate('teacherUser', 'firstName lastName profilePic')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json(lessons);
  } catch (error) {
    next(error);
  }
};

// Create a new lesson entry (Teacher or Admin/Supervisor)
const createLesson = async (req, res, next) => {
  const {
    title,
    subject,
    classId,
    date,
    period,
    summary,
    homework,
    attachments,
    pedagogicalLinks,
  } = req.body;
  const user = req.user;

  try {
    // Business rule: Only teachers can insert lessons and homework into Cahier de texte
    if (user.role !== 'teacher') {
      return res.status(403).json({
        message: 'فقط الأساتذة مخولون بإدراج الدروس والواجبات المنزلية في كراس النصوص (Seuls les enseignants peuvent ajouter au cahier de texte).',
      });
    }

    if (!title || !subject || !classId || !summary) {
      return res.status(400).json({
        message: 'Le titre, la matière, la classe et le résumé du cours sont requis.',
      });
    }

    let teacherId = null;
    if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: user.id });
      if (!teacher) {
        return res.status(404).json({ message: 'Profil enseignant introuvable.' });
      }
      const isAssigned = (teacher.classes || []).some(
        (c) => (c._id ? c._id.toString() : c.toString()) === classId.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({
          message: 'Accès refusé: vous ne pouvez ajouter des cours au cahier de texte que pour les classes qui vous sont assignées.',
        });
      }
      teacherId = teacher._id;
    }

    const lesson = await LessonNotebook.create({
      title,
      subject,
      class: classId,
      teacher: teacherId,
      teacherUser: user.id,
      teacherName: `${user.firstName} ${user.lastName}`,
      date: date ? new Date(date) : new Date(),
      period: period || '08:30 - 09:30',
      summary,
      homework: homework || { hasHomework: false },
      attachments: attachments || [],
      pedagogicalLinks: pedagogicalLinks || [],
    });

    const populatedLesson = await LessonNotebook.findById(lesson._id)
      .populate('class', 'name level')
      .populate('teacherUser', 'firstName lastName');

    // Notify students and parents of this class
    try {
      const { createNotification } = require('../services/notification.service');
      const students = await Student.find({ class: classId }).select('user parent');
      students.forEach((s) => {
        if (s.user) {
          createNotification(
            s.user,
            'course',
            `درس جديد: ${subject} - ${title}`,
            lesson._id
          );
        }
      });
    } catch (notifErr) {
      console.error('Failed to notify class students:', notifErr);
    }

    res.status(201).json(populatedLesson);
  } catch (error) {
    next(error);
  }
};

// Update lesson entry
const updateLesson = async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const lesson = await LessonNotebook.findById(id);
    if (!lesson) {
      return res.status(404).json({ message: 'Séance de cours introuvable' });
    }

    // Only author or admin/supervisors/teachers can edit
    const isAuthor = lesson.teacherUser && lesson.teacherUser.toString() === user.id.toString();
    const canEdit = isAuthor || ['admin', 'school', 'general_supervisor', 'pedagogical_supervisor'].includes(user.role);
    if (!canEdit) {
      return res.status(403).json({ message: 'Non autorisé à modifier ce cours.' });
    }

    if (user.role === 'teacher' && req.body.classId) {
      const teacher = await Teacher.findOne({ user: user.id });
      const isAssigned = (teacher?.classes || []).some(
        (c) => (c._id ? c._id.toString() : c.toString()) === req.body.classId.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({
          message: 'Accès refusé: vous ne pouvez affecter ce cours qu\'à une classe qui vous est assignée.',
        });
      }
    }

    const updated = await LessonNotebook.findByIdAndUpdate(id, req.body, { new: true })
      .populate('class', 'name level')
      .populate('teacherUser', 'firstName lastName');

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

// Delete lesson entry
const deleteLesson = async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const lesson = await LessonNotebook.findById(id);
    if (!lesson) {
      return res.status(404).json({ message: 'Séance introuvable' });
    }

    const isAuthor = lesson.teacherUser && lesson.teacherUser.toString() === user.id.toString();
    const canDelete = isAuthor || ['admin', 'school', 'teacher'].includes(user.role);
    if (!canDelete) {
      return res.status(403).json({ message: 'Non autorisé à supprimer ce cours.' });
    }

    await LessonNotebook.findByIdAndDelete(id);
    res.status(200).json({ message: 'Séance supprimée avec succès.' });
  } catch (error) {
    next(error);
  }
};

// Toggle student homework completed status
const toggleHomeworkStatus = async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const student = await Student.findOne({ user: user.id });
    if (!student) {
      return res.status(400).json({ message: 'Profil élève introuvable.' });
    }

    const lesson = await LessonNotebook.findById(id);
    if (!lesson || !lesson.homework?.hasHomework) {
      return res.status(404).json({ message: 'Devoir introuvable.' });
    }

    const existingIndex = lesson.homework.completedBy.findIndex(
      (c) => c.student && c.student.toString() === student._id.toString()
    );

    if (existingIndex > -1) {
      lesson.homework.completedBy.splice(existingIndex, 1);
    } else {
      lesson.homework.completedBy.push({ student: student._id, completedAt: new Date() });
    }

    await lesson.save();
    res.status(200).json({
      success: true,
      completed: existingIndex === -1,
      completedCount: lesson.homework.completedBy.length,
    });
  } catch (error) {
    next(error);
  }
};

// Sign official administrative visa (Cahier de texte officiel - Page 20)
const signAdministrativeVisa = async (req, res, next) => {
  const { id } = req.params;
  const { remarks } = req.body;
  const user = req.user;

  try {
    if (!['admin', 'school', 'general_supervisor', 'pedagogical_supervisor'].includes(user.role)) {
      return res.status(403).json({ message: 'Seule la direction ou l\'inspection pédagogique peut viser le cahier de texte.' });
    }

    const lesson = await LessonNotebook.findByIdAndUpdate(
      id,
      {
        $set: {
          'administrativeVisa.isVisaed': true,
          'administrativeVisa.visaedBy': user.id,
          'administrativeVisa.visaedByName': `${user.firstName} ${user.lastName}`,
          'administrativeVisa.visaedAt': new Date(),
          'administrativeVisa.remarks': remarks || 'تم الاطلاع والتأشير من طرف الإدارة / المفتش التربوي',
        },
      },
      { new: true }
    )
      .populate('class', 'name level')
      .populate('teacherUser', 'firstName lastName');

    res.status(200).json(lesson);
  } catch (error) {
    next(error);
  }
};

// Upload attachment for lesson notebook
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
      size: req.file.size,
      fileType: req.file.mimetype,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  toggleHomeworkStatus,
  signAdministrativeVisa,
  uploadAttachment,
};
