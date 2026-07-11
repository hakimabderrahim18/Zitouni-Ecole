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
    // Check if general supervisor exists
    const genSupCheck = await User.findOne({ $or: [{ username: 'superviseur.gen' }, { role: 'general_supervisor' }] });
    const recepCheck = await User.findOne({ $or: [{ username: 'receptionniste' }, { role: 'receptionist' }] });
    const pedSupCheck = await User.findOne({ $or: [{ username: 'superviseur.ped' }, { role: 'pedagogical_supervisor' }] });
    const adminCheck = await User.findOne({ username: 'admin' });

    // If all core accounts exist, no need for full auto-seed
    if (genSupCheck && recepCheck && pedSupCheck && adminCheck) {
      console.log('Core prefilled accounts already exist in DB.');
      return;
    }

    console.log('Auto-seeding missing core prefilled accounts (Supervisors, Receptionist, Admin, etc.) into DB...');

    // 1. Ensure basic Class & Group for assignments
    let c1 = await Class.findOne({ name: '1AP' });
    if (!c1) {
      c1 = await Class.create({ name: '1AP', level: 'المستوى الأول', cycle: 'الابتدائي', tuitionFee: 45000 });
    }
    let g1 = await Group.findOne({ name: 'الفوج أ', class: c1._id });
    if (!g1) {
      g1 = await Group.create({ name: 'الفوج أ', class: c1._id, capacity: 30 });
    }

    // 2. Admin
    let admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      admin = await User.create({
        username: 'admin',
        email: 'admin@ecole-zitouni.dz',
        password: 'Admin123!',
        firstName: 'عبد الرحيم',
        lastName: 'زيتوني',
        role: 'admin',
        phoneNumber: '0550000000',
        baseSalary: 120000,
        salaryDeductionPerAbsence: 0,
      });
    }

    // 3. School
    let school = await User.findOne({ username: 'school' });
    if (!school) {
      school = await User.create({
        username: 'school',
        email: 'direction@ecole-zitouni.dz',
        password: 'School123!',
        firstName: 'إدارة',
        lastName: 'المدرسة',
        role: 'school',
        phoneNumber: '0550000001',
        baseSalary: 100000,
        salaryDeductionPerAbsence: 0,
      });
    }

    // 4. Teacher
    let tUser = await User.findOne({ username: 'teacher.math' });
    if (!tUser) {
      tUser = await User.create({
        username: 'teacher.math',
        email: 'teacher.math@ecole-zitouni.dz',
        password: '0550111111',
        firstName: 'كمال',
        lastName: 'دحماني',
        role: 'teacher',
        phoneNumber: '0550111111',
        baseSalary: 65000,
        salaryDeductionPerAbsence: 2500,
      });
      await Teacher.create({ user: tUser._id, subjects: ['رياضيات'], classes: [c1._id], groups: [g1._id] });
    }

    // 5. General Supervisor
    let genSupUser = await User.findOne({ username: 'superviseur.gen' });
    if (!genSupUser) {
      genSupUser = await User.create({
        username: 'superviseur.gen',
        email: 'general.sup@ecole-zitouni.dz',
        password: '0550112233',
        firstName: 'رضا',
        lastName: 'بن عيسى',
        role: 'general_supervisor',
        phoneNumber: '0550112233',
        baseSalary: 85000,
        salaryDeductionPerAbsence: 3000,
      });
      await Supervisor.create({
        user: genSupUser._id,
        supervisorType: 'General',
        assignedClasses: [c1._id],
        assignedTeachers: [tUser._id],
      });
    } else {
      // Make sure password/phone matches exactly if it was created earlier or modified
      genSupUser.phoneNumber = '0550112233';
      if (!genSupUser.username) genSupUser.username = 'superviseur.gen';
      await genSupUser.save();
    }

    // 6. Pedagogical Supervisor
    let pedSupUser = await User.findOne({ username: 'superviseur.ped' });
    if (!pedSupUser) {
      pedSupUser = await User.create({
        username: 'superviseur.ped',
        email: 'pedagogical.sup@ecole-zitouni.dz',
        password: '0550445566',
        firstName: 'سارة',
        lastName: 'منصور',
        role: 'pedagogical_supervisor',
        phoneNumber: '0550445566',
        baseSalary: 75000,
        salaryDeductionPerAbsence: 2800,
      });
      await Supervisor.create({
        user: pedSupUser._id,
        supervisorType: 'Pedagogical',
        assignedClasses: [c1._id],
        assignedTeachers: [tUser._id],
      });
    } else {
      pedSupUser.phoneNumber = '0550445566';
      if (!pedSupUser.username) pedSupUser.username = 'superviseur.ped';
      await pedSupUser.save();
    }

    // 7. Receptionist
    let recepUser = await User.findOne({ username: 'receptionniste' });
    if (!recepUser) {
      recepUser = await User.create({
        username: 'receptionniste',
        email: 'reception@ecole-zitouni.dz',
        password: '0550778899',
        firstName: 'أمين',
        lastName: 'براهيمي',
        role: 'receptionist',
        phoneNumber: '0550778899',
        baseSalary: 55000,
        salaryDeductionPerAbsence: 2000,
      });
      await Receptionist.create({ user: recepUser._id });
    } else {
      recepUser.phoneNumber = '0550778899';
      if (!recepUser.username) recepUser.username = 'receptionniste';
      await recepUser.save();
    }

    // 8. Student
    let sUser = await User.findOne({ username: 'student.yanis' });
    if (!sUser) {
      sUser = await User.create({
        username: 'student.yanis',
        email: 'yanis.m@ecole-zitouni.dz',
        password: '2014-03-20',
        firstName: 'أنيس',
        lastName: 'مزيان',
        role: 'student',
        phoneNumber: '0550110022',
      });
      await Student.create({
        user: sUser._id,
        registrationNumber: 'ZIT-2026-001',
        dateOfBirth: new Date('2014-03-20'),
        cycle: 'الابتدائي',
        class: c1._id,
        group: g1._id,
      });
    }

    // 9. Parent
    let pUser = await User.findOne({ username: 'parent.meziane' });
    if (!pUser) {
      pUser = await User.create({
        username: 'parent.meziane',
        email: 'parent.meziane@ecole-zitouni.dz',
        password: '0550110011',
        firstName: 'رشيد',
        lastName: 'مزيان',
        role: 'parent',
        phoneNumber: '0550110011',
      });
      const stDoc = await Student.findOne({ user: sUser._id });
      await Parent.create({
        user: pUser._id,
        children: stDoc ? [stDoc._id] : [],
        address: 'الجزائر العاصمة',
      });
    }

    // 10. Financial Products check
    const prodCheck = await FinancialProduct.findOne({});
    if (!prodCheck) {
      await FinancialProduct.insertMany([
        { name: 'فصل دراسي أول (الابتدائي)', price: 45000, category: 'Tuition', description: 'رسوم التسجيل للفصل الأول' },
        { name: 'اشتراك المطعم المدرسي (شهري)', price: 8000, category: 'Canteen', description: 'وجبة غداء صحية' },
      ]);
    }

    console.log('Core prefilled accounts check/seeding completed.');
  } catch (err) {
    console.error('Error ensuring core accounts:', err.message);
  }
};

module.exports = { ensureCoreAccounts };
