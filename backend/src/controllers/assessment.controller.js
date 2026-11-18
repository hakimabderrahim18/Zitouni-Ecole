const Assessment = require('../models/assessment.model');
const Class = require('../models/class.model');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const SchoolSetting = require('../models/schoolSetting.model');
const Notification = require('../models/notification.model');
const AuditLog = require('../models/auditLog.model');
const { getIO } = require('../sockets/socket.manager');
const { generateIndividualReportCardPDF, generateCollectiveReportCardPDF } = require('../services/assessmentPdf.service');
const { generateExcel } = require('../services/excel.service');

// Helper to log audit actions
const logAudit = async (user, action, targetId, details, metadata = {}) => {
  try {
    await AuditLog.create({
      user: user._id,
      action,
      targetType: 'Assessment',
      targetId: targetId ? targetId.toString() : '',
      reason: details || '',
      metadata,
    });
  } catch (err) {
    console.error('AuditLog error:', err.message);
  }
};

/**
 * 1. Get Teacher's Assigned Classes, Subjects, and Roster
 */
const getMyAssignedClassesAndSubjects = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id }).populate({
      path: 'classes',
      select: 'name level modules',
    });

    if (!teacher) {
      return res.status(404).json({ message: 'الملف المهني للأستاذ غير موجود.' });
    }

    const assignedClasses = teacher.classes || [];
    const assignedSubjects = teacher.subjects || [];

    // Fetch students roster for each assigned class
    const classIds = assignedClasses.map((c) => c._id);
    const students = await Student.find({ class: { $in: classIds } })
      .populate('user', 'firstName lastName firstNameArabic lastNameArabic firstNameFrench lastNameFrench email')
      .sort({ 'user.lastNameArabic': 1, 'user.lastName': 1 });

    const classesWithRosters = assignedClasses.map((cls) => {
      const classStudents = students.filter((s) => s.class.toString() === cls._id.toString());
      return {
        _id: cls._id,
        name: cls.name,
        level: cls.level,
        modules: cls.modules || [],
        students: classStudents.map((s) => ({
          _id: s._id,
          registrationNumber: s.registrationNumber || s.nationalIdDigitization || '',
          firstName: s.user?.firstName || '',
          lastName: s.user?.lastName || '',
          firstNameArabic: s.user?.firstNameArabic || s.firstNameArabic || '',
          lastNameArabic: s.user?.lastNameArabic || s.lastNameArabic || '',
          fullName: `${s.user?.firstNameArabic || s.user?.firstName || ''} ${s.user?.lastNameArabic || s.user?.lastName || ''}`.trim(),
        })),
      };
    });

    res.status(200).json({
      classes: classesWithRosters,
      subjects: assignedSubjects,
      teacherId: teacher._id,
    });
  } catch (err) {
    console.error('Error fetching teacher assigned classes:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء تحميل الأقسام والمواد المسندة.' });
  }
};

/**
 * 2. Get Teacher's Assessments List
 */
const getTeacherAssessments = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'الأستاذ غير موجود' });
    }

    const { classId, status, subject } = req.query;
    const filter = { teacher: teacher._id };

    if (classId) filter.class = classId;
    if (status) filter.status = status;
    if (subject) filter.subject = subject;

    const assessments = await Assessment.find(filter)
      .populate('class', 'name level')
      .sort({ createdAt: -1 });

    res.status(200).json(assessments);
  } catch (err) {
    console.error('Error fetching teacher assessments:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء تحميل كشوف النقاط.' });
  }
};

/**
 * 3. Get Assessment Details by ID
 */
const getAssessmentById = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('class', 'name level modules')
      .populate('teacherUser', 'firstName lastName firstNameArabic lastNameArabic email')
      .populate({
        path: 'records.student',
        populate: {
          path: 'user parent',
          select: 'firstName lastName firstNameArabic lastNameArabic registrationNumber',
        },
      });

    if (!assessment) {
      return res.status(404).json({ message: 'كشف التقييم غير موجود.' });
    }

    // Role check: if teacher, ensure it belongs to them
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (!teacher || assessment.teacher.toString() !== teacher._id.toString()) {
        return res.status(403).json({ message: 'غير مصرح لك بالاطلاع على هذا الكشف.' });
      }
    }

    res.status(200).json(assessment);
  } catch (err) {
    console.error('Error getting assessment by ID:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء تحميل تفاصيل الكشف.' });
  }
};

/**
 * 4. Save Assessment (Draft or Submit to Admin)
 */
const saveAssessment = async (req, res) => {
  try {
    const {
      assessmentId,
      classId,
      subject,
      assessmentType,
      assessmentDate,
      maxGrade = 20,
      classRemark = '',
      records = [],
      submitToAdmin = false,
      forceDuplicate = false,
    } = req.body;

    const isAdmin = ['admin', 'school'].includes(req.user.role);
    let teacherDoc = null;

    if (!isAdmin) {
      // Must be teacher
      teacherDoc = await Teacher.findOne({ user: req.user._id });
      if (!teacherDoc) {
        return res.status(403).json({ message: 'حساب الأستاذ غير مسجل في النظام.' });
      }

      // Check class assignment
      const isClassAssigned = (teacherDoc.classes || []).some((c) => c.toString() === classId.toString());
      if (!isClassAssigned) {
        return res.status(403).json({ message: 'لا يمكنك إدخال نقاط لقسم غير مسند إليك.' });
      }

      // Check subject assignment
      const isSubjectAssigned = (teacherDoc.subjects || []).includes(subject);
      if (!isSubjectAssigned) {
        return res.status(403).json({ message: 'المادة المختارة غير مسندة إليك في هذا القسم.' });
      }
    }

    // Verify class exists
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: 'القسم المحدد غير موجود.' });
    }

    // Verify all students belong to the class
    const classStudents = await Student.find({ class: classId }).select('_id user');
    const validStudentIds = new Set(classStudents.map((s) => s._id.toString()));

    for (const r of records) {
      if (r.student && !validStudentIds.has(r.student.toString())) {
        return res.status(400).json({ message: `تلميذ ذو المعرف ${r.student} غير مسجل في القسم المختار.` });
      }
      if (r.grade != null && (r.grade < 0 || r.grade > maxGrade)) {
        return res.status(400).json({ message: `العلامة ${r.grade} خارج السلم المعتمد (من 0 إلى ${maxGrade}).` });
      }
    }

    let assessment;

    if (assessmentId) {
      // Update existing
      assessment = await Assessment.findById(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: 'الكشف المراد تعديله غير موجود.' });
      }

      // If teacher: lock check
      if (!isAdmin) {
        if (assessment.status === 'submitted') {
          return res.status(400).json({
            message: 'الكشف مرسل إلى الإدارة وهو قيد المراجعة، مقفل عن التعديل حتى تسمح الإدارة بذلك أو تعيده للتصحيح.',
          });
        }
        if (assessment.status === 'approved') {
          return res.status(400).json({
            message: 'الكشف تم اعتماده نهائياً من طرف الإدارة ولا يمكن تعديله.',
          });
        }
      }

      assessment.class = classId;
      assessment.cycle = classDoc.level;
      assessment.subject = subject;
      assessment.assessmentType = assessmentType;
      assessment.assessmentDate = assessmentDate || assessment.assessmentDate;
      assessment.maxGrade = maxGrade;
      assessment.classRemark = classRemark;

      // Update student records
      assessment.records = records.map((r) => {
        const studentObj = classStudents.find((s) => s._id.toString() === r.student.toString());
        return {
          student: r.student,
          studentUser: studentObj?.user || r.studentUser,
          grade: r.isAbsent ? null : r.grade != null && r.grade !== '' ? Number(r.grade) : null,
          isAbsent: Boolean(r.isAbsent),
          individualRemark: (r.individualRemark || '').trim(),
          isPublished: r.isPublished || false,
        };
      });

      if (submitToAdmin) {
        assessment.status = 'submitted';
        assessment.submittedAt = new Date();
        assessment.history.push({
          action: 'submit_to_admin',
          by: req.user._id,
          byName: `${req.user.firstName} ${req.user.lastName}`,
          at: new Date(),
          details: 'إرسال الكشف للمراجعة والاعتماد من طرف الإدارة',
        });
      } else {
        // If it was returned for correction, keep as returned or update
        if (assessment.status !== 'returned') {
          assessment.status = 'draft';
        }
        assessment.history.push({
          action: 'auto_save',
          by: req.user._id,
          byName: `${req.user.firstName} ${req.user.lastName}`,
          at: new Date(),
          details: 'حفظ مسودة الكشف',
        });
      }

      await assessment.save();
    } else {
      // Create new assessment
      // Check duplicate assessment
      if (!forceDuplicate) {
        const existing = await Assessment.findOne({
          class: classId,
          subject,
          assessmentType,
          assessmentDate: new Date(assessmentDate),
        });
        if (existing) {
          return res.status(409).json({
            isDuplicateWarning: true,
            existingId: existing._id,
            message: `يوجد كشف سابق مسجل لنفس القسم (${classDoc.name}) ونفس المادة (${subject}) ونوع التقييم (${assessmentType}) بنفس التاريخ. هل ترغب في المتابعة على أية حال؟`,
          });
        }
      }

      const formattedRecords = records.map((r) => {
        const studentObj = classStudents.find((s) => s._id.toString() === r.student.toString());
        return {
          student: r.student,
          studentUser: studentObj?.user || r.studentUser,
          grade: r.isAbsent ? null : r.grade != null && r.grade !== '' ? Number(r.grade) : null,
          isAbsent: Boolean(r.isAbsent),
          individualRemark: (r.individualRemark || '').trim(),
          isPublished: false,
        };
      });

      assessment = await Assessment.create({
        academicYear: '2026-2027',
        cycle: classDoc.level,
        class: classId,
        subject,
        teacher: teacherDoc ? teacherDoc._id : req.body.teacherId,
        teacherUser: req.user._id,
        assessmentType,
        assessmentDate: assessmentDate || new Date(),
        maxGrade,
        classRemark,
        records: formattedRecords,
        status: submitToAdmin ? 'submitted' : 'draft',
        submittedAt: submitToAdmin ? new Date() : null,
        history: [
          {
            action: submitToAdmin ? 'submit_to_admin' : 'create_draft',
            by: req.user._id,
            byName: `${req.user.firstName} ${req.user.lastName}`,
            at: new Date(),
            details: submitToAdmin ? 'إنشاء وإرسال الكشف مباشرة للإدارة' : 'إنشاء وحفظ مسودة الكشف',
          },
        ],
      });
    }

    await logAudit(
      req.user,
      submitToAdmin ? 'ASSESSMENT_SUBMIT' : 'ASSESSMENT_SAVE',
      assessment._id,
      `${submitToAdmin ? 'إرسال' : 'حفظ'} كشف نقاط ${assessmentType} - ${subject} (${classDoc.name})`
    );

    res.status(200).json({
      message: submitToAdmin ? 'تم إرسال الكشف إلى الإدارة بنجاح.' : 'تم حفظ مسودة الكشف بنجاح.',
      assessment,
    });
  } catch (err) {
    console.error('Error saving assessment:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء حفظ الكشف.' });
  }
};

/**
 * 5. Submit an existing draft assessment to Admin
 */
const submitAssessmentToAdmin = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id).populate('class');
    if (!assessment) {
      return res.status(404).json({ message: 'الكشف غير موجود.' });
    }

    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (!teacher || assessment.teacher.toString() !== teacher._id.toString()) {
        return res.status(403).json({ message: 'غير مصرح لك بإرسال هذا الكشف.' });
      }
    }

    assessment.status = 'submitted';
    assessment.submittedAt = new Date();
    assessment.history.push({
      action: 'submit_to_admin',
      by: req.user._id,
      byName: `${req.user.firstName} ${req.user.lastName}`,
      at: new Date(),
      details: 'إرسال الكشف إلى الإدارة للمراجعة والاعتماد',
    });

    await assessment.save();

    await logAudit(
      req.user,
      'ASSESSMENT_SUBMIT',
      assessment._id,
      `إرسال كشف نقاط ${assessment.assessmentType} لمادة ${assessment.subject}`
    );

    res.status(200).json({ message: 'تم إرسال الكشف إلى الإدارة وقفله بنجاح.', assessment });
  } catch (err) {
    console.error('Error submitting assessment to admin:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء إرسال الكشف للإدارة.' });
  }
};

/**
 * 6. Admin: Get All Assessments with Filters & Completion Metrics
 */
const getAllAssessments = async (req, res) => {
  try {
    const { cycle, classId, subject, teacherId, status, academicYear, search } = req.query;
    const filter = {};

    if (cycle) filter.cycle = cycle;
    if (classId) filter.class = classId;
    if (subject) filter.subject = subject;
    if (teacherId) filter.teacher = teacherId;
    if (status) filter.status = status;
    if (academicYear) filter.academicYear = academicYear;

    let query = Assessment.find(filter)
      .populate('class', 'name level')
      .populate('teacherUser', 'firstName lastName firstNameArabic lastNameArabic email')
      .sort({ createdAt: -1 });

    const assessments = await query.exec();

    // Summary counts for admin overview
    const totalCount = await Assessment.countDocuments();
    const draftCount = await Assessment.countDocuments({ status: 'draft' });
    const submittedCount = await Assessment.countDocuments({ status: 'submitted' });
    const approvedCount = await Assessment.countDocuments({ status: 'approved' });
    const returnedCount = await Assessment.countDocuments({ status: 'returned' });
    const publishedCount = await Assessment.countDocuments({ isPublished: true });

    res.status(200).json({
      assessments,
      metrics: {
        total: totalCount,
        draft: draftCount,
        submitted: submittedCount,
        approved: approvedCount,
        returned: returnedCount,
        published: publishedCount,
      },
    });
  } catch (err) {
    console.error('Error fetching all assessments:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء تحميل الكشوف.' });
  }
};

/**
 * 7. Admin: Review Assessment (Approve or Return for correction)
 */
const reviewAssessment = async (req, res) => {
  try {
    const { action, returnReason } = req.body; // action: 'approve' | 'return' | 'under_review'
    const assessment = await Assessment.findById(req.params.id)
      .populate('class', 'name')
      .populate('teacherUser');

    if (!assessment) {
      return res.status(404).json({ message: 'الكشف غير موجود.' });
    }

    if (action === 'approve') {
      assessment.status = 'approved';
      assessment.approvedAt = new Date();
      assessment.approvedBy = req.user._id;
      assessment.returnReason = '';
      assessment.history.push({
        action: 'approve',
        by: req.user._id,
        byName: `${req.user.firstName} ${req.user.lastName}`,
        at: new Date(),
        details: 'تم اعتماد الكشف نهائياً من طرف الإدارة',
      });

      // Send notification to the teacher
      try {
        await Notification.create({
          recipient: assessment.teacherUser._id,
          title: 'تم اعتماد كشف النقاط',
          content: `تمت المصادقة والاعتماد النهائي لكشف ${assessment.assessmentType} لمادة ${assessment.subject} (${assessment.class?.name}).`,
          type: 'assessment',
        });
      } catch (e) {}
    } else if (action === 'return') {
      if (!returnReason || !returnReason.trim()) {
        return res.status(400).json({ message: 'يجب كتابة سبب إرجاع الكشف للتصحيح.' });
      }

      assessment.status = 'returned';
      assessment.returnReason = returnReason.trim();
      assessment.history.push({
        action: 'return',
        by: req.user._id,
        byName: `${req.user.firstName} ${req.user.lastName}`,
        at: new Date(),
        details: `إرجاع الكشف للتصحيح: ${returnReason.trim()}`,
      });

      // Notify the teacher about return reason
      try {
        await Notification.create({
          recipient: assessment.teacherUser._id,
          title: 'كشف نقاط مُعاد للتصحيح',
          content: `أعادت الإدارة كشف ${assessment.assessmentType} (${assessment.subject}) للتصحيح. السبب: ${returnReason.trim()}`,
          type: 'warning',
        });
      } catch (e) {}
    } else if (action === 'under_review') {
      assessment.status = 'under_review';
      assessment.history.push({
        action: 'under_review',
        by: req.user._id,
        byName: `${req.user.firstName} ${req.user.lastName}`,
        at: new Date(),
        details: 'الكشف قيد المراجعة والتدقيق الإداري',
      });
    }

    await assessment.save();

    await logAudit(
      req.user,
      `ASSESSMENT_${action.toUpperCase()}`,
      assessment._id,
      `قرار مراجعة الكشف: ${action}`,
      { returnReason }
    );

    res.status(200).json({ message: 'تم تحديث حالة الكشف بنجاح.', assessment });
  } catch (err) {
    console.error('Error reviewing assessment:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء معالجة الكشف.' });
  }
};

/**
 * 8. Admin: Control Publishing Results to Parents and Students
 */
const controlPublishing = async (req, res) => {
  try {
    const { publishMode, studentIds = [], scheduledPublishAt = null } = req.body;
    // publishMode: 'general' | 'partial' | 'individual' | 'scheduled' | 'unpublish'

    const assessment = await Assessment.findById(req.params.id).populate('class');
    if (!assessment) {
      return res.status(404).json({ message: 'الكشف غير موجود.' });
    }

    if (publishMode === 'unpublish') {
      assessment.isPublished = false;
      assessment.publishScope = 'none';
      assessment.scheduledPublishAt = null;
      assessment.records.forEach((r) => {
        r.isPublished = false;
      });

      assessment.history.push({
        action: 'unpublish',
        by: req.user._id,
        byName: `${req.user.firstName} ${req.user.lastName}`,
        at: new Date(),
        details: 'إخفاء النتائج وسحبها من فضاء الأولياء والتلاميذ بقرار إداري',
      });

      await assessment.save();
      return res.status(200).json({ message: 'تم إخفاء النتائج من فضاء الأولياء والتلاميذ بنجاح.', assessment });
    }

    if (publishMode === 'scheduled') {
      if (!scheduledPublishAt || new Date(scheduledPublishAt) <= new Date()) {
        return res.status(400).json({ message: 'يرجى تحديد تاريخ ووقت مستقبلي صحيح للنشر التلقائي.' });
      }

      assessment.scheduledPublishAt = new Date(scheduledPublishAt);
      assessment.isAutoPublishExecuted = false;
      assessment.history.push({
        action: 'schedule_publish',
        by: req.user._id,
        byName: `${req.user.firstName} ${req.user.lastName}`,
        at: new Date(),
        details: `جدولة النشر التلقائي للنتائج بتاريخ: ${new Date(scheduledPublishAt).toLocaleString('fr-DZ')}`,
      });

      await assessment.save();
      return res.status(200).json({ message: 'تمت جدولة موعد نشر النتائج بنجاح.', assessment });
    }

    // Direct Publishing (General, Partial, or Individual)
    assessment.isPublished = true;
    assessment.publishedAt = new Date();
    assessment.publishedBy = req.user._id;
    assessment.publishScope = publishMode;

    if (publishMode === 'individual' && Array.isArray(studentIds) && studentIds.length > 0) {
      const studentIdStrings = studentIds.map((id) => id.toString());
      assessment.records.forEach((r) => {
        if (studentIdStrings.includes(r.student.toString())) {
          r.isPublished = true;
          r.publishedAt = new Date();
        }
      });
    } else {
      // General or Partial publish
      assessment.records.forEach((r) => {
        r.isPublished = true;
        r.publishedAt = new Date();
      });
    }

    assessment.history.push({
      action: 'publish',
      by: req.user._id,
      byName: `${req.user.firstName} ${req.user.lastName}`,
      at: new Date(),
      details: `نشر النتائج (${publishMode === 'individual' ? 'نشر فردي' : 'نشر عام'}) للأولياء والتلاميذ`,
    });

    await assessment.save();

    // Trigger in-app notifications to parents & students
    try {
      let io = null;
      try {
        io = getIO();
      } catch (e) {}

      const students = await Student.find({ class: assessment.class?._id || assessment.class }).populate('user parent');

      for (const st of students) {
        // If individual mode, check if this student was published
        if (publishMode === 'individual' && !studentIds.includes(st._id.toString())) {
          continue;
        }

        // Notify Student
        if (st.user?._id) {
          const notif = await Notification.create({
            recipient: st.user._id,
            title: `تم نشر نتيجة: ${assessment.subject}`,
            content: `أعلنت إدارة المؤسسة عن نتائج ${assessment.assessmentType} لمادة ${assessment.subject}. تفضل بالاطلاع على علامتك.`,
            type: 'assessment',
          });
          if (io) io.to(st.user._id.toString()).emit('new_notification', notif);
        }

        // Notify Parent
        if (st.parent) {
          const pDoc = await Parent.findById(st.parent).populate('user');
          if (pDoc?.user?._id) {
            const notifP = await Notification.create({
              recipient: pDoc.user._id,
              title: `كشف نقاط جديد: ${st.user?.firstName || 'ابنكم'}`,
              content: `تم نشر نتائج ${assessment.assessmentType} لمادة ${assessment.subject} الخاصة بقسم ${assessment.class?.name}.`,
              type: 'assessment',
            });
            if (io) io.to(pDoc.user._id.toString()).emit('new_notification', notifP);
          }
        }
      }
    } catch (notifErr) {
      console.error('Error sending publishing notifications:', notifErr.message);
    }

    await logAudit(
      req.user,
      'ASSESSMENT_PUBLISH',
      assessment._id,
      `نشر النتائج بنطاق: ${publishMode}`,
      { publishMode, studentIds }
    );

    res.status(200).json({ message: 'تم نشر النتائج في فضاء الأولياء والتلاميذ بنجاح.', assessment });
  } catch (err) {
    console.error('Error controlling publishing:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء نشر النتائج.' });
  }
};

/**
 * 9. Assessment Academic Statistics & Teacher Completion Report
 */
const getAssessmentStatistics = async (req, res) => {
  try {
    const { cycle, classId, subject, academicYear = '2026-2027', minPassingGrade = 10 } = req.query;
    const filter = { academicYear };
    if (cycle) filter.cycle = cycle;
    if (classId) filter.class = classId;
    if (subject) filter.subject = subject;

    const assessments = await Assessment.find(filter)
      .populate('class', 'name level')
      .populate('teacherUser', 'firstName lastName firstNameArabic lastNameArabic');

    const threshold = Number(minPassingGrade) || 10;

    // 1. Assessment summaries
    const assessmentStats = assessments.map((a) => {
      const records = a.records || [];
      const presentRecords = records.filter((r) => !r.isAbsent && r.grade != null);
      const grades = presentRecords.map((r) => r.grade);

      const count = records.length;
      const presentCount = presentRecords.length;
      const absentCount = count - presentCount;

      let avg = 0;
      let maxScore = 0;
      let minScore = 0;
      let passCount = 0;

      if (presentCount > 0) {
        avg = grades.reduce((sum, g) => sum + g, 0) / presentCount;
        maxScore = Math.max(...grades);
        minScore = Math.min(...grades);
        passCount = grades.filter((g) => g >= threshold).length;
      }

      const passRate = presentCount > 0 ? (passCount / presentCount) * 100 : 0;

      return {
        _id: a._id,
        className: a.class?.name || '',
        cycle: a.cycle,
        subject: a.subject,
        assessmentType: a.assessmentType,
        assessmentDate: a.assessmentDate,
        teacherName: a.teacherUser ? `${a.teacherUser.firstName || ''} ${a.teacherUser.lastName || ''}`.trim() : '',
        status: a.status,
        isPublished: a.isPublished,
        classRemark: a.classRemark,
        totalStudents: count,
        presentStudents: presentCount,
        absentStudents: absentCount,
        average: Number(avg.toFixed(2)),
        maxScore: Number(maxScore.toFixed(2)),
        minScore: Number(minScore.toFixed(2)),
        passCount,
        failCount: presentCount - passCount,
        passRate: Number(passRate.toFixed(1)),
      };
    });

    // 2. Teacher completion progress report
    const allTeachers = await Teacher.find({}).populate('user', 'firstName lastName firstNameArabic lastNameArabic email');
    const teacherProgress = allTeachers.map((t) => {
      const assignedCount = (t.classes || []).length * (t.subjects || []).length;
      const teacherAssessments = assessments.filter((a) => a.teacher?.toString() === t._id.toString());
      const approvedCount = teacherAssessments.filter((a) => a.status === 'approved').length;
      const submittedCount = teacherAssessments.filter((a) => a.status === 'submitted').length;
      const draftCount = teacherAssessments.filter((a) => a.status === 'draft').length;
      const totalCreated = teacherAssessments.length;

      const completionRate = assignedCount > 0 ? Math.min(100, Math.round((approvedCount / assignedCount) * 100)) : 100;

      return {
        teacherId: t._id,
        teacherName: t.user ? `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim() : 'أستاذ',
        subjects: t.subjects || [],
        assignedClassesCount: (t.classes || []).length,
        createdCount: totalCreated,
        draftCount,
        submittedCount,
        approvedCount,
        completionRate,
      };
    });

    res.status(200).json({
      assessmentStats,
      teacherProgress,
      threshold,
    });
  } catch (err) {
    console.error('Error calculating assessment statistics:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء احتساب الإحصائيات.' });
  }
};

/**
 * 10. Export Assessment Report Card PDF (Individual or Collective)
 */
const exportReportCardPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'collective', studentId } = req.query; // 'individual' or 'collective'

    const assessment = await Assessment.findById(id)
      .populate('class')
      .populate('teacherUser')
      .populate({
        path: 'records.student',
        populate: {
          path: 'user',
        },
      });

    if (!assessment) {
      return res.status(404).json({ message: 'الكشف غير موجود.' });
    }

    const schoolSettings = (await SchoolSetting.findOne({})) || {};

    let pdfBuffer;
    let filename;

    if (type === 'individual' && studentId) {
      const rec = (assessment.records || []).find((r) => r.student?._id.toString() === studentId.toString());
      if (!rec) {
        return res.status(404).json({ message: 'سجل التلميذ غير موجود في هذا الكشف.' });
      }
      pdfBuffer = await generateIndividualReportCardPDF(assessment, rec, schoolSettings);
      const studentName = rec.student?.user?.lastName || 'student';
      filename = `Bulletin_${assessment.subject}_${studentName}.pdf`;
    } else {
      pdfBuffer = await generateCollectiveReportCardPDF(assessment, schoolSettings);
      filename = `Kashf_Collectif_${assessment.class?.name || 'Class'}_${assessment.subject}.pdf`;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating report card PDF:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء استخراج ملف الـ PDF.' });
  }
};

/**
 * 11. Export Statistics / Grade Sheet to Excel
 */
const exportReportCardExcel = async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id)
      .populate('class')
      .populate('teacherUser')
      .populate({
        path: 'records.student',
        populate: { path: 'user' },
      });

    if (!assessment) {
      return res.status(404).json({ message: 'الكشف غير موجود.' });
    }

    const rows = (assessment.records || []).map((r, idx) => {
      const st = r.student || {};
      const u = st.user || {};
      return {
        'الرقم': idx + 1,
        'اسم ولقب التلميذ': `${u.firstNameArabic || u.firstName || ''} ${u.lastNameArabic || u.lastName || ''}`.trim(),
        'الاسم بالفرنسية': `${u.firstNameFrench || u.firstName || ''} ${u.lastNameFrench || u.lastName || ''}`.trim(),
        'رقم التسجيل': st.registrationNumber || st.nationalIdDigitization || '',
        'الحالة': r.isAbsent ? 'غائب' : 'حاضر',
        'العلامة / 20': r.isAbsent ? 'غائب' : r.grade != null ? r.grade : '',
        'الملاحظة الفردية': r.individualRemark || '',
      };
    });

    const excelBuffer = generateExcel(rows, `كشف_${assessment.class?.name || 'قسم'}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Kashf_${encodeURIComponent(assessment.subject)}.xlsx"`);
    res.send(excelBuffer);
  } catch (err) {
    console.error('Error exporting Excel report:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء تصدير ملف الإكسل.' });
  }
};

/**
 * 12. Parent: Get Children's Published Results
 */
const getParentChildrenResults = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id }).populate({
      path: 'children',
      populate: { path: 'user class', select: 'firstName lastName firstNameArabic lastNameArabic name level' },
    });

    if (!parent || !parent.children || parent.children.length === 0) {
      return res.status(200).json({ childrenResults: [] });
    }

    const childIds = parent.children.map((c) => c._id.toString());
    const classIds = parent.children.map((c) => c.class?._id || c.class).filter(Boolean);

    // Find assessments where either the whole assessment is published OR specific child is published
    const assessments = await Assessment.find({
      class: { $in: classIds },
      $or: [{ isPublished: true }, { 'records.isPublished': true }],
    })
      .populate('class', 'name level')
      .populate('teacherUser', 'firstName lastName firstNameArabic lastNameArabic')
      .sort({ assessmentDate: -1 });

    const childrenResults = parent.children.map((child) => {
      const childAssessments = [];

      assessments.forEach((a) => {
        const rec = (a.records || []).find((r) => r.student?.toString() === child._id.toString());
        // Only include if published
        if (rec && (a.isPublished || rec.isPublished)) {
          // Calculate class stats for context
          const presentGrades = (a.records || []).filter((r) => !r.isAbsent && r.grade != null).map((r) => r.grade);
          const classAvg = presentGrades.length > 0 ? (presentGrades.reduce((x, y) => x + y, 0) / presentGrades.length).toFixed(2) : '--';
          const maxGrade = presentGrades.length > 0 ? Math.max(...presentGrades).toFixed(2) : '--';
          const minGrade = presentGrades.length > 0 ? Math.min(...presentGrades).toFixed(2) : '--';

          childAssessments.push({
            assessmentId: a._id,
            subject: a.subject,
            assessmentType: a.assessmentType,
            assessmentDate: a.assessmentDate,
            teacherName: a.teacherUser ? `${a.teacherUser.firstName || ''} ${a.teacherUser.lastName || ''}`.trim() : '',
            maxGrade: a.maxGrade || 20,
            grade: rec.grade,
            isAbsent: rec.isAbsent,
            individualRemark: rec.individualRemark,
            classRemark: a.classRemark,
            classAverage: classAvg,
            classMax: maxGrade,
            classMin: minGrade,
          });
        }
      });

      return {
        childId: child._id,
        childName: `${child.user?.firstNameArabic || child.user?.firstName || ''} ${child.user?.lastNameArabic || child.user?.lastName || ''}`.trim(),
        className: child.class?.name || '',
        assessments: childAssessments,
      };
    });

    res.status(200).json({ childrenResults });
  } catch (err) {
    console.error('Error fetching parent results:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء تحميل نتائج الأبناء.' });
  }
};

/**
 * 13. Student: Get Own Published Results
 */
const getMyResults = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id }).populate('class', 'name level');
    if (!student) {
      return res.status(404).json({ message: 'الملف الدراسي للتلميذ غير موجود.' });
    }

    const assessments = await Assessment.find({
      class: student.class?._id || student.class,
      $or: [{ isPublished: true }, { 'records.isPublished': true }],
    })
      .populate('teacherUser', 'firstName lastName firstNameArabic lastNameArabic')
      .sort({ assessmentDate: -1 });

    const results = [];

    assessments.forEach((a) => {
      const rec = (a.records || []).find((r) => r.student?.toString() === student._id.toString());
      if (rec && (a.isPublished || rec.isPublished)) {
        const presentGrades = (a.records || []).filter((r) => !r.isAbsent && r.grade != null).map((r) => r.grade);
        const classAvg = presentGrades.length > 0 ? (presentGrades.reduce((x, y) => x + y, 0) / presentGrades.length).toFixed(2) : '--';
        const maxGrade = presentGrades.length > 0 ? Math.max(...presentGrades).toFixed(2) : '--';
        const minGrade = presentGrades.length > 0 ? Math.min(...presentGrades).toFixed(2) : '--';

        results.push({
          assessmentId: a._id,
          subject: a.subject,
          assessmentType: a.assessmentType,
          assessmentDate: a.assessmentDate,
          teacherName: a.teacherUser ? `${a.teacherUser.firstName || ''} ${a.teacherUser.lastName || ''}`.trim() : '',
          maxGrade: a.maxGrade || 20,
          grade: rec.grade,
          isAbsent: rec.isAbsent,
          individualRemark: rec.individualRemark,
          classRemark: a.classRemark,
          classAverage: classAvg,
          classMax: maxGrade,
          classMin: minGrade,
        });
      }
    });

    res.status(200).json({
      studentName: `${req.user.firstNameArabic || req.user.firstName} ${req.user.lastNameArabic || req.user.lastName}`,
      className: student.class?.name || '',
      results,
    });
  } catch (err) {
    console.error('Error fetching student results:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء تحميل كشف النقاط.' });
  }
};

/**
 * 14. Delete Assessment (Admin only)
 */
const deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'الكشف غير موجود.' });
    }

    await Assessment.findByIdAndDelete(req.params.id);

    await logAudit(
      req.user,
      'ASSESSMENT_DELETE',
      req.params.id,
      `حذف كشف نقاط ${assessment.assessmentType} لمادة ${assessment.subject}`
    );

    res.status(200).json({ message: 'تم حذف كشف النقاط بنجاح.' });
  } catch (err) {
    console.error('Error deleting assessment:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء حذف الكشف.' });
  }
};

module.exports = {
  getMyAssignedClassesAndSubjects,
  getTeacherAssessments,
  getAssessmentById,
  saveAssessment,
  submitAssessmentToAdmin,
  getAllAssessments,
  reviewAssessment,
  controlPublishing,
  getAssessmentStatistics,
  exportReportCardPDF,
  exportReportCardExcel,
  getParentChildrenResults,
  getMyResults,
  deleteAssessment,
};
