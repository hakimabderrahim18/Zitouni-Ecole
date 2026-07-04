/**
 * One-off utility: generates example Excel files for testing bulk import.
 * It pulls real Class/Group ObjectIds from the database so the student
 * template can be imported without manual editing.
 *
 * Run:  node src/generateImportSamples.js
 * Output: backend/sample-imports/{students,teachers,parents}-import-sample.xlsx
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Class = require('./models/class.model');
const Group = require('./models/group.model');
const { generateExcel } = require('./services/excel.service');
require('dotenv').config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zitouni_school');
  console.log('Connected. Building sample import files...');

  const classes = await Class.find().sort({ name: 1 });
  const groups = await Group.find().sort({ name: 1 });

  if (!classes.length || !groups.length) {
    console.error('No classes/groups found. Run the seed first (node src/seed.js).');
    await mongoose.disconnect();
    process.exit(1);
  }

  const c1 = classes[0];
  const g1 = groups[0];
  const g2 = groups[1] || groups[0];

  // ---- Students sample (matches bulkImportStudents columns) ----
  const students = [
    {
      email: 'student.import1@ecole-zitouni.dz',
      password: 'Student123!',
      firstName: 'Adam',
      lastName: 'Hamoudi',
      phoneNumber: '0550100200',
      registrationNumber: 'REG-IMP-001',
      classId: c1._id.toString(),
      groupId: g1._id.toString(),
      parentEmail: 'parent.import1@ecole-zitouni.dz',
    },
    {
      email: 'student.import2@ecole-zitouni.dz',
      password: 'Student123!',
      firstName: 'Lina',
      lastName: 'Cherif',
      phoneNumber: '0550100201',
      registrationNumber: 'REG-IMP-002',
      classId: c1._id.toString(),
      groupId: g2._id.toString(),
      parentEmail: 'parent.import2@ecole-zitouni.dz',
    },
    {
      email: 'student.import3@ecole-zitouni.dz',
      password: 'Student123!',
      firstName: 'Yacine',
      lastName: 'Bouzid',
      phoneNumber: '0550100202',
      registrationNumber: 'REG-IMP-003',
      classId: c1._id.toString(),
      groupId: g1._id.toString(),
      parentEmail: 'parent.import1@ecole-zitouni.dz',
    },
  ];

  // ---- Teachers sample (matches bulkImportTeachers columns) ----
  const teachers = [
    {
      email: 'teacher.import1@ecole-zitouni.dz',
      password: 'Teacher123!',
      firstName: 'Yasmine',
      lastName: 'Bekkar',
      phoneNumber: '0550200300',
      subjects: 'Physique, Chimie',
    },
    {
      email: 'teacher.import2@ecole-zitouni.dz',
      password: 'Teacher123!',
      firstName: 'Omar',
      lastName: 'Saidi',
      phoneNumber: '0550200301',
      subjects: 'Français',
    },
  ];

  // ---- Parents sample (matches bulkImportParents columns) ----
  const parents = [
    {
      email: 'parent.import1@ecole-zitouni.dz',
      password: 'Parent123!',
      firstName: 'Karim',
      lastName: 'Hamoudi',
      phoneNumber: '0550300400',
      profession: 'Architecte',
      address: 'Ouled Fayet, Alger',
    },
    {
      email: 'parent.import2@ecole-zitouni.dz',
      password: 'Parent123!',
      firstName: 'Nawel',
      lastName: 'Cherif',
      phoneNumber: '0550300401',
      profession: 'Pharmacienne',
      address: 'Ouled Fayet, Alger',
    },
  ];

  const outDir = path.join(__dirname, '..', 'sample-imports');
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, 'students-import-sample.xlsx'), generateExcel(students, 'Students'));
  fs.writeFileSync(path.join(outDir, 'teachers-import-sample.xlsx'), generateExcel(teachers, 'Teachers'));
  fs.writeFileSync(path.join(outDir, 'parents-import-sample.xlsx'), generateExcel(parents, 'Parents'));

  console.log(`Sample files written to: ${outDir}`);
  console.log(' - students-import-sample.xlsx (classId/groupId pre-filled from DB)');
  console.log(' - teachers-import-sample.xlsx');
  console.log(' - parents-import-sample.xlsx');
  console.log('Tip: import parents first, then students (so parentEmail links correctly).');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
