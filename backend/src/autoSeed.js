const mongoose = require('mongoose');
const User = require('./models/user.model');
const Teacher = require('./models/teacher.model');
const Student = require('./models/student.model');
const Parent = require('./models/parent.model');
const Class = require('./models/class.model');
const Group = require('./models/group.model');
const Supervisor = require('./models/supervisor.model');
const Receptionist = require('./models/receptionist.model');
const { FinancialProduct } = require('./models/finance.model');

const ensureCoreAccounts = async () => {
  try {
    console.log('Ensuring core prefilled accounts (Admin, School, Teachers, Supervisors, Receptionist, Student, Parent) in DB with exact credentials...');

    // 1. Ensure basic Class & Group for assignments
    let c1 = await Class.findOne({ name: '1AP' });
    if (!c1) {
      c1 = await Class.create({ name: '1AP', level: 'المستوى الأول', cycle: 'الابتدائي', tuitionFee: 45000 });
    }
    let g1 = await Group.findOne({ name: 'الفوج أ', class: c1._id });
    if (!g1) {
      g1 = await Group.create({ name: 'الفوج أ', class: c1._id, capacity: 30 });
    }

    // List of core accounts with their required credentials and properties
    const coreUsers = [
      {
        username: 'admin',
        email: 'admin@ecole-zitouni.dz',
        password: 'Admin123!',
        firstName: 'عبد الرحيم',
        lastName: 'زيتوني',
        role: 'admin',
        phoneNumber: '0550000000',
        baseSalary: 120000,
      },
      {
        username: 'school',
        email: 'direction@ecole-zitouni.dz',
        password: 'School123!',
        firstName: 'إدارة',
        lastName: 'المدرسة',
        role: 'school',
        phoneNumber: '0550000001',
        baseSalary: 100000,
      },
      {
        username: 'teacher.math',
        email: 'teacher.math@ecole-zitouni.dz',
        password: '0550111111',
        firstName: 'كمال',
        lastName: 'دحماني',
        role: 'teacher',
        phoneNumber: '0550111111',
        baseSalary: 65000,
      },
      {
        username: 'superviseur.gen',
        email: 'general.sup@ecole-zitouni.dz',
        password: '0550112233',
        firstName: 'رضا',
        lastName: 'بن عيسى',
        role: 'general_supervisor',
        phoneNumber: '0550112233',
        baseSalary: 85000,
      },
      {
        username: 'superviseur.ped',
        email: 'pedagogical.sup@ecole-zitouni.dz',
        password: '0550445566',
        firstName: 'سارة',
        lastName: 'منصور',
        role: 'pedagogical_supervisor',
        phoneNumber: '0550445566',
        baseSalary: 75000,
      },
      {
        username: 'receptionniste',
        email: 'reception@ecole-zitouni.dz',
        password: '0550778899',
        firstName: 'أمين',
        lastName: 'براهيمي',
        role: 'receptionist',
        phoneNumber: '0550778899',
        baseSalary: 55000,
      },
      {
        username: 'student.yanis',
        email: 'yanis.m@ecole-zitouni.dz',
        password: '2014-03-20',
        firstName: 'أنيس',
        lastName: 'مزيان',
        role: 'student',
        phoneNumber: '0550110022',
      },
      {
        username: 'parent.meziane',
        email: 'parent.meziane@ecole-zitouni.dz',
        password: '0550110011',
        firstName: 'رشيد',
        lastName: 'مزيان',
        role: 'parent',
        phoneNumber: '0550110011',
      }
    ];

    for (const u of coreUsers) {
      let userDoc = await User.findOne({
        $or: [{ username: u.username }, { email: u.email }]
      }).select('+password');

      if (!userDoc) {
        userDoc = await User.create({
          username: u.username,
          email: u.email,
          password: u.password,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          phoneNumber: u.phoneNumber,
          baseSalary: u.baseSalary || 0,
          isActive: true,
        });
      } else {
        // Ensure properties and reset password to guarantee exact login matches
        userDoc.username = u.username;
        userDoc.email = u.email;
        userDoc.role = u.role;
        userDoc.phoneNumber = u.phoneNumber;
        userDoc.isActive = true;
        userDoc.password = u.password; // Trigger bcrypt hash in pre('save')
        await userDoc.save();
      }

      // Ensure related role profiles
      if (u.role === 'teacher') {
        const tDoc = await Teacher.findOne({ user: userDoc._id });
        if (!tDoc) {
          await Teacher.create({ user: userDoc._id, subjects: ['رياضيات'], classes: [c1._id], groups: [g1._id] });
        }
      } else if (u.role === 'general_supervisor') {
        const gDoc = await Supervisor.findOne({ user: userDoc._id });
        if (!gDoc) {
          await Supervisor.create({ user: userDoc._id, supervisorType: 'General', assignedClasses: [c1._id] });
        }
      } else if (u.role === 'pedagogical_supervisor') {
        const pDoc = await Supervisor.findOne({ user: userDoc._id });
        if (!pDoc) {
          await Supervisor.create({ user: userDoc._id, supervisorType: 'Pedagogical', assignedClasses: [c1._id] });
        }
      } else if (u.role === 'receptionist') {
        const rDoc = await Receptionist.findOne({ user: userDoc._id });
        if (!rDoc) {
          await Receptionist.create({ user: userDoc._id });
        }
      } else if (u.role === 'student') {
        const sDoc = await Student.findOne({ user: userDoc._id });
        if (!sDoc) {
          await Student.create({
            user: userDoc._id,
            registrationNumber: 'ZIT-2026-001',
            dateOfBirth: new Date('2014-03-20'),
            cycle: 'الابتدائي',
            class: c1._id,
            group: g1._id,
          });
        }
      } else if (u.role === 'parent') {
        const sUser = await User.findOne({ username: 'student.yanis' });
        const stDoc = sUser ? await Student.findOne({ user: sUser._id }) : null;
        const pDoc = await Parent.findOne({ user: userDoc._id });
        if (!pDoc) {
          await Parent.create({
            user: userDoc._id,
            children: stDoc ? [stDoc._id] : [],
            address: 'الجزائر العاصمة',
          });
        }
      }
    }

    // 10. Financial Products check
    const prodCheck = await FinancialProduct.findOne({});
    if (!prodCheck) {
      await FinancialProduct.insertMany([
        { name: 'فصل دراسي أول (الابتدائي)', price: 45000, category: 'Tuition', description: 'رسوم التسجيل للفصل الأول' },
        { name: 'اشتراك المطعم المدرسي (شهري)', price: 8000, category: 'Canteen', description: 'وجبة غداء صحية' },
      ]);
    }

    console.log('All 8 core accounts successfully verified/seeded with exact credentials.');
  } catch (err) {
    console.error('Error ensuring core accounts:', err.message);
  }
};

module.exports = { ensureCoreAccounts };
