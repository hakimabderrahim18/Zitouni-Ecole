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
const fs = require('fs');
const path = require('path');

// Manual Creation of Accounts (Supports ALL roles: admin, school, teacher, student, parent, general_supervisor, pedagogical_supervisor, receptionist)
const createUser = async (req, res, next) => {
  const { email, password, firstName, lastName, role, phoneNumber, details } = req.body;
  const username = req.body.username || (email ? email.split('@')[0] : `${role}_${Date.now()}`);

  try {
    const userExists = await User.findOne({
      $or: [{ email: email || `${username}@ecole-zitouni.dz` }, { username }]
    });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email or username' });
    }

    // Enforce business rules for account passwords:
    //  - Parent / Teacher / Supervisor / Receptionist password defaults to phone number if not explicitly set
    //  - Student password defaults to date of birth (YYYY-MM-DD)
    let finalPassword = password;
    if (role === 'parent' || role === 'teacher' || role === 'general_supervisor' || role === 'pedagogical_supervisor' || role === 'receptionist') {
      if (!password && !phoneNumber) {
        return res.status(400).json({ message: `Le numéro de téléphone (ou mot de passe) est requis pour le rôle ${role}` });
      }
      finalPassword = password || String(phoneNumber);
    } else if (role === 'student') {
      const dob = details && details.dateOfBirth;
      if (!password && !dob) {
        return res.status(400).json({ message: 'Date of birth is required for student accounts (used as default password)' });
      }
      finalPassword = password || (dob ? new Date(dob).toISOString().split('T')[0] : 'Zitouni2026!');
    } else if (role === 'admin' || role === 'school') {
      finalPassword = password || String(phoneNumber || 'Admin123!');
    }

    const user = await User.create({
      username,
      email: email || `${username}@ecole-zitouni.dz`,
      password: finalPassword,
      firstName: firstName || role,
      lastName: lastName || 'Utilisateur',
      role,
      phoneNumber,
      isActive: true,
    });

    let profile = null;

    if (role === 'teacher') {
      profile = await Teacher.create({
        user: user._id,
        subjects: (details && details.subjects) || [],
        classes: (details && details.classes) || [],
        groups: (details && details.groups) || [],
        assignments: (details && Array.isArray(details.assignments)) ? details.assignments : [],
      });
      if (details && details.groups && details.groups.length > 0) {
        await Group.updateMany(
          { _id: { $in: details.groups } },
          { $addToSet: { teachers: profile._id } }
        );
      }
    } else if (role === 'parent') {
      profile = await Parent.create({
        user: user._id,
        profession: (details && details.profession) || '',
        address: (details && details.address) || '',
      });
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

// Excel Bulk Import of Teachers
const bulkImportTeachers = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }

    const rows = excelService.parseExcel(req.file.buffer);
    const results = [];

    for (const row of rows) {
      // Expect columns: email, password, firstName, lastName, phoneNumber, subjects
      const { email, password, firstName, lastName, phoneNumber, subjects } = row;
      if (!email) continue;

      const userExists = await User.findOne({ email });
      if (userExists) continue;

      const user = await User.create({
        email,
        password: password || 'Zitouni2026!',
        firstName,
        lastName,
        role: 'teacher',
        phoneNumber,
      });

      await Teacher.create({
        user: user._id,
        subjects: subjects ? String(subjects).split(',').map((s) => s.trim()).filter(Boolean) : [],
      });

      results.push(user);
    }

    res.status(200).json({ message: `Bulk import completed. Imported ${results.length} teachers.`, results });
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

// Administrative Dashboard Analytics
const getDashboardStats = async (req, res, next) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalClasses = await Class.countDocuments();

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
    });
  } catch (error) {
    next(error);
  }
};

const getClasses = async (req, res, next) => {
  try {
    const classes = await Class.find().sort({ name: 1 });
    res.status(200).json(classes);
  } catch (error) {
    next(error);
  }
};

const getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find()
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
    const students = await Student.find()
      .populate('user', 'firstName lastName email phoneNumber isActive')
      .populate('class', 'name')
      .populate('group', 'name')
      .populate({
        path: 'parent',
        populate: { path: 'user', select: 'firstName lastName email phoneNumber' }
      })
      .sort({ createdAt: -1 });
    res.status(200).json(students);
  } catch (error) {
    next(error);
  }
};

// Get all Teachers with details
const getTeachers = async (req, res, next) => {
  try {
    const teachers = await Teacher.find()
      .populate('user', 'firstName lastName email phoneNumber isActive')
      .populate('classes', 'name')
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
        teacher.subjects = details.subjects || teacher.subjects;
        teacher.classes = details.classes || teacher.classes;
        teacher.groups = details.groups || teacher.groups;
        if (Array.isArray(details.assignments)) teacher.assignments = details.assignments;
        await teacher.save();

        // Bidirectional sync for Group.teachers on update
        const removedGroups = oldGroups.filter(g => !details.groups.includes(g.toString()));
        if (removedGroups.length > 0) {
          await Group.updateMany(
            { _id: { $in: removedGroups } },
            { $pull: { teachers: teacher._id } }
          );
        }
        const addedGroups = details.groups.filter(g => !oldGroups.map(og => og.toString()).includes(g.toString()));
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
      .populate('user', 'firstName lastName email phoneNumber isActive')
      .populate('class', 'name')
      .populate('group', 'name')
      .populate({ path: 'parent', populate: { path: 'user', select: 'firstName lastName email phoneNumber' } })
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

// Export all Teachers to Excel
const exportTeachers = async (req, res, next) => {
  try {
    const teachers = await Teacher.find()
      .populate('user', 'firstName lastName email phoneNumber isActive')
      .populate('classes', 'name')
      .populate('groups', 'name')
      .sort({ createdAt: -1 });

    const rows = teachers.map((t) => ({
      'First Name': t.user?.firstName || '',
      'Last Name': t.user?.lastName || '',
      Email: t.user?.email || '',
      Phone: t.user?.phoneNumber || '',
      Subjects: (t.subjects || []).join(', '),
      Classes: (t.classes || []).map((c) => c.name).join(', '),
      Groups: (t.groups || []).map((g) => g.name).join(', '),
      Status: t.user?.isActive ? 'Active' : 'Inactive',
    }));

    sendExcel(res, rows, 'Teachers', 'teachers.xlsx');
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

// ===== Administrative documents (teacher contract / parent regulations) =====
const DOCUMENTS_DIR = path.join(__dirname, '../../uploads/documents');

const uploadDocument = async (req, res, next) => {
  const { type } = req.body;
  try {
    if (!['teacher_contract', 'parent_regulations'].includes(type)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Only PDF documents are allowed' });
    }

    // Ensure the storage directory exists
    fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });

    const fileName = `${type}.pdf`;
    const filePath = path.join(DOCUMENTS_DIR, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const fileUrl = `/uploads/documents/${fileName}`;

    const doc = await AdminDocument.findOneAndUpdate(
      { type },
      {
        type,
        fileName,
        originalName: req.file.originalname || fileName,
        fileUrl,
        uploadedBy: req.user.id,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: 'Document uploaded successfully', document: doc });
  } catch (error) {
    next(error);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const docs = await AdminDocument.find().sort({ type: 1 });
    res.status(200).json(docs);
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
  getDocuments,
};
