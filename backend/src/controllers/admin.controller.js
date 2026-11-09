const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const Supervisor = require('../models/supervisor.model');
const Receptionist = require('../models/receptionist.model');
const Class = require('../models/class.model');
const Group = require('../models/group.model');
const Schedule = require('../models/schedule.model');
const { notifyForSchedule } = require('../services/notification.service');
const Payment = require('../models/payment.model');
const excelService = require('../services/excel.service');
const Module = require('../models/module.model');
const AdminDocument = require('../models/document.model');
const Attendance = require('../models/attendance.model');
const Message = require('../models/message.model');
const AdministrativeRequest = require('../models/administrativeRequest.model');
const ExitPass = require('../models/exitPass.model');
const fs = require('fs');
const path = require('path');
const StaffAttendance = require('../models/staffAttendance.model');

const escapeRegex = (string) => {
  if (!string || typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getRowValue = (row, candidateKeys = []) => {
  if (!row || typeof row !== 'object') return '';
  const rowKeys = Object.keys(row);
  for (const candidate of candidateKeys) {
    const candNorm = candidate.toLowerCase().replace(/[\s_\-#]+/g, '');
    for (const key of rowKeys) {
      const keyNorm = key.toLowerCase().replace(/[\s_\-#]+/g, '');
      if (keyNorm === candNorm) {
        const val = row[key];
        return val !== undefined && val !== null ? String(val).trim() : '';
      }
    }
  }
  return '';
};

// Manual Creation of Accounts (Supports ALL roles: admin, school, teacher, student, parent, general_supervisor, pedagogical_supervisor, receptionist)
const createUser = async (req, res, next) => {
  const { email, password, firstName, lastName, role, phoneNumber, details } = req.body;
  const cleanPhone = phoneNumber ? String(phoneNumber).trim().replace(/[\s\-_().]/g, '') : null;
  const username = req.body.username || cleanPhone || (email ? email.split('@')[0] : `${role}_${Date.now()}`);
  const finalEmail = (email && email.includes('@')) ? email.trim() : `${username}@ecole-zitouni.dz`;

  try {
    const userExists = await User.findOne({
      $or: [
        { username },
        { email: finalEmail },
        ...(cleanPhone ? [{ phoneNumber: cleanPhone }] : [])
      ]
    });
    if (userExists) {
      return res.status(400).json({ message: 'يوجد حساب مسجل مسبقاً برقم الهاتف أو المعرف هذا (Compte déjà existant avec ce numéro ou identifiant).' });
    }

    // Enforce business rules for account passwords:
    //  - Parent / Teacher / Supervisor / Receptionist password defaults to phone number if not explicitly set
    //  - Student password defaults to date of birth (YYYY-MM-DD)
    let finalPassword = password;
    if (role === 'parent' || role === 'teacher' || role === 'general_supervisor' || role === 'pedagogical_supervisor' || role === 'receptionist') {
      if (!password && !cleanPhone) {
        return res.status(400).json({ message: `Le numéro de téléphone (ou mot de passe) est requis pour le rôle ${role}` });
      }
      finalPassword = password || String(cleanPhone);
    } else if (role === 'student') {
      const dob = details && details.dateOfBirth;
      if (!password && !dob) {
        return res.status(400).json({ message: 'Date of birth is required for student accounts (used as default password)' });
      }
      finalPassword = password || (dob ? new Date(dob).toISOString().split('T')[0] : 'Zitouni2026!');
    } else if (role === 'admin' || role === 'school') {
      finalPassword = password || String(cleanPhone || 'Admin123!');
    }

    const user = await User.create({
      username,
      email: finalEmail,
      password: finalPassword,
      firstName: firstName || role,
      lastName: lastName || 'Utilisateur',
      role,
      phoneNumber: cleanPhone || phoneNumber,
      isActive: true,
    });

    let profile = null;

    if (role === 'teacher') {
      const parsedSubjects = (details && details.subjects) || [];
      const spec = (details && details.specialization) || parsedSubjects[0] || 'تعليم عام';
      const profStatus = (details && details.professionalStatus) || 'active';
      const bSalary = Number(details?.baseSalary) || 0;
      const hDate = details?.hiringDate ? new Date(details.hiringDate) : null;
      const cStart = details?.contractStartDate ? new Date(details.contractStartDate) : null;
      const cEnd = details?.contractEndDate ? new Date(details.contractEndDate) : null;

      // Update User fields with Article 23 legal data
      user.firstNameArabic = details?.firstNameArabic || '';
      user.lastNameArabic = details?.lastNameArabic || '';
      user.jobTitle = details?.jobTitle || 'أستاذ';
      user.baseSalary = bSalary;
      user.hiringDate = hDate;
      user.contractType = details?.contractType || 'CDI';
      user.contractDuration = details?.contractDuration || '1 سنة';
      user.contractStartDate = cStart;
      user.contractEndDate = cEnd;
      user.professionalStatus = profStatus;
      user.isActive = profStatus === 'active';
      await user.save();

      profile = await Teacher.create({
        user: user._id,
        subjects: parsedSubjects,
        specialization: spec,
        cycle: (details && details.cycle) || 'primary',
        classes: (details && details.classes) || [],
        groups: (details && details.groups) || [],
        assignments: (details && Array.isArray(details.assignments)) ? details.assignments : [],
        hiringDate: hDate,
        contractType: details?.contractType || 'CDI',
        contractDuration: details?.contractDuration || '1 سنة',
        contractStartDate: cStart,
        contractEndDate: cEnd,
        baseSalary: bSalary,
        assignedHours: Number(details?.assignedHours) || 18,
        assignedTasks: details?.assignedTasks || 'تدريس، تنسيق بيداغوجي، متابعة الفروض والامتحانات',
        professionalStatus: profStatus,
        checklist: {
          cv: !!details?.checklist?.cv,
          diploma: !!details?.checklist?.diploma,
          medicalCertificate: !!details?.checklist?.medicalCertificate,
          idPhotos: !!details?.checklist?.idPhotos,
          criminalRecord: !!details?.checklist?.criminalRecord,
          workContract: !!details?.checklist?.workContract,
          experienceCert: !!details?.checklist?.experienceCert,
        },
        auditTrail: [
          {
            action: 'إنشاء ملف أستاذ رسمي وتوثيق بيانات المادة 23',
            details: `تسجيل أستاذ جديد في النظام: ${firstName} ${lastName} مع ربط الأقسام والأفواج وتحديد الوضعية والبيانات التعاقدية`,
            performedBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'إدارة النظام',
            performedByRole: req.user?.role || 'admin',
            timestamp: new Date(),
          },
        ],
      });
      if (details && details.groups && details.groups.length > 0) {
        await Group.updateMany(
          { _id: { $in: details.groups } },
          { $addToSet: { teachers: profile._id } }
        );
      }
    } else if (role === 'parent') {
      const selectedStudentIds = (details && details.children) || [];
      profile = await Parent.create({
        user: user._id,
        profession: (details && details.profession) || '',
        address: (details && details.address) || '',
        children: selectedStudentIds,
      });

      // Link selected students to this parent profile (both ways)
      if (Array.isArray(selectedStudentIds) && selectedStudentIds.length > 0) {
        await Student.updateMany(
          { _id: { $in: selectedStudentIds } },
          { $set: { parent: profile._id } }
        );
      }
    } else if (role === 'student') {
      const parentUser = await User.findById(details.parentId);
      if (!parentUser || parentUser.role !== 'parent') {
        return res.status(404).json({ message: 'Valid Parent ID is required' });
      }
      const parentProfile = await Parent.findOne({ user: parentUser._id });

      profile = await Student.create({
        user: user._id,
        registrationNumber: (details && details.registrationNumber) || `STU-${Date.now().toString().slice(-6)}`,
        class: details.classId || null,
        group: details.groupId || null,
        parent: parentProfile ? parentProfile._id : null,
        dateOfBirth: (details && details.dateOfBirth) || new Date(),
      });

      if (parentProfile) {
        parentProfile.children.push(profile._id);
        await parentProfile.save();
      }
    } else if (role === 'general_supervisor' || role === 'pedagogical_supervisor') {
      profile = await Supervisor.create({
        user: user._id,
        supervisorType: role,
        assignedClasses: (details && details.assignedClasses) || [],
        assignedTeachers: (details && details.assignedTeachers) || [],
        officeLocation: (details && details.officeLocation) || 'Bureau principal',
      });
    } else if (role === 'receptionist') {
      profile = await Receptionist.create({
        user: user._id,
        deskNumber: (details && details.deskNumber) || 'Accueil Principal - Réception',
        workShift: (details && details.workShift) || '07:30 - 16:30',
      });
    }

    res.status(201).json({ message: 'User created successfully', user, profile });
  } catch (error) {
    next(error);
  }
};


// Excel Bulk Import of Students
const bulkImportStudents = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }

    const rows = excelService.parseExcel(req.file.buffer);
    const results = [];

    for (const row of rows) {
      // Expect columns: email, password, firstName, lastName, phoneNumber, registrationNumber, classId, groupId, parentEmail, dateOfBirth
      const { email, password, firstName, lastName, phoneNumber, registrationNumber, classId, groupId, parentEmail, dateOfBirth } = row;

      const userExists = await User.findOne({ email });
      if (userExists) continue;

      // Find or create parent
      let parentUser = await User.findOne({ email: parentEmail });
      let parentProfile;
      if (!parentUser) {
        parentUser = await User.create({
          email: parentEmail,
          password: 'Password123!',
          firstName: 'ParentOf',
          lastName: firstName,
          role: 'parent',
        });
        parentProfile = await Parent.create({ user: parentUser._id });
      } else {
        parentProfile = await Parent.findOne({ user: parentUser._id });
      }

      // Student password must be their date of birth (YYYY-MM-DD) when provided.
      const studentPassword = dateOfBirth
        ? new Date(dateOfBirth).toISOString().split('T')[0]
        : password || 'Zitouni2026!';

      const user = await User.create({
        email,
        password: studentPassword,
        firstName,
        lastName,
        role: 'student',
        phoneNumber,
      });

      const studentProfile = await Student.create({
        user: user._id,
        registrationNumber,
        class: classId,
        group: groupId,
        parent: parentProfile._id,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      });

      parentProfile.children.push(studentProfile._id);
      await parentProfile.save();

      results.push(user);
    }

    res.status(200).json({ message: `Bulk import completed. Imported ${results.length} students.`, results });
  } catch (error) {
    next(error);
  }
};

// Excel Bulk Import of Teachers (Article 23: With automatic linking to classes & groups, manual roles)
const bulkImportTeachers = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'يرجى تحميل ملف Excel' });
    }

    const rows = excelService.parseExcel(req.file.buffer);
    const results = [];
    let linkedClassesCount = 0;
    let linkedGroupsCount = 0;

    // Roles are manually configured / chosen by Admin ("الأدوار تضاف يدويا")
    const allowedRoles = ['teacher', 'general_supervisor', 'pedagogical_supervisor', 'receptionist'];
    const assignedRole = allowedRoles.includes(req.body.role) ? req.body.role : 'teacher';

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      let firstName = getRowValue(row, ['firstName', 'first_name', 'prenom', 'الاسم', 'اسم']);
      let lastName = getRowValue(row, ['lastName', 'last_name', 'nom', 'اللقب', 'لقب']);
      const fullName = getRowValue(row, ['fullName', 'name', 'nom_complet', 'الاسم واللقب', 'الاسم_واللقب', 'الموظف', 'الأستاذ']);

      if ((!firstName || !lastName) && fullName) {
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 1) {
          firstName = parts[0];
          lastName = 'الأستاذ';
        } else {
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        }
      }

      if (!firstName && !lastName) continue;
      if (!firstName) firstName = 'أستاذ';
      if (!lastName) lastName = 'فاضل';

      let phoneNumber = getRowValue(row, ['phoneNumber', 'phone', 'telephone', 'رقم الهاتف', 'الهاتف', 'المحمول', 'رقم_الهاتف']);
      let email = getRowValue(row, ['email', 'mail', 'البريد الإلكتروني', 'البريد', 'الايميل', 'البريد_الإلكتروني']);
      const password = getRowValue(row, ['password', 'mot_de_passe', 'كلمة المرور', 'كلمة_المرور']);

      if (!email) {
        const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '') || `prof${index + 1}`;
        const cleanLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'zitouni';
        email = `${cleanFirst}.${cleanLast}.${Date.now().toString().slice(-4)}@ecole-zitouni.dz`;
      }

      // Article 23 fields
      const subjectsRaw = getRowValue(row, ['subjects', 'subject', 'matiere', 'matieres', 'المادة', 'المواد', 'المادة 1', 'المادة_1']);
      const specialization = getRowValue(row, ['specialization', 'specialite', 'التخصص', 'تخصص']) || subjectsRaw;
      const cycleRaw = getRowValue(row, ['cycle', 'الطور', 'طور']);
      let cycle = 'primary';
      if (cycleRaw) {
        const cLower = cycleRaw.toLowerCase();
        if (cLower.includes('متوسط') || cLower.includes('middle')) cycle = 'middle';
        else if (cLower.includes('ثانوي') || cLower.includes('secondary')) cycle = 'secondary';
        else cycle = 'primary';
      }

      const hiringDateRaw = getRowValue(row, ['hiringDate', 'date_embauche', 'تاريخ التوظيف', 'تاريخ_التوظيف', 'تاريخ الانتداب']);
      let hiringDate = null;
      if (hiringDateRaw) {
        const d = new Date(hiringDateRaw);
        if (!isNaN(d.getTime())) hiringDate = d;
      }

      const contractType = getRowValue(row, ['contractType', 'type_contrat', 'نوع العقد', 'نوع_العقد', 'العقد']) || 'CDI';
      const contractDuration = getRowValue(row, ['contractDuration', 'duree_contrat', 'مدة العقد', 'مدة_العقد']) || '1 سنة';
      const contractStartRaw = getRowValue(row, ['contractStartDate', 'تاريخ بداية العقد', 'تاريخ_بداية_العقد']);
      const contractEndRaw = getRowValue(row, ['contractEndDate', 'تاريخ نهاية العقد', 'تاريخ_نهاية_العقد']);
      let contractStartDate = null;
      let contractEndDate = null;
      if (contractStartRaw) {
        const d = new Date(contractStartRaw);
        if (!isNaN(d.getTime())) contractStartDate = d;
      }
      if (contractEndRaw) {
        const d = new Date(contractEndRaw);
        if (!isNaN(d.getTime())) contractEndDate = d;
      }

      const baseSalaryRaw = getRowValue(row, ['salary', 'baseSalary', 'salaire', 'الراتب', 'الراتب الأساسي', 'الراتب_الأساسي']);
      const baseSalary = Number(baseSalaryRaw) || 0;

      const assignedHoursRaw = getRowValue(row, ['assignedHours', 'hours', 'heures', 'ساعات العمل', 'الساعات المسندة', 'الساعات_المسندة']);
      const assignedHours = Number(assignedHoursRaw) || 18;

      const professionalStatusRaw = getRowValue(row, ['professionalStatus', 'status', 'statut', 'الوضعية', 'الحالة', 'الوضعية الحالية', 'الوضعية_الحالية']);
      let professionalStatus = 'active';
      if (professionalStatusRaw) {
        const sLower = professionalStatusRaw.toLowerCase();
        if (sLower.includes('موقوف') || sLower.includes('suspend')) professionalStatus = 'suspended';
        else if (sLower.includes('مستقيل') || sLower.includes('resign')) professionalStatus = 'resigned';
        else if (sLower.includes('منتهي') || sLower.includes('terminat')) professionalStatus = 'terminated';
      }

      // Automatic Class and Group Linking ("عند رفع الملف للأساتذة ينبغي أن يربط تلقائيا بأقسامه (كلاسته) وأفواجه")
      const classesRaw = getRowValue(row, ['classes', 'class', 'classe', 'القسم', 'الأقسام', 'كلاسته', 'الصف', 'القسم_المسند']);
      const groupsRaw = getRowValue(row, ['groups', 'group', 'groupe', 'الفوج', 'الأفواج', 'أفواجه', 'الفوج_المسند']);

      const parsedSubjects = subjectsRaw
        ? String(subjectsRaw).split(/[,;/+]+/).map((s) => s.trim()).filter(Boolean)
        : (specialization ? [specialization] : []);

      // 1. Resolve / Link Classes
      const matchedClassIds = [];
      if (classesRaw) {
        const classTokens = String(classesRaw).split(/[,;/+]+/).map((s) => s.trim()).filter(Boolean);
        for (const token of classTokens) {
          let foundClass = await Class.findOne({
            name: { $regex: new RegExp(`^${escapeRegex(token)}$`, 'i') },
          });

          if (!foundClass) {
            foundClass = await Class.findOne({
              $or: [
                { name: { $regex: new RegExp(escapeRegex(token), 'i') } },
                { description: { $regex: new RegExp(escapeRegex(token), 'i') } },
              ],
            });
          }

          // If class doesn't exist yet, auto-create it so teacher is directly bound
          if (!foundClass && token.length >= 2) {
            let classLevel = cycle;
            const tLower = token.toLowerCase();
            if (tLower.includes('متوسط') || tLower.includes('am')) classLevel = 'middle';
            else if (tLower.includes('ثانوي') || tLower.includes('as')) classLevel = 'secondary';
            else if (tLower.includes('ابتدائي') || tLower.includes('ap')) classLevel = 'primary';

            foundClass = await Class.create({
              name: token,
              level: classLevel,
              description: `قسم تم إنشاؤه وربطه آلياً للأستاذ ${firstName} ${lastName}`,
            });
          }

          if (foundClass && !matchedClassIds.includes(foundClass._id)) {
            matchedClassIds.push(foundClass._id);
          }
        }
      }

      // 2. Resolve / Link Groups
      const matchedGroupIds = [];
      const groupTokens = groupsRaw
        ? String(groupsRaw).split(/[,;/+]+/).map((s) => s.trim()).filter(Boolean)
        : [];

      if (matchedClassIds.length > 0) {
        for (const cId of matchedClassIds) {
          if (groupTokens.length > 0) {
            for (const gToken of groupTokens) {
              let foundGroup = await Group.findOne({
                class: cId,
                name: { $regex: new RegExp(`^${escapeRegex(gToken)}$`, 'i') },
              });
              if (!foundGroup) {
                foundGroup = await Group.create({
                  name: gToken,
                  class: cId,
                  teachers: [],
                });
              }
              if (foundGroup && !matchedGroupIds.includes(foundGroup._id)) {
                matchedGroupIds.push(foundGroup._id);
              }
            }
          } else {
            // If groups were not explicitly given, attach any existing groups in this class
            const existingClassGroups = await Group.find({ class: cId });
            for (const eg of existingClassGroups) {
              if (!matchedGroupIds.includes(eg._id)) matchedGroupIds.push(eg._id);
            }
          }
        }
      }

      // Find or create User
      let user = await User.findOne({
        $or: [{ email }, ...(phoneNumber ? [{ phoneNumber }] : [])],
      });

      const defaultPassword = phoneNumber ? String(phoneNumber) : (password || 'Zitouni2026!');

      if (!user) {
        user = await User.create({
          email,
          password: defaultPassword,
          firstName,
          lastName,
          role: assignedRole,
          phoneNumber,
          baseSalary,
          hiringDate,
          contractType,
          contractDuration,
          contractStartDate,
          contractEndDate,
          professionalStatus,
          isActive: professionalStatus === 'active',
        });
      } else {
        if (baseSalary) user.baseSalary = baseSalary;
        if (hiringDate) user.hiringDate = hiringDate;
        if (contractType) user.contractType = contractType;
        if (professionalStatus) {
          user.professionalStatus = professionalStatus;
          user.isActive = professionalStatus === 'active';
        }
        await user.save();
      }

      // Find or create Teacher profile
      let teacher = await Teacher.findOne({ user: user._id });
      const auditDetails = `استيراد آلي للملف المهني (المادة 23) وربط تلقائي بـ ${matchedClassIds.length} أقسام و ${matchedGroupIds.length} أفواج`;

      if (!teacher) {
        teacher = await Teacher.create({
          user: user._id,
          subjects: parsedSubjects,
          specialization: specialization || parsedSubjects[0] || 'تعليم عام',
          cycle,
          classes: matchedClassIds,
          groups: matchedGroupIds,
          hiringDate,
          contractType,
          contractDuration,
          contractStartDate,
          contractEndDate,
          baseSalary,
          assignedHours,
          professionalStatus,
          checklist: {
            cv: false,
            diploma: false,
            medicalCertificate: false,
            idPhotos: false,
            criminalRecord: false,
            workContract: false,
            experienceCert: false,
          },
          auditTrail: [
            {
              action: 'إنشاء ملف أستاذ وربط آلي للأقسام والأفواج (المادة 23)',
              details: auditDetails,
              performedBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'الإدارة المدرسية',
              performedByRole: req.user?.role || 'admin',
              timestamp: new Date(),
            },
          ],
        });
      } else {
        // Merge classes and groups seamlessly
        const existingClassStrings = (teacher.classes || []).map((c) => c.toString());
        const newClassStrings = matchedClassIds.map((c) => c.toString());
        const mergedClassIds = Array.from(new Set([...existingClassStrings, ...newClassStrings]));

        const existingGroupStrings = (teacher.groups || []).map((g) => g.toString());
        const newGroupStrings = matchedGroupIds.map((g) => g.toString());
        const mergedGroupIds = Array.from(new Set([...existingGroupStrings, ...newGroupStrings]));

        teacher.classes = mergedClassIds;
        teacher.groups = mergedGroupIds;
        if (parsedSubjects.length > 0) {
          teacher.subjects = Array.from(new Set([...(teacher.subjects || []), ...parsedSubjects]));
        }
        if (specialization) teacher.specialization = specialization;
        if (cycle) teacher.cycle = cycle;
        if (hiringDate) teacher.hiringDate = hiringDate;
        if (contractType) teacher.contractType = contractType;
        if (contractDuration) teacher.contractDuration = contractDuration;
        if (baseSalary) teacher.baseSalary = baseSalary;
        if (assignedHours) teacher.assignedHours = assignedHours;
        if (professionalStatus) teacher.professionalStatus = professionalStatus;

        teacher.auditTrail.push({
          action: 'تحديث بيانات الملف المهني والربط الآلي للأقسام والأفواج',
          details: auditDetails,
          performedBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'الإدارة المدرسية',
          performedByRole: req.user?.role || 'admin',
          timestamp: new Date(),
        });

        await teacher.save();
      }

      // Bidirectional sync: link teacher to Group.teachers
      if (teacher.groups && teacher.groups.length > 0) {
        await Group.updateMany(
          { _id: { $in: teacher.groups } },
          { $addToSet: { teachers: teacher._id } }
        );
      }

      linkedClassesCount += matchedClassIds.length;
      linkedGroupsCount += matchedGroupIds.length;
      results.push({
        _id: teacher._id,
        user: user._id,
        name: `${firstName} ${lastName}`,
        email: user.email,
        phone: user.phoneNumber,
        subjects: teacher.subjects,
        classesCount: teacher.classes?.length || 0,
        groupsCount: teacher.groups?.length || 0,
      });
    }

    res.status(200).json({
      message: `تم استيراد ومعالجة ${results.length} أستاذ بنجاح وربطهم تلقائياً بأقسامهم وأفواجهم وفق المادة 23.`,
      count: results.length,
      linkedClassesTotal: linkedClassesCount,
      linkedGroupsTotal: linkedGroupsCount,
      teachers: results,
    });
  } catch (error) {
    next(error);
  }
};

// Excel Bulk Import of Parents
const bulkImportParents = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }

    const rows = excelService.parseExcel(req.file.buffer);
    const results = [];

    for (const row of rows) {
      // Expect columns: email, password, firstName, lastName, phoneNumber, profession, address
      const { email, password, firstName, lastName, phoneNumber, profession, address } = row;
      if (!email) continue;

      const userExists = await User.findOne({ email });
      if (userExists) continue;

      // Parent password must be their phone number.
      const parentPassword = phoneNumber ? String(phoneNumber) : password || 'Zitouni2026!';

      const user = await User.create({
        email,
        password: parentPassword,
        firstName,
        lastName,
        role: 'parent',
        phoneNumber,
      });

      await Parent.create({
        user: user._id,
        profession: profession || '',
        address: address || '',
      });

      results.push(user);
    }

    res.status(200).json({ message: `Bulk import completed. Imported ${results.length} parents.`, results });
  } catch (error) {
    next(error);
  }
};

// Toggle User account status
const toggleUserStatus = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({ message: `Account status updated successfully to ${user.isActive ? 'Active' : 'Inactive'}`, isActive: user.isActive });
  } catch (error) {
    next(error);
  }
};

// Manage Classes and Groups
const createClass = async (req, res, next) => {
  const { name, description, level, teacherIds, modules } = req.body;
  try {
    const newClass = await Class.create({ name, description, level, modules: Array.isArray(modules) ? modules : [] });

    if (teacherIds && teacherIds.length > 0) {
      await Teacher.updateMany(
        { _id: { $in: teacherIds } },
        { $addToSet: { classes: newClass._id } }
      );
    }

    res.status(201).json(newClass);
  } catch (error) {
    next(error);
  }
};

const createGroup = async (req, res, next) => {
  const { name, classId, capacity, teacherIds, modules } = req.body;
  try {
    const group = await Group.create({
      name,
      class: classId,
      capacity,
      teachers: teacherIds || [],
      modules: Array.isArray(modules) ? modules : [],
    });

    if (teacherIds && teacherIds.length > 0) {
      await Teacher.updateMany(
        { _id: { $in: teacherIds } },
        { $addToSet: { groups: group._id, classes: classId } }
      );
    }

    const populatedGroup = await Group.findById(group._id)
      .populate('class')
      .populate({
        path: 'teachers',
        populate: { path: 'user', select: 'firstName lastName email' }
      });
    res.status(201).json(populatedGroup);
  } catch (error) {
    next(error);
  }
};

// Schedules Manager
const createOrUpdateSchedule = async (req, res, next) => {
  const { type, title, classId, groupId, data } = req.body;
  try {
    const schedule = await Schedule.findOneAndUpdate(
      { type, class: classId, group: groupId },
      { title, data, isActive: true },
      { new: true, upsert: true }
    );

    // Trigger notification
    notifyForSchedule(schedule);

    res.status(200).json(schedule);
  } catch (error) {
    next(error);
  }
};

// Administrative Dashboard Analytics (Art. 5, 20 & requested administrative KPI metrics)
const getDashboardStats = async (req, res, next) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalClasses = await Class.countDocuments();

    // 1. Today's Absences and Lates (Articles 25, 26)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayAbsences, todayLates] = await Promise.all([
      Attendance.countDocuments({
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ['Absent', 'Unexcused'] },
      }),
      Attendance.countDocuments({
        date: { $gte: today, $lt: tomorrow },
        status: 'Late',
      }),
    ]);

    // 2. New Registrations count (Recent 30 days or marked as new/accepted)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newRegistrations = await Student.countDocuments({
      $or: [
        { createdAt: { $gte: thirtyDaysAgo } },
        { registrationDate: { $gte: thirtyDaysAgo } },
        { registrationStatus: 'new' },
      ],
    });

    // 3. Unread messages sent to administration
    const adminUsers = await User.find({ role: { $in: ['admin', 'school', 'general_supervisor'] } }).select('_id');
    const adminIds = adminUsers.map((u) => u._id);
    const unreadAdminMessages = await Message.countDocuments({
      $or: [
        { receiver: { $in: adminIds }, isRead: false },
        { groupType: 'administration', isRead: false },
      ],
    });

    // 4. Received Administrative Requests (Certificates, Justifications, etc.)
    const receivedRequests = await AdministrativeRequest.countDocuments();

    const revenue = await Payment.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const recentPayments = await Payment.find()
      .populate({
        path: 'student',
        populate: { path: 'user' },
      })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      students: totalStudents,
      teachers: totalTeachers,
      classes: totalClasses,
      totalRevenue: revenue.length ? revenue[0].total : 0,
      recentPayments,
      // Comprehensive Key Metrics:
      todayAbsences: todayAbsences || 0,
      todayLates: todayLates || 0,
      newRegistrations: newRegistrations || totalStudents,
      unreadAdminMessages: unreadAdminMessages || 0,
      receivedRequests: receivedRequests || 0,
    });
  } catch (error) {
    next(error);
  }
};

// Official Student Enrollment API (creates student, parent, matricule, national ID, receipt)
const createEnrollment = async (req, res, next) => {
  const {
    firstName,
    lastName,
    firstNameArabic,
    lastNameArabic,
    firstNameFrench,
    lastNameFrench,
    dateOfBirth,
    placeOfBirth,
    gender,
    bloodType,
    classId,
    groupId,
    regime,
    academicYear = '2026-2027',
    tuitionBaseAmount = 15000,
    discountType = 'none',
    discountPercentage = 0,
    discountAmount = 0,
    discountReason = '',
    tuitionAmount,
    paymentMethod = 'نقداً',
    documentsSubmitted = {},
    documentFiles = {},
    documentReferences = {},
    notes = '',
    parentFirstName,
    parentLastName,
    parentPhone,
    parentProfession,
    parentAddress,
    parentEmail,
  } = req.body;

  try {
    if (!firstName || !lastName || !dateOfBirth || !classId) {
      return res.status(400).json({ message: 'بيانات التلميذ والقسم وتاريخ الميلاد إلزامية لإتمام التسجيل.' });
    }
    if (!parentPhone) {
      return res.status(400).json({ message: 'رقم هاتف ولي الأمر إلزامي لإنشاء حسابه.' });
    }

    const cleanParentPhone = String(parentPhone).trim();

    // 1. Find or create parent account (allows multi-child linking under one parent account - Page 14)
    let parentUser = await User.findOne({
      $or: [{ phoneNumber: cleanParentPhone }, { username: cleanParentPhone }]
    });

    let parentProfile = null;
    if (!parentUser) {
      const pUsername = `parent.${cleanParentPhone.slice(-6)}`;
      parentUser = await User.create({
        username: pUsername,
        email: parentEmail || `${pUsername}@ecole-zitouni.dz`,
        password: cleanParentPhone,
        firstName: parentFirstName || 'ولي',
        lastName: parentLastName || lastName,
        role: 'parent',
        phoneNumber: cleanParentPhone,
        isActive: true,
      });

      parentProfile = await Parent.create({
        user: parentUser._id,
        profession: parentProfession || '',
        address: parentAddress || '',
        children: [],
      });
    } else {
      parentProfile = await Parent.findOne({ user: parentUser._id });
      if (!parentProfile) {
        parentProfile = await Parent.create({
          user: parentUser._id,
          profession: parentProfession || '',
          address: parentAddress || '',
          children: [],
        });
      }
    }

    // 2. Create student account
    const formattedDob = new Date(dateOfBirth).toISOString().split('T')[0];
    const timestamp = Date.now().toString().slice(-4);
    const sUsername = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${lastName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${timestamp}`;
    const sEmail = `${sUsername}@ecole-zitouni.dz`;

    const studentUser = await User.create({
      username: sUsername,
      email: sEmail,
      password: formattedDob,
      firstName,
      lastName,
      firstNameArabic: firstNameArabic || firstName,
      lastNameArabic: lastNameArabic || lastName,
      firstNameFrench: firstNameFrench || firstName,
      lastNameFrench: lastNameFrench || lastName,
      role: 'student',
      phoneNumber: cleanParentPhone,
      isActive: true,
    });

    // Check Class capacity & Waitlist (Page 15)
    const targetClass = await Class.findById(classId);
    const existingInClass = await Student.countDocuments({
      class: classId,
      isWaitlisted: { $ne: true },
    });
    const classCapacity = targetClass?.capacity || 30;
    const isWaitlisted = existingInClass >= classCapacity;
    let waitlistRank = 0;
    if (isWaitlisted) {
      const waitlistCount = await Student.countDocuments({ class: classId, isWaitlisted: true });
      waitlistRank = waitlistCount + 1;
    }

    // Calculate tuition and authorized discount (Page 14)
    const baseAmount = Number(tuitionBaseAmount || tuitionAmount) || 15000;
    let discAmount = Number(discountAmount) || 0;
    const discPct = Number(discountPercentage) || 0;
    if (discPct > 0 && !discAmount) {
      discAmount = Math.round((baseAmount * discPct) / 100);
    }
    const finalAmount = Math.max(0, baseAmount - discAmount);

    const countStudents = await Student.countDocuments();
    const matricule = `REG-${academicYear.split('-')[0]}-${String(countStudents + 1).padStart(4, '0')}`;
    const nationalId = `NAT-09-${String(countStudents + 1).padStart(6, '0')}`;
    const receiptNumber = `REC-${academicYear.split('-')[0]}-${String(countStudents + 1).padStart(4, '0')}`;

    // Initial audit log entry (Page 15)
    const auditEntry = {
      action: 'NEW_ENROLLMENT',
      modifiedBy: req.user?._id,
      modifiedByName: req.user ? `${req.user.firstName} ${req.user.lastName} (${req.user.role})` : 'الإدارة',
      timestamp: new Date(),
      details: isWaitlisted
        ? `تسجيل تلميذ جديد في قائمة الانتظار (الرتبة ${waitlistRank}) لامتلاء القسم (${existingInClass}/${classCapacity})`
        : `تسجيل تلميذ جديد في ${targetClass?.name || 'القسم'} بمبلغ ${finalAmount} دج`,
    };

    const studentProfile = await Student.create({
      user: studentUser._id,
      registrationNumber: matricule,
      nationalIdDigitization: nationalId,
      firstNameArabic: firstNameArabic || firstName,
      lastNameArabic: lastNameArabic || lastName,
      firstNameFrench: firstNameFrench || firstName,
      lastNameFrench: lastNameFrench || lastName,
      dateOfBirth: new Date(dateOfBirth),
      placeOfBirth: placeOfBirth || 'الجزائر',
      gender: gender || 'ذكر',
      bloodType: bloodType || 'O+',
      academicYear,
      enrollmentType: 'new',
      class: classId,
      group: groupId || null,
      parent: parentProfile._id,
      regime: regime || 'نصف داخلي',
      tuitionPaid: true,
      tuitionBaseAmount: baseAmount,
      discountType: discountType || 'none',
      discountPercentage: discPct,
      discountAmount: discAmount,
      discountReason: discountReason || '',
      tuitionAmount: finalAmount,
      receiptNumber,
      isWaitlisted,
      waitlistRank,
      registrationStatus: isWaitlisted ? 'waitlist' : 'accepted',
      registrationDate: new Date(),
      documentsSubmitted: {
        birthCertificate: !!documentsSubmitted.birthCertificate || !!documentFiles.birthCertificate,
        photos: !!documentsSubmitted.photos || !!documentFiles.photos,
        medicalCertificate: !!documentsSubmitted.medicalCertificate || !!documentFiles.medicalCertificate,
        vaccinationRecord: !!documentsSubmitted.vaccinationRecord || !!documentFiles.vaccinationRecord,
        schoolCertificate: !!documentsSubmitted.schoolCertificate || !!documentFiles.schoolCertificate,
        signedCharter: !!documentsSubmitted.signedCharter || !!documentFiles.signedCharter,
      },
      documentFiles: {
        birthCertificate: documentFiles.birthCertificate || '',
        photos: documentFiles.photos || '',
        medicalCertificate: documentFiles.medicalCertificate || '',
        vaccinationRecord: documentFiles.vaccinationRecord || '',
        schoolCertificate: documentFiles.schoolCertificate || '',
        signedCharter: documentFiles.signedCharter || '',
      },
      documentReferences: {
        birthCertificate: documentReferences.birthCertificate || '',
        photos: documentReferences.photos || '',
        medicalCertificate: documentReferences.medicalCertificate || '',
        vaccinationRecord: documentReferences.vaccinationRecord || '',
        schoolCertificate: documentReferences.schoolCertificate || '',
        signedCharter: documentReferences.signedCharter || '',
      },
      notes: notes || '',
      auditHistory: [auditEntry],
    });

    parentProfile.children.push(studentProfile._id);
    await parentProfile.save();

    const populatedStudent = await Student.findById(studentProfile._id)
      .populate('user')
      .populate('class')
      .populate('group')
      .populate({
        path: 'parent',
        populate: { path: 'user' },
      });

    res.status(201).json({
      message: isWaitlisted
        ? 'تم تسجيل التلميذ وإدراجه في قائمة الانتظار لامتلاء القسم.'
        : 'تم تسجيل التلميذ بنجاح وتوليد وصل التسجيل والملف الإداري الرسمي.',
      student: populatedStudent,
      receiptNumber,
      isWaitlisted,
      waitlistRank,
    });
  } catch (error) {
    next(error);
  }
};

// Official Student Re-enrollment API (Réinscription d'un ancien élève déjà inscrit - Page 14)
const reEnrollStudent = async (req, res, next) => {
  const {
    studentId,
    targetClassId,
    targetGroupId,
    academicYear = '2026-2027',
    regime = 'نصف داخلي',
    tuitionBaseAmount = 15000,
    discountType = 'none',
    discountPercentage = 0,
    discountAmount = 0,
    discountReason = '',
    documentsSubmitted = {},
    documentFiles = {},
    documentReferences = {},
    registrationStatus = 'accepted',
    notes = '',
  } = req.body;

  try {
    if (!studentId || !targetClassId) {
      return res.status(400).json({ message: 'يرجى تحديد التلميذ والقسم المراد إعادة التسجيل فيه.' });
    }

    const student = await Student.findById(studentId).populate('user').populate('class');
    if (!student) {
      return res.status(404).json({ message: 'التلميذ المراد إعادة تسجيله غير موجود في النظام.' });
    }

    const previousClass = student.class?._id || student.class;
    const previousClassName = student.class?.name || 'القسم السابق';
    const previousYear = student.academicYear || '2025-2026';

    const targetClass = await Class.findById(targetClassId);
    if (!targetClass) {
      return res.status(400).json({ message: 'القسم المراد الانتقال إليه غير صالح.' });
    }

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

    // Discount & Tuition calculation (Page 14)
    const baseAmount = Number(tuitionBaseAmount) || 15000;
    let discAmount = Number(discountAmount) || 0;
    const discPct = Number(discountPercentage) || 0;
    if (discPct > 0 && !discAmount) {
      discAmount = Math.round((baseAmount * discPct) / 100);
    }
    const finalAmount = Math.max(0, baseAmount - discAmount);

    const yearPrefix = academicYear.split('-')[0];
    const receiptNumber = `RE-REC-${yearPrefix}-${String(student.registrationNumber || Date.now()).slice(-4)}`;

    // Prepare audit entry (Page 15: حفظ تاريخ كل تعديل على ملف التسجيل)
    const auditEntry = {
      action: 'RE_ENROLLMENT',
      modifiedBy: req.user?._id,
      modifiedByName: req.user ? `${req.user.firstName} ${req.user.lastName} (${req.user.role})` : 'التلميذ / الإدارة',
      timestamp: new Date(),
      details: isWaitlisted
        ? `إعادة تسجيل للموسم ${academicYear} في قائمة الانتظار (الرتبة ${waitlistRank}) لامتلاء قسم ${targetClass.name}`
        : `إعادة تسجيل ناجحة من ${previousClassName} إلى ${targetClass.name} للموسم ${academicYear} بمبلغ ${finalAmount} دج`,
    };

    // Update student document
    student.enrollmentType = 're-enrollment';
    student.previousClass = previousClass;
    student.previousAcademicYear = previousYear;
    student.academicYear = academicYear;
    student.class = targetClassId;
    student.group = targetGroupId || null;
    student.regime = regime;
    student.tuitionBaseAmount = baseAmount;
    student.discountType = discountType;
    student.discountPercentage = discPct;
    student.discountAmount = discAmount;
    student.discountReason = discountReason;
    student.tuitionAmount = finalAmount;
    student.receiptNumber = receiptNumber;
    student.registrationDate = new Date();
    student.isWaitlisted = isWaitlisted;
    student.waitlistRank = waitlistRank;
    student.registrationStatus = isWaitlisted ? 'waitlist' : (registrationStatus || 'accepted');
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
        ? 'تمت إعادة التسجيل وإدراج التلميذ في قائمة الانتظار لامتلاء القسم.'
        : 'تمت إعادة تسجيل التلميذ بنجاح وتوليد وصل إعادة التسجيل الرسمي.',
      student: populatedStudent,
      receiptNumber,
      isWaitlisted,
      waitlistRank,
    });
  } catch (error) {
    next(error);
  }
};

// Update Enrollment Status (جديد، ناقص، قيد المراجعة، مقبول، مرفوض - Page 14)
const updateEnrollmentStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status, rejectionReason, missingDocumentsNotes } = req.body;

  try {
    const student = await Student.findById(id).populate('user').populate('class');
    if (!student) {
      return res.status(404).json({ message: 'التلميذ غير موجود.' });
    }

    const previousStatus = student.registrationStatus;
    student.registrationStatus = status;
    if (rejectionReason !== undefined) student.rejectionReason = rejectionReason;
    if (missingDocumentsNotes !== undefined) student.missingDocumentsNotes = missingDocumentsNotes;

    // If accepted from waitlist, remove waitlist flag
    if (status === 'accepted' && student.isWaitlisted) {
      student.isWaitlisted = false;
      student.waitlistRank = 0;
    }

    const auditEntry = {
      action: 'STATUS_UPDATED',
      modifiedBy: req.user?._id,
      modifiedByName: req.user ? `${req.user.firstName} ${req.user.lastName} (${req.user.role})` : 'الإدارة',
      timestamp: new Date(),
      details: `تحديث حالة ملف التسجيل من (${previousStatus}) إلى (${status})${rejectionReason ? ` - سبب الرفض: ${rejectionReason}` : ''}${missingDocumentsNotes ? ` - ملاحظات النقص: ${missingDocumentsNotes}` : ''}`,
    };

    student.auditHistory.push(auditEntry);
    await student.save();

    const updated = await Student.findById(id)
      .populate('user')
      .populate('class')
      .populate('previousClass')
      .populate('group')
      .populate({
        path: 'parent',
        populate: { path: 'user' },
      });

    res.status(200).json({
      message: 'تم تحديث حالة ملف التسجيل وحفظ تاريخ التعديل بنجاح.',
      student: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Get Waitlisted Students (إعداد قائمة انتظار عند امتلاء الأقسام - Page 15)
const getWaitlist = async (req, res, next) => {
  try {
    const waitlisted = await Student.find({
      $or: [{ isWaitlisted: true }, { registrationStatus: 'waitlist' }]
    })
      .populate('user')
      .populate('class')
      .populate('previousClass')
      .populate('group')
      .populate({
        path: 'parent',
        populate: { path: 'user' },
      })
      .sort({ waitlistRank: 1, updatedAt: -1 });

    res.status(200).json(waitlisted);
  } catch (error) {
    next(error);
  }
};

// Upload Student Registration Document file (Checklist - Page 14)
const uploadStudentDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'يرجى اختيار ملف لرفعه.' });
    }

    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname) || '.pdf';
    const cleanOrig = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
    const uniqueName = `doc_${Date.now()}_${cleanOrig}${ext}`;
    const targetPath = path.join(uploadDir, uniqueName);

    fs.writeFileSync(targetPath, req.file.buffer);

    const fileUrl = `/uploads/documents/${uniqueName}`;
    res.status(200).json({
      url: fileUrl,
      fileName: req.file.originalname,
      message: 'تم رفع الوثيقة بنجاح.',
    });
  } catch (error) {
    next(error);
  }
};

// Get Student Audit History Log (حفظ تاريخ كل تعديل على ملف التسجيل - Page 15)
const getStudentAuditHistory = async (req, res, next) => {
  const { id } = req.params;
  try {
    const student = await Student.findById(id)
      .populate('user', 'firstName lastName')
      .populate('class', 'name')
      .populate('previousClass', 'name');

    if (!student) {
      return res.status(404).json({ message: 'التلميذ غير موجود.' });
    }

    let auditHistory = (student.auditHistory || []).map((entry) => ({
      action: entry.action,
      modifiedBy: entry.modifiedBy,
      modifiedByName: entry.modifiedByName || 'الإدارة المدرسية',
      timestamp: entry.timestamp,
      details: entry.details,
    }));

    // If audit history has no entries yet, supply initial registration entry
    if (auditHistory.length === 0) {
      auditHistory = [
        {
          action: 'NEW_ENROLLMENT',
          modifiedByName: 'إدارة شؤون التلاميذ والتمدرس',
          timestamp: student.createdAt || student.registrationDate || new Date(),
          details: `إنشاء وتفعيل الملف المدرسي الأولي للتلميذ وتخصيص رقم التسجيل ${student.registrationNumber || 'المعتمد'}`,
        },
      ];
    }

    res.status(200).json({
      studentId: student._id,
      studentName: `${student.firstNameArabic || student.user?.firstName || ''} ${student.lastNameArabic || student.user?.lastName || ''}`.trim(),
      registrationNumber: student.registrationNumber,
      className: student.class?.name || '',
      previousClassName: student.previousClass?.name || '',
      academicYear: student.academicYear || '',
      registrationStatus: student.registrationStatus || 'accepted',
      auditHistory,
    });
  } catch (error) {
    next(error);
  }
};

const getClasses = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user && req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user.id });
      filter = { _id: { $in: teacher ? teacher.classes : [] } };
    }
    const classes = await Class.find(filter).sort({ name: 1 });
    res.status(200).json(classes);
  } catch (error) {
    next(error);
  }
};

const getGroups = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user && req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user.id });
      const teacherClasses = teacher?.classes || [];
      const teacherGroups = teacher?.groups || [];
      filter = {
        $or: [
          { _id: { $in: teacherGroups } },
          { class: { $in: teacherClasses } }
        ]
      };
    }
    const groups = await Group.find(filter)
      .populate('class')
      .populate({
        path: 'teachers',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .sort({ name: 1 });
    res.status(200).json(groups);
  } catch (error) {
    next(error);
  }
};

const getParents = async (req, res, next) => {
  try {
    const parents = await User.find({ role: 'parent' }).sort({ lastName: 1, firstName: 1 });
    res.status(200).json(parents);
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ role: 1, lastName: 1, firstName: 1 });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// Get all Students with details
const getStudents = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user && req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user.id });
      const teacherClasses = (teacher?.classes || []).map((c) => (c._id ? c._id.toString() : c.toString()));

      if (req.query.classId) {
        if (!teacherClasses.includes(req.query.classId.toString())) {
          return res.status(200).json([]);
        }
        filter.class = req.query.classId;
      } else {
        filter.class = { $in: teacher?.classes || [] };
      }
    } else if (req.query.classId) {
      filter.class = req.query.classId;
    }

    const students = await Student.find(filter)
      .populate('user', 'firstName lastName firstNameArabic lastNameArabic email phoneNumber isActive role')
      .populate('class', 'name level')
      .populate('group', 'name')
      .populate({
        path: 'parent',
        populate: { path: 'user', select: 'firstName lastName firstNameArabic lastNameArabic email phoneNumber role' }
      })
      .sort({ createdAt: -1 });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayExitPasses = await ExitPass.find({
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['Approved', 'Used'] },
    }).populate('approvedBy', 'firstName lastName');

    const exitPassMap = {};
    todayExitPasses.forEach((pass) => {
      if (pass.student) {
        exitPassMap[pass.student.toString()] = {
          _id: pass._id,
          status: pass.status,
          exitTime: pass.exitTime,
          reason: pass.reason,
          accompaniedBy: pass.accompaniedBy,
          date: pass.date,
          approvedBy: pass.approvedBy,
        };
      }
    });

    const studentsWithExitPass = students.map((s) => {
      const sObj = s.toObject();
      if (exitPassMap[s._id.toString()]) {
        sObj.todayExitPass = exitPassMap[s._id.toString()];
        sObj.isExitAuthorized = sObj.todayExitPass.status === 'Approved';
      } else {
        sObj.todayExitPass = null;
        sObj.isExitAuthorized = false;
      }
      return sObj;
    });

    res.status(200).json(studentsWithExitPass);
  } catch (error) {
    next(error);
  }
};

// Get all Teachers with details
const getTeachers = async (req, res, next) => {
  try {
    const teachers = await Teacher.find()
      .populate('user', 'firstName lastName firstNameArabic lastNameArabic firstNameFrench lastNameFrench email phoneNumber isActive baseSalary hiringDate contractType contractDuration contractStartDate contractEndDate professionalStatus profilePic')
      .populate('classes', 'name level description')
      .populate('groups', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json(teachers);
  } catch (error) {
    next(error);
  }
};

// Update a User account and their role-specific profile
const updateUser = async (req, res, next) => {
  const { userId } = req.params;
  const { email, firstName, lastName, phoneNumber, role, details } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.email = email || user.email;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    if (role) user.role = role;

    // Keep enforced password rules in sync when identifying data changes.
    if (user.role === 'parent' && phoneNumber) {
      user.password = String(phoneNumber);
    } else if (user.role === 'student' && details && details.dateOfBirth) {
      user.password = new Date(details.dateOfBirth).toISOString().split('T')[0];
    }
    await user.save();

    if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: user._id });
      if (teacher && details) {
        const oldGroups = teacher.groups || [];
        if (details.subjects) teacher.subjects = details.subjects;
        if (details.specialization) teacher.specialization = details.specialization;
        if (details.cycle) teacher.cycle = details.cycle;
        if (details.classes) teacher.classes = details.classes;
        if (details.groups) teacher.groups = details.groups;
        if (Array.isArray(details.assignments)) teacher.assignments = details.assignments;
        if (details.hiringDate !== undefined) teacher.hiringDate = details.hiringDate ? new Date(details.hiringDate) : null;
        if (details.contractType) teacher.contractType = details.contractType;
        if (details.contractDuration) teacher.contractDuration = details.contractDuration;
        if (details.contractStartDate !== undefined) teacher.contractStartDate = details.contractStartDate ? new Date(details.contractStartDate) : null;
        if (details.contractEndDate !== undefined) teacher.contractEndDate = details.contractEndDate ? new Date(details.contractEndDate) : null;
        if (details.baseSalary !== undefined) teacher.baseSalary = Number(details.baseSalary) || 0;
        if (details.assignedHours !== undefined) teacher.assignedHours = Number(details.assignedHours) || 18;
        if (details.assignedTasks) teacher.assignedTasks = details.assignedTasks;
        if (details.professionalStatus) teacher.professionalStatus = details.professionalStatus;
        if (details.checklist) {
          teacher.checklist = { ...teacher.checklist, ...details.checklist };
        }
        await teacher.save();

        // Update user fields
        if (details.firstNameArabic) user.firstNameArabic = details.firstNameArabic;
        if (details.lastNameArabic) user.lastNameArabic = details.lastNameArabic;
        if (details.jobTitle) user.jobTitle = details.jobTitle;
        if (details.baseSalary !== undefined) user.baseSalary = Number(details.baseSalary) || 0;
        if (details.hiringDate !== undefined) user.hiringDate = details.hiringDate ? new Date(details.hiringDate) : null;
        if (details.contractType) user.contractType = details.contractType;
        if (details.professionalStatus) {
          user.professionalStatus = details.professionalStatus;
          user.isActive = details.professionalStatus === 'active';
        }
        await user.save();

        // Bidirectional sync for Group.teachers on update
        const removedGroups = oldGroups.filter(g => !details.groups.includes(g.toString()));
        if (removedGroups.length > 0) {
          await Group.updateMany(
            { _id: { $in: removedGroups } },
            { $pull: { teachers: teacher._id } }
          );
        }
        const addedGroups = (details.groups || []).filter(g => !oldGroups.map(og => og.toString()).includes(g.toString()));
        if (addedGroups.length > 0) {
          await Group.updateMany(
            { _id: { $in: addedGroups } },
            { $addToSet: { teachers: teacher._id } }
          );
        }
      }
    } else if (user.role === 'student') {
      const student = await Student.findOne({ user: user._id });
      if (student && details) {
        student.registrationNumber = details.registrationNumber || student.registrationNumber;
        student.class = details.classId || student.class;
        student.group = details.groupId || student.group;
        student.dateOfBirth = details.dateOfBirth || student.dateOfBirth;

        if (details.parentId && details.parentId !== student.parent?.toString()) {
          const oldParent = await Parent.findById(student.parent);
          if (oldParent) {
            oldParent.children = oldParent.children.filter(cid => cid.toString() !== student._id.toString());
            await oldParent.save();
          }

          const newParentUser = await User.findById(details.parentId);
          if (newParentUser) {
            const newParentProfile = await Parent.findOne({ user: newParentUser._id });
            if (newParentProfile) {
              student.parent = newParentProfile._id;
              newParentProfile.children.push(student._id);
              await newParentProfile.save();
            }
          }
        }
        await student.save();
      }
    } else if (user.role === 'parent') {
      const parent = await Parent.findOne({ user: user._id });
      if (parent && details) {
        parent.profession = details.profession || parent.profession;
        parent.address = details.address || parent.address;
        await parent.save();
      }
    } else if (user.role === 'general_supervisor' || user.role === 'pedagogical_supervisor') {
      const supervisor = await Supervisor.findOne({ user: user._id });
      if (supervisor && details) {
        if (details.officeLocation) supervisor.officeLocation = details.officeLocation;
        if (details.assignedClasses) supervisor.assignedClasses = details.assignedClasses;
        if (details.assignedTeachers) supervisor.assignedTeachers = details.assignedTeachers;
        await supervisor.save();
      }
    } else if (user.role === 'receptionist') {
      const receptionist = await Receptionist.findOne({ user: user._id });
      if (receptionist && details) {
        if (details.deskNumber) receptionist.deskNumber = details.deskNumber;
        if (details.workShift) receptionist.workShift = details.workShift;
        await receptionist.save();
      }
    }

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// Delete a User and their role-specific profile (cascade)
const deleteUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'teacher') {
      const teacher = await Teacher.findOneAndDelete({ user: user._id });
      if (teacher) {
        await Group.updateMany(
          { teachers: teacher._id },
          { $pull: { teachers: teacher._id } }
        );
      }
    } else if (user.role === 'student') {
      const student = await Student.findOneAndDelete({ user: user._id });
      if (student) {
        const parent = await Parent.findById(student.parent);
        if (parent) {
          parent.children = parent.children.filter(cid => cid.toString() !== student._id.toString());
          await parent.save();
        }
      }
    } else if (user.role === 'parent') {
      const parent = await Parent.findOneAndDelete({ user: user._id });
      if (parent) {
        await Student.updateMany({ parent: parent._id }, { $unset: { parent: 1 } });
      }
    } else if (user.role === 'general_supervisor' || user.role === 'pedagogical_supervisor') {
      await Supervisor.findOneAndDelete({ user: user._id });
    } else if (user.role === 'receptionist') {
      await Receptionist.findOneAndDelete({ user: user._id });
    }

    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: 'User and profile deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Create a new Payment/Invoice record
const createPayment = async (req, res, next) => {
  const { studentId, amount, type, status } = req.body;

  try {
    const student = await Student.findById(studentId).populate('parent');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.parent) {
      return res.status(400).json({ message: 'Selected student has no linked parent profile' });
    }

    const payment = await Payment.create({
      parent: student.parent._id,
      student: student._id,
      amount,
      type,
      status: status || 'Pending',
    });

    res.status(201).json({ message: 'Billing record created successfully', payment });
  } catch (error) {
    next(error);
  }
};

// Get all schedules populated with details
const getSchedules = async (req, res, next) => {
  try {
    const schedules = await Schedule.find()
      .populate('class', 'name level')
      .populate('group', 'name')
      .sort({ type: 1, title: 1 });
    res.status(200).json(schedules);
  } catch (error) {
    next(error);
  }
};

// Delete a schedule
const deleteSchedule = async (req, res, next) => {
  const { scheduleId } = req.params;
  try {
    const schedule = await Schedule.findByIdAndDelete(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.status(200).json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ===== Excel Export Helpers =====

// Streams a generated workbook back to the client as a downloadable .xlsx file
const sendExcel = (res, rows, sheetName, fileName) => {
  const buffer = excelService.generateExcel(rows, sheetName);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(buffer);
};

const formatDate = (value) => (value ? new Date(value).toISOString().split('T')[0] : '');

// Export all Students to Excel
const exportStudents = async (req, res, next) => {
  try {
    const students = await Student.find()
      .populate('user', 'firstName lastName firstNameArabic lastNameArabic email phoneNumber isActive role')
      .populate('class', 'name')
      .populate('group', 'name')
      .populate({ path: 'parent', populate: { path: 'user', select: 'firstName lastName firstNameArabic lastNameArabic email phoneNumber role' } })
      .sort({ createdAt: -1 });

    const rows = students.map((s) => ({
      'Registration Number': s.registrationNumber || '',
      'First Name': s.user?.firstName || '',
      'Last Name': s.user?.lastName || '',
      Email: s.user?.email || '',
      Phone: s.user?.phoneNumber || '',
      Class: s.class?.name || '',
      Group: s.group?.name || '',
      'Date of Birth': formatDate(s.dateOfBirth),
      Parent: s.parent?.user ? `${s.parent.user.firstName} ${s.parent.user.lastName}` : '',
      'Parent Email': s.parent?.user?.email || '',
      'Parent Phone': s.parent?.user?.phoneNumber || '',
      Status: s.user?.isActive ? 'Active' : 'Inactive',
    }));

    sendExcel(res, rows, 'Students', 'students.xlsx');
  } catch (error) {
    next(error);
  }
};

// Export all Teachers to Excel (Article 23: Complete Professional & Pedagogical Details)
const exportTeachers = async (req, res, next) => {
  try {
    const teachers = await Teacher.find()
      .populate('user', 'firstName lastName firstNameArabic lastNameArabic email phoneNumber isActive baseSalary hiringDate contractType')
      .populate('classes', 'name')
      .populate('groups', 'name')
      .sort({ createdAt: -1 });

    const rows = teachers.map((t) => ({
      'الاسم': t.user?.firstName || '',
      'اللقب': t.user?.lastName || '',
      'الاسم بالعربية': t.user?.firstNameArabic || '',
      'اللقب بالعربية': t.user?.lastNameArabic || '',
      'البريد الإلكتروني': t.user?.email || '',
      'رقم الهاتف': t.user?.phoneNumber || '',
      'المواد': (t.subjects || []).join(', '),
      'التخصص': t.specialization || (t.subjects || [])[0] || '',
      'الطور': t.cycle || '',
      'الأقسام المسندة': (t.classes || []).map((c) => c.name).join(', '),
      'الأفواج المسندة': (t.groups || []).map((g) => g.name).join(', '),
      'نوع العقد': t.contractType || t.user?.contractType || 'CDI',
      'مدة العقد': t.contractDuration || '1 سنة',
      'تاريخ التوظيف': t.hiringDate ? new Date(t.hiringDate).toISOString().split('T')[0] : (t.user?.hiringDate ? new Date(t.user.hiringDate).toISOString().split('T')[0] : ''),
      'الراتب الأساسي': t.baseSalary || t.user?.baseSalary || 0,
      'الساعات المسندة': t.assignedHours || 18,
      'الوضعية المهنية': t.professionalStatus || (t.user?.isActive ? 'نشط' : 'غير نشط'),
    }));

    sendExcel(res, rows, 'الأساتذة والموظفون', 'teachers_staff_article23.xlsx');
  } catch (error) {
    next(error);
  }
};

// Export all Parents to Excel
const exportParents = async (req, res, next) => {
  try {
    const parents = await Parent.find()
      .populate('user', 'firstName lastName email phoneNumber isActive')
      .populate({ path: 'children', populate: { path: 'user', select: 'firstName lastName' } })
      .sort({ createdAt: -1 });

    const rows = parents.map((p) => ({
      'First Name': p.user?.firstName || '',
      'Last Name': p.user?.lastName || '',
      Email: p.user?.email || '',
      Phone: p.user?.phoneNumber || '',
      Profession: p.profession || '',
      Address: p.address || '',
      Children: (p.children || [])
        .map((c) => (c.user ? `${c.user.firstName} ${c.user.lastName}` : ''))
        .filter(Boolean)
        .join(', '),
      Status: p.user?.isActive ? 'Active' : 'Inactive',
    }));

    sendExcel(res, rows, 'Parents', 'parents.xlsx');
  } catch (error) {
    next(error);
  }
};

// Export all Payments/Invoices to Excel
const exportPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate({ path: 'student', populate: { path: 'user', select: 'firstName lastName' } })
      .populate({ path: 'parent', populate: { path: 'user', select: 'firstName lastName' } })
      .sort({ createdAt: -1 });

    const rows = payments.map((p) => ({
      Student: p.student?.user ? `${p.student.user.firstName} ${p.student.user.lastName}` : '',
      Parent: p.parent?.user ? `${p.parent.user.firstName} ${p.parent.user.lastName}` : '',
      Amount: p.amount,
      Currency: p.currency || 'DZD',
      Type: p.type,
      Status: p.status,
      Method: p.paymentMethod || '',
      'Transaction ID': p.transactionId || '',
      'Paid At': formatDate(p.paidAt),
      'Created At': formatDate(p.createdAt),
    }));

    sendExcel(res, rows, 'Payments', 'payments.xlsx');
  } catch (error) {
    next(error);
  }
};

// ===== Classes: Update & Delete =====
const updateClass = async (req, res, next) => {
  const { classId } = req.params;
  const { name, description, level, modules } = req.body;
  try {
    const updated = await Class.findByIdAndUpdate(
      classId,
      { ...(name !== undefined && { name }), ...(description !== undefined && { description }), ...(level !== undefined && { level }), ...(Array.isArray(modules) && { modules }) },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  const { classId } = req.params;
  try {
    const groupCount = await Group.countDocuments({ class: classId });
    if (groupCount > 0) {
      return res.status(400).json({ message: 'Cannot delete a class that still contains groups. Delete its groups first.' });
    }
    const studentCount = await Student.countDocuments({ class: classId });
    if (studentCount > 0) {
      return res.status(400).json({ message: 'Cannot delete a class that still has students assigned.' });
    }
    const deleted = await Class.findByIdAndDelete(classId);
    if (!deleted) {
      return res.status(404).json({ message: 'Class not found' });
    }
    await Teacher.updateMany({ classes: classId }, { $pull: { classes: classId } });
    res.status(200).json({ message: 'Class deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ===== Groups: Update & Delete =====
const updateGroup = async (req, res, next) => {
  const { groupId } = req.params;
  const { name, classId, capacity, teacherIds } = req.body;
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (name !== undefined) group.name = name;
    if (classId !== undefined) group.class = classId;
    if (capacity !== undefined) group.capacity = capacity;
    if (Array.isArray(req.body.modules)) group.modules = req.body.modules;
    if (Array.isArray(teacherIds)) {
      const oldTeachers = group.teachers.map((t) => t.toString());
      group.teachers = teacherIds;
      const removed = oldTeachers.filter((t) => !teacherIds.includes(t));
      if (removed.length > 0) {
        await Teacher.updateMany({ _id: { $in: removed } }, { $pull: { groups: group._id } });
      }
      if (teacherIds.length > 0) {
        await Teacher.updateMany({ _id: { $in: teacherIds } }, { $addToSet: { groups: group._id, classes: group.class } });
      }
    }
    await group.save();
    const populated = await Group.findById(group._id)
      .populate('class')
      .populate({ path: 'teachers', populate: { path: 'user', select: 'firstName lastName email' } });
    res.status(200).json(populated);
  } catch (error) {
    next(error);
  }
};

const deleteGroup = async (req, res, next) => {
  const { groupId } = req.params;
  try {
    const studentCount = await Student.countDocuments({ group: groupId });
    if (studentCount > 0) {
      return res.status(400).json({ message: 'Cannot delete a group that still has students assigned.' });
    }
    const group = await Group.findByIdAndDelete(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    await Teacher.updateMany({ groups: groupId }, { $pull: { groups: groupId } });
    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ===== Modules (School subjects) CRUD =====
const getModules = async (req, res, next) => {
  try {
    const modules = await Module.find().sort({ name: 1 });
    res.status(200).json(modules);
  } catch (error) {
    next(error);
  }
};

const createModule = async (req, res, next) => {
  const { name, description, coefficient } = req.body;
  try {
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Module name is required' });
    }
    const exists = await Module.findOne({ name: name.trim() });
    if (exists) {
      return res.status(400).json({ message: 'A module with this name already exists' });
    }
    const created = await Module.create({ name: name.trim(), description: description || '', coefficient: coefficient || 1 });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

const updateModule = async (req, res, next) => {
  const { moduleId } = req.params;
  const { name, description, coefficient } = req.body;
  try {
    const updated = await Module.findByIdAndUpdate(
      moduleId,
      {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(coefficient !== undefined && { coefficient }),
      },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Module not found' });
    }
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteModule = async (req, res, next) => {
  const { moduleId } = req.params;
  try {
    const deleted = await Module.findByIdAndDelete(moduleId);
    if (!deleted) {
      return res.status(404).json({ message: 'Module not found' });
    }
    res.status(200).json({ message: 'Module deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ===== Administrative documents (teacher contract / parent regulations / general administrative PDFs) =====
const DOCUMENTS_DIR = path.join(__dirname, '../../uploads/documents');

const uploadDocument = async (req, res, next) => {
  const { title, category, description, isPublished, type } = req.body;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'يرجى اختيار ملف PDF صالح' });
    }
    const isPdf =
      req.file.mimetype === 'application/pdf' ||
      (req.file.originalname && req.file.originalname.toLowerCase().endsWith('.pdf'));
    if (!isPdf) {
      return res.status(400).json({ message: 'الملفات المسموح برفعها هي ملفات PDF فقط' });
    }

    // Ensure the storage directory exists
    fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });

    const timestamp = Date.now();
    const cleanOrigName = (req.file.originalname || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeType = type && ['teacher_contract', 'parent_regulations'].includes(type) ? type : `doc_${timestamp}`;
    const fileName = `${safeType}_${timestamp}_${cleanOrigName}`;
    const filePath = path.join(DOCUMENTS_DIR, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const fileUrl = `/uploads/documents/${fileName}`;

    let docTitle = title;
    if (!docTitle) {
      if (type === 'teacher_contract') docTitle = 'عقد العمل (للأساتذة)';
      else if (type === 'parent_regulations') docTitle = 'القانون الداخلي (للأولياء)';
      else docTitle = req.file.originalname.replace(/\.[^/.]+$/, '') || 'مستند إداري جديد';
    }

    let docCategory = category;
    if (!docCategory) {
      if (type === 'teacher_contract') docCategory = 'teachers';
      else if (type === 'parent_regulations') docCategory = 'parents';
      else docCategory = 'all';
    }

    let doc;
    if (type && ['teacher_contract', 'parent_regulations'].includes(type)) {
      doc = await AdminDocument.findOneAndUpdate(
        { type },
        {
          title: docTitle,
          category: docCategory,
          description: description || '',
          fileName,
          originalName: req.file.originalname || fileName,
          fileUrl,
          fileSize: req.file.size || 0,
          isPublished: isPublished !== undefined ? isPublished === 'true' || isPublished === true : true,
          uploadedBy: req.user.id,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } else {
      doc = await AdminDocument.create({
        title: docTitle,
        category: docCategory,
        description: description || '',
        type: safeType,
        fileName,
        originalName: req.file.originalname || fileName,
        fileUrl,
        fileSize: req.file.size || 0,
        isPublished: isPublished !== undefined ? isPublished === 'true' || isPublished === true : true,
        uploadedBy: req.user.id,
      });
    }

    res.status(200).json({ message: 'تم حفظ ورفع المستند بنجاح', document: doc });
  } catch (error) {
    next(error);
  }
};

const updateDocument = async (req, res, next) => {
  const { id } = req.params;
  const { title, category, description, isPublished } = req.body;
  try {
    const doc = await AdminDocument.findById(id);
    if (!doc) {
      return res.status(404).json({ message: 'المستند غير موجود' });
    }

    if (title) doc.title = title.trim();
    if (category) doc.category = category;
    if (description !== undefined) doc.description = description.trim();
    if (isPublished !== undefined) {
      doc.isPublished = isPublished === 'true' || isPublished === true;
    }

    // Optional replacement file
    if (req.file) {
      const isPdf =
        req.file.mimetype === 'application/pdf' ||
        (req.file.originalname && req.file.originalname.toLowerCase().endsWith('.pdf'));
      if (!isPdf) {
        return res.status(400).json({ message: 'الملفات المسموح برفعها هي ملفات PDF فقط' });
      }

      fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });

      const timestamp = Date.now();
      const cleanOrigName = (req.file.originalname || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${doc.type || 'doc'}_${timestamp}_${cleanOrigName}`;
      const filePath = path.join(DOCUMENTS_DIR, fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      if (doc.fileName && doc.fileName !== fileName) {
        try {
          const oldFilePath = path.join(DOCUMENTS_DIR, doc.fileName);
          if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
        } catch (e) {
          console.warn('Could not remove previous file:', e.message);
        }
      }

      doc.fileName = fileName;
      doc.originalName = req.file.originalname || fileName;
      doc.fileUrl = `/uploads/documents/${fileName}`;
      doc.fileSize = req.file.size || 0;
    }

    doc.uploadedBy = req.user.id;
    await doc.save();

    res.status(200).json({ message: 'تم تحديث المستند بنجاح', document: doc });
  } catch (error) {
    next(error);
  }
};

const deleteDocument = async (req, res, next) => {
  const { id } = req.params;
  try {
    const doc = await AdminDocument.findById(id);
    if (!doc) {
      return res.status(404).json({ message: 'المستند غير موجود' });
    }

    // Try deleting physical file
    if (doc.fileName) {
      try {
        const filePath = path.join(DOCUMENTS_DIR, doc.fileName);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Could not remove file on delete:', e.message);
      }
    }

    await AdminDocument.findByIdAndDelete(id);

    res.status(200).json({ message: 'تم حذف المستند بنجاح' });
  } catch (error) {
    next(error);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const docs = await AdminDocument.find()
      .populate('uploadedBy', 'firstName lastName role')
      .sort({ createdAt: -1 });

    const enrichedDocs = docs.map((doc) => {
      const obj = doc.toObject();
      if (!obj.title) {
        if (obj.type === 'teacher_contract') obj.title = 'عقد العمل (للأساتذة)';
        else if (obj.type === 'parent_regulations') obj.title = 'القانون الداخلي (للأولياء)';
        else obj.title = obj.originalName || 'مستند إداري';
      }
      if (!obj.category) {
        if (obj.type === 'teacher_contract') obj.category = 'teachers';
        else if (obj.type === 'parent_regulations') obj.category = 'parents';
        else obj.category = 'all';
      }
      return obj;
    });

    res.status(200).json(enrichedDocs);
  } catch (error) {
    next(error);
  }
};

// ===== Article 23: Staff and Teacher Professional Dossiers (المادة 23: الملف المهني) =====

// 1. Get Teacher Dossier (Article 23: 15 Core Elements + Absences & Lates + Audit Trail)
const getTeacherDossier = async (req, res, next) => {
  const { id } = req.params;
  try {
    let teacher = await Teacher.findById(id)
      .populate('user', 'firstName lastName firstNameArabic lastNameArabic firstNameFrench lastNameFrench email phoneNumber baseSalary isActive jobTitle hiringDate contractType contractDuration contractStartDate contractEndDate professionalStatus profilePic')
      .populate('classes', 'name level description')
      .populate('groups', 'name class');

    if (!teacher) {
      teacher = await Teacher.findOne({ user: id })
        .populate('user', 'firstName lastName firstNameArabic lastNameArabic firstNameFrench lastNameFrench email phoneNumber baseSalary isActive jobTitle hiringDate contractType contractDuration contractStartDate contractEndDate professionalStatus profilePic')
        .populate('classes', 'name level description')
        .populate('groups', 'name class');
    }

    if (!teacher) {
      const userDoc = await User.findById(id);
      if (userDoc && ['general_supervisor', 'pedagogical_supervisor', 'receptionist', 'admin', 'school', 'teacher'].includes(userDoc.role)) {
        const createdTeacher = await Teacher.create({
          user: userDoc._id,
          subjects: [userDoc.jobTitle || userDoc.role],
          specialization: userDoc.jobTitle || (userDoc.role === 'general_supervisor' ? 'إشراف عام' : userDoc.role === 'pedagogical_supervisor' ? 'إشراف تربوي' : userDoc.role === 'receptionist' ? 'استقبال وتوجيه' : 'إدارة ومتابعة'),
          cycle: 'all',
          classes: [],
          groups: [],
          hiringDate: userDoc.hiringDate || null,
          contractType: userDoc.contractType || 'CDI',
          contractDuration: userDoc.contractDuration || '1 سنة',
          baseSalary: userDoc.baseSalary || 0,
          assignedHours: 40,
          assignedTasks: 'مهام الإدارة والتأطير المدرسي وفق المادة 23',
          professionalStatus: userDoc.professionalStatus || 'active',
          auditTrail: [
            {
              action: 'إنشاء وتفعيل الملف المهني للموظف (المادة 23)',
              details: `إنشاء الملف المهني للموظف الإداري: ${userDoc.firstName} ${userDoc.lastName}`,
              performedBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'الإدارة المدرسية',
              performedByRole: req.user?.role || 'admin',
              timestamp: new Date(),
            },
          ],
        });
        teacher = await Teacher.findById(createdTeacher._id)
          .populate('user', 'firstName lastName firstNameArabic lastNameArabic firstNameFrench lastNameFrench email phoneNumber baseSalary isActive jobTitle hiringDate contractType contractDuration contractStartDate contractEndDate professionalStatus profilePic')
          .populate('classes', 'name level description')
          .populate('groups', 'name class');
      }
    }

    if (!teacher) {
      return res.status(404).json({ message: 'الملف المهني غير موجود' });
    }

    // Absences and Lates Tracking (Article 23, Element 12)
    let attendanceStats = {
      totalRecords: 0,
      totalAbsences: 0,
      totalExcused: 0,
      totalLates: 0,
      totalDeductions: 0,
      recent: [],
    };

    if (teacher.user?._id) {
      const records = await StaffAttendance.find({ staffUser: teacher.user._id }).sort({ date: -1 });
      attendanceStats.totalRecords = records.length;
      attendanceStats.totalAbsences = records.filter((r) => r.status === 'Absent').length;
      attendanceStats.totalExcused = records.filter((r) => r.status === 'Excused').length;
      attendanceStats.totalLates = records.filter((r) => r.status === 'Late').length;
      attendanceStats.totalDeductions = records.reduce((acc, curr) => acc + (curr.deductionAmount || 0), 0);
      attendanceStats.recent = records.slice(0, 15);
    }

    res.status(200).json({
      dossier: teacher,
      attendanceStats,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Update Teacher Dossier (Article 23: Administrative & Contractual Details + Audit Log)
const updateTeacherDossier = async (req, res, next) => {
  const { id } = req.params;
  const {
    specialization,
    cycle,
    hiringDate,
    contractType,
    contractDuration,
    contractStartDate,
    contractEndDate,
    baseSalary,
    assignedHours,
    assignedTasks,
    professionalStatus,
    classes,
    groups,
    checklist,
    firstName,
    lastName,
    firstNameArabic,
    lastNameArabic,
    phoneNumber,
    email,
  } = req.body;

  try {
    let teacher = await Teacher.findById(id).populate('user');
    if (!teacher) {
      teacher = await Teacher.findOne({ user: id }).populate('user');
    }
    if (!teacher) {
      return res.status(404).json({ message: 'الملف المهني غير موجود' });
    }

    const modifiedChanges = [];

    // Sync User Identity & Contact
    if (teacher.user) {
      const user = await User.findById(teacher.user._id);
      if (user) {
        if (firstName && user.firstName !== firstName) {
          modifiedChanges.push(`الاسم: ${user.firstName} -> ${firstName}`);
          user.firstName = firstName;
        }
        if (lastName && user.lastName !== lastName) {
          modifiedChanges.push(`اللقب: ${user.lastName} -> ${lastName}`);
          user.lastName = lastName;
        }
        if (firstNameArabic !== undefined) user.firstNameArabic = firstNameArabic;
        if (lastNameArabic !== undefined) user.lastNameArabic = lastNameArabic;
        if (phoneNumber && user.phoneNumber !== phoneNumber) {
          modifiedChanges.push(`الهاتف: ${user.phoneNumber} -> ${phoneNumber}`);
          user.phoneNumber = phoneNumber;
        }
        if (email && user.email !== email) {
          modifiedChanges.push(`البريد: ${user.email} -> ${email}`);
          user.email = email;
        }
        if (baseSalary !== undefined && user.baseSalary !== Number(baseSalary)) {
          modifiedChanges.push(`الراتب الأساسي: ${user.baseSalary} -> ${baseSalary} دج`);
          user.baseSalary = Number(baseSalary);
        }
        if (professionalStatus) {
          user.professionalStatus = professionalStatus;
          user.isActive = professionalStatus === 'active';
        }
        await user.save();
      }
    }

    // Update Teacher Contractual & Pedagogical Info
    if (specialization !== undefined) teacher.specialization = specialization;
    if (cycle !== undefined) teacher.cycle = cycle;
    if (hiringDate !== undefined) teacher.hiringDate = hiringDate ? new Date(hiringDate) : null;
    if (contractType !== undefined) teacher.contractType = contractType;
    if (contractDuration !== undefined) teacher.contractDuration = contractDuration;
    if (contractStartDate !== undefined) teacher.contractStartDate = contractStartDate ? new Date(contractStartDate) : null;
    if (contractEndDate !== undefined) teacher.contractEndDate = contractEndDate ? new Date(contractEndDate) : null;
    if (baseSalary !== undefined) teacher.baseSalary = Number(baseSalary);
    if (assignedHours !== undefined) teacher.assignedHours = Number(assignedHours);
    if (assignedTasks !== undefined) teacher.assignedTasks = assignedTasks;
    if (checklist) teacher.checklist = { ...teacher.checklist, ...checklist };

    if (professionalStatus && teacher.professionalStatus !== professionalStatus) {
      modifiedChanges.push(`الوضعية المهنية: ${teacher.professionalStatus} -> ${professionalStatus}`);
      teacher.professionalStatus = professionalStatus;
    }

    if (classes && Array.isArray(classes)) {
      teacher.classes = classes;
    }

    if (groups && Array.isArray(groups)) {
      const oldGroups = (teacher.groups || []).map((g) => g.toString());
      teacher.groups = groups;

      // Bidirectional sync
      const removed = oldGroups.filter((g) => !groups.includes(g));
      if (removed.length > 0) {
        await Group.updateMany({ _id: { $in: removed } }, { $pull: { teachers: teacher._id } });
      }
      const added = groups.filter((g) => !oldGroups.includes(g));
      if (added.length > 0) {
        await Group.updateMany({ _id: { $in: added } }, { $addToSet: { teachers: teacher._id } });
      }
    }

    // Administrative Audit Trail (Article 23, Element 15)
    teacher.auditTrail.push({
      action: 'تحديث بيانات الملف المهني',
      details: modifiedChanges.length ? modifiedChanges.join(' | ') : 'تحديث البيانات الإدارية والتعاقدية للملف المهني',
      performedBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'الإدارة',
      performedByRole: req.user?.role || 'admin',
      timestamp: new Date(),
    });

    await teacher.save();

    const updated = await Teacher.findById(teacher._id)
      .populate('user', 'firstName lastName firstNameArabic lastNameArabic firstNameFrench lastNameFrench email phoneNumber baseSalary isActive jobTitle hiringDate contractType contractDuration contractStartDate contractEndDate professionalStatus profilePic')
      .populate('classes', 'name level description')
      .populate('groups', 'name class');

    res.status(200).json({
      message: 'تم حفظ وتحديث الملف المهني بنجاح وتسجيل العملية في سجل التدقيق.',
      dossier: updated,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Upload Teacher Professional Document (Article 23, Element 13)
const uploadTeacherDocument = async (req, res, next) => {
  const { id } = req.params;
  const { title, docType, notes } = req.body;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'يرجى اختيار ملف لرفعه' });
    }

    let teacher = await Teacher.findById(id);
    if (!teacher) {
      teacher = await Teacher.findOne({ user: id });
    }
    if (!teacher) {
      return res.status(404).json({ message: 'الملف المهني غير موجود' });
    }

    const uploadDir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname) || '.pdf';
    const cleanOrig = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
    const uniqueName = `teacher_doc_${Date.now()}_${cleanOrig}${ext}`;
    const targetPath = path.join(uploadDir, uniqueName);

    fs.writeFileSync(targetPath, req.file.buffer);

    const fileUrl = `/uploads/documents/${uniqueName}`;

    const newDoc = {
      title: title || req.file.originalname,
      docType: docType || 'other',
      fileUrl,
      fileName: req.file.originalname,
      uploadedAt: new Date(),
      verified: true,
      notes: notes || '',
    };

    teacher.documents.push(newDoc);

    // Update checklist flag
    if (docType && teacher.checklist && teacher.checklist[docType] !== undefined) {
      teacher.checklist[docType] = true;
    }

    // Audit trail logging
    teacher.auditTrail.push({
      action: 'إيداع وثيقة مهنية',
      details: `تم رفع وثيقة: ${newDoc.title} (${docType || 'أخرى'})`,
      performedBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'الإدارة',
      performedByRole: req.user?.role || 'admin',
      timestamp: new Date(),
    });

    await teacher.save();

    res.status(200).json({
      message: 'تم إيداع الوثيقة وتحديث الملف المهني وسجل التدقيق بنجاح.',
      document: newDoc,
      checklist: teacher.checklist,
      auditTrail: teacher.auditTrail,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Delete Teacher Professional Document
const deleteTeacherDocument = async (req, res, next) => {
  const { id, docId } = req.params;
  try {
    let teacher = await Teacher.findById(id);
    if (!teacher) {
      teacher = await Teacher.findOne({ user: id });
    }
    if (!teacher) {
      return res.status(404).json({ message: 'الملف المهني غير موجود' });
    }

    const docIndex = teacher.documents.findIndex((d) => d._id.toString() === docId);
    if (docIndex === -1) {
      return res.status(404).json({ message: 'الوثيقة غير موجودة' });
    }

    const removedDoc = teacher.documents[docIndex];
    teacher.documents.splice(docIndex, 1);

    if (removedDoc.docType && teacher.checklist && teacher.checklist[removedDoc.docType] !== undefined) {
      const hasOther = teacher.documents.some((d) => d.docType === removedDoc.docType);
      if (!hasOther) {
        teacher.checklist[removedDoc.docType] = false;
      }
    }

    teacher.auditTrail.push({
      action: 'حذف وثيقة مهنية',
      details: `تم حذف الوثيقة: ${removedDoc.title}`,
      performedBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'الإدارة',
      performedByRole: req.user?.role || 'admin',
      timestamp: new Date(),
    });

    await teacher.save();

    res.status(200).json({
      message: 'تم حذف الوثيقة وتحديث الملف المهني بنجاح.',
      checklist: teacher.checklist,
      documents: teacher.documents,
      auditTrail: teacher.auditTrail,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Download Teachers Excel Template (with auto-linking guide and Article 23 fields)
const getTeachersTemplate = async (req, res, next) => {
  try {
    const sampleRows = [
      {
        'الاسم': 'أحمد',
        'اللقب': 'بن علي',
        'البريد الإلكتروني': 'ahmed.benali@ecole-zitouni.dz',
        'رقم الهاتف': '0555123456',
        'المادة': 'رياضيات',
        'الطور': 'ابتدائي',
        'الأقسام': 'السنة الأولى ابتدائي, السنة الثانية ابتدائي',
        'الأفواج': 'فوج 1, فوج 2',
        'نوع العقد': 'CDI',
        'مدة العقد': 'دائم',
        'تاريخ التوظيف': '2023-09-01',
        'الراتب الأساسي': 65000,
        'ساعات العمل': 18,
        'الوضعية': 'نشط',
      },
      {
        'الاسم': 'فاطمة',
        'اللقب': 'منصوري',
        'البريد الإلكتروني': 'fatima.mansouri@ecole-zitouni.dz',
        'رقم الهاتف': '0661987654',
        'المادة': 'لغة فرنسية',
        'الطور': 'متوسط',
        'الأقسام': 'السنة الأولى متوسط, السنة الثانية متوسط',
        'الأفواج': 'فوج 1',
        'نوع العقد': 'CDD',
        'مدة العقد': '1 سنة',
        'تاريخ التوظيف': '2024-09-01',
        'الراتب الأساسي': 60000,
        'ساعات العمل': 16,
        'الوضعية': 'نشط',
      },
    ];

    const buffer = excelService.generateExcel(sampleRows, 'نموذج_استيراد_الأساتذة');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=model_import_enseignants_article23.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// ===== Article 24: Contracts, Work Certificates & Resignations (المادة 24: العقود والوثائق المهنية) =====

// 1. Get Official Work Certificate Data
const getWorkCertificate = async (req, res, next) => {
  const { id } = req.params;
  try {
    let teacher = await Teacher.findById(id).populate('user');
    if (!teacher) {
      teacher = await Teacher.findOne({ user: id }).populate('user');
    }
    if (!teacher || !teacher.user) {
      return res.status(404).json({ message: 'الأستاذ أو الموظف غير موجود' });
    }

    const u = teacher.user;
    const certNumber = `CERT-TR-${new Date().getFullYear()}-${u._id.toString().slice(-4).toUpperCase()}`;

    res.status(200).json({
      certNumber,
      issueDate: new Date(),
      employee: {
        fullNameArabic: `${u.firstNameArabic || u.firstName} ${u.lastNameArabic || u.lastName}`,
        fullNameFrench: `${u.firstNameFrench || u.firstName} ${u.lastNameFrench || u.lastName}`,
        jobTitle: u.jobTitle || (u.role === 'teacher' ? 'أستاذ مادة' : u.role),
        specialization: teacher.specialization || (teacher.subjects || []).join('، ') || 'التعليم العام',
        hiringDate: teacher.hiringDate || u.hiringDate || new Date(),
        contractType: teacher.contractType || u.contractType || 'CDI',
        cycle: teacher.cycle === 'middle' ? 'التعليم المتوسط' : teacher.cycle === 'secondary' ? 'التعليم الثانوي' : 'التعليم الابتدائي',
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Official Contract Template
const getContractTemplate = async (req, res, next) => {
  const { id } = req.params;
  try {
    let teacher = await Teacher.findById(id).populate('user').populate('classes').populate('groups');
    if (!teacher) {
      teacher = await Teacher.findOne({ user: id }).populate('user').populate('classes').populate('groups');
    }
    if (!teacher || !teacher.user) {
      return res.status(404).json({ message: 'الأستاذ أو الموظف غير موجود' });
    }

    const u = teacher.user;
    const contractRef = `CTR-${teacher.contractType || 'CDI'}-${new Date().getFullYear()}-${u._id.toString().slice(-4).toUpperCase()}`;

    res.status(200).json({
      contractRef,
      teacherId: teacher._id,
      user: {
        nameArabic: `${u.firstNameArabic || u.firstName} ${u.lastNameArabic || u.lastName}`,
        nameFrench: `${u.firstNameFrench || u.firstName} ${u.lastNameFrench || u.lastName}`,
        phone: u.phoneNumber || '',
        email: u.email || '',
      },
      contractType: teacher.contractType || 'CDI',
      contractDuration: teacher.contractDuration || '1 سنة',
      contractStartDate: teacher.contractStartDate || teacher.hiringDate || new Date(),
      contractEndDate: teacher.contractEndDate || null,
      baseSalary: teacher.baseSalary || u.baseSalary || 60000,
      assignedHours: teacher.assignedHours || 18,
      specialization: teacher.specialization || (teacher.subjects || []).join('، ') || '',
      cycle: teacher.cycle || 'primary',
      classes: (teacher.classes || []).map(c => c.name),
      groups: (teacher.groups || []).map(g => g.name),
      assignedTasks: teacher.assignedTasks || 'تدريس، تأطير بيداغوجي، متابعة الفروض والامتحانات، المشاركة في مجالس الأقسام',
    });
  } catch (error) {
    next(error);
  }
};

// 3. Record Resignation Request (Article 24: حفظ طلبات الاستقالة ومتابعة مدة الإشعار)
const recordTeacherResignation = async (req, res, next) => {
  const { id } = req.params;
  const { submissionDate, noticeDays, reason, notes } = req.body;

  try {
    let teacher = await Teacher.findById(id).populate('user');
    if (!teacher) {
      teacher = await Teacher.findOne({ user: id }).populate('user');
    }
    if (!teacher) {
      return res.status(404).json({ message: 'الأستاذ غير موجود' });
    }

    const subDate = submissionDate ? new Date(submissionDate) : new Date();
    const noticePeriodDays = Number(noticeDays) || 30;
    const effectiveEndDate = new Date(subDate.getTime() + noticePeriodDays * 24 * 60 * 60 * 1000);

    teacher.professionalStatus = 'resigned';
    teacher.auditTrail = teacher.auditTrail || [];
    teacher.auditTrail.push({
      action: 'إيداع طلب استقالة',
      performedBy: req.user.firstName + ' ' + req.user.lastName,
      performedByRole: req.user.role,
      details: `تم تسجيل طلب الاستقالة بتاريخ ${subDate.toLocaleDateString('ar-DZ')}. مدة الإشعار القانونية: ${noticePeriodDays} يوماً (سارية حتى ${effectiveEndDate.toLocaleDateString('ar-DZ')}). السبب: ${reason || 'غير محدد'}. ${notes || ''}`,
      timestamp: new Date(),
    });

    await teacher.save();

    res.status(200).json({
      message: `تم تسجيل طلب الاستقالة بنجاح. فترة الإشعار سارية حتى تاريخ ${effectiveEndDate.toLocaleDateString('ar-DZ')}.`,
      resignation: {
        submissionDate: subDate,
        noticeDays: noticePeriodDays,
        effectiveEndDate,
        reason,
        notes,
      },
      auditTrail: teacher.auditTrail,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get Expiring Contracts (Article 24: التنبيه قبل انتهاء العقد)
const getExpiringContracts = async (req, res, next) => {
  try {
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + 60); // 60 days ahead

    const teachers = await Teacher.find({
      contractEndDate: { $gte: today, $lte: thresholdDate },
    }).populate('user', 'firstName lastName firstNameArabic lastNameArabic email phoneNumber');

    const expiringList = teachers.map(t => {
      const daysLeft = Math.ceil((new Date(t.contractEndDate) - today) / (1000 * 60 * 60 * 24));
      return {
        teacherId: t._id,
        nameArabic: t.user ? `${t.user.firstNameArabic || t.user.firstName} ${t.user.lastNameArabic || t.user.lastName}` : 'أستاذ',
        email: t.user?.email || '—',
        phone: t.user?.phoneNumber || '—',
        contractType: t.contractType || 'CDD',
        contractEndDate: t.contractEndDate,
        daysLeft,
        isUrgent: daysLeft <= 30,
      };
    });

    res.status(200).json({
      count: expiringList.length,
      expiringList,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  bulkImportStudents,
  bulkImportTeachers,
  bulkImportParents,
  toggleUserStatus,
  createClass,
  createGroup,
  createOrUpdateSchedule,
  getDashboardStats,
  getClasses,
  getGroups,
  getParents,
  getUsers,
  getStudents,
  getTeachers,
  updateUser,
  deleteUser,
  createPayment,
  getSchedules,
  deleteSchedule,
  exportStudents,
  exportTeachers,
  exportParents,
  exportPayments,
  updateClass,
  deleteClass,
  updateGroup,
  deleteGroup,
  getModules,
  createModule,
  updateModule,
  deleteModule,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getDocuments,
  createEnrollment,
  reEnrollStudent,
  updateEnrollmentStatus,
  getWaitlist,
  getStudentAuditHistory,
  uploadStudentDocument,
  getTeacherDossier,
  updateTeacherDossier,
  uploadTeacherDocument,
  deleteTeacherDocument,
  getTeachersTemplate,
  getWorkCertificate,
  getContractTemplate,
  recordTeacherResignation,
  getExpiringContracts,
};
