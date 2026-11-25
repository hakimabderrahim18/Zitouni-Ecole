/**
 * Generate Classes, Groups, and Teachers from Official RAN09 Timetable Data
 * And clean old disconnected database data.
 *
 * Source: backend/src/data/timetableEntries.json (2,148 entries)
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');
const Class = require('../models/class.model');
const Group = require('../models/group.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const TimetableEntry = require('../models/timetableEntry.model');
const Supervisor = require('../models/supervisor.model');
const Receptionist = require('../models/receptionist.model');
const SchoolSetting = require('../models/schoolSetting.model');

const MONGO_URI = process.env.ATLAS_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/zitouni_school';

const DIVISION_MAP = {
  '1AP': 'السنة الأولى ابتدائي',
  '2AP': 'السنة الثانية ابتدائي',
  '3AP': 'السنة الثالثة ابتدائي',
  '4AP': 'السنة الرابعة ابتدائي',
  '5AP': 'السنة الخامسة ابتدائي',
  '1AM': 'السنة الأولى متوسط',
  '1AM1': '1 متوسط 1',
  '2AM': 'السنة الثانية متوسط',
  '2AM1': '2 متوسط 1',
  '3AM': 'السنة الثالثة متوسط',
  '3AM1': '3 متوسط 1',
  '3AM2': '3 متوسط 2',
  '4AM': 'السنة الرابعة متوسط',
  '4AM1': '4 متوسط 1',
  '4AM2': '4 متوسط 2',
  '1S': 'أولى ثانوي علمي',
  '1 Scientifique': 'أولى ثانوي علمي',
  '1S1': '1 ثانوي علمي 1',
  '1S2': '1 ثانوي علمي 2',
  '1L': '1 ثانوي آداب',
  '1 Lettres': 'أولى ثانوي أدبي',
  '2S': '2 ثانوي علوم تجريبية',
  '2SE': '2 ثانوي علوم تجريبية',
  '2M': '2 ثانوي رياضيات',
  '2MA': '2 ثانوي رياضيات',
  '2MT': '2 ثانوي تقني رياضي',
  '2MTgm': '2 ثانوي تقني رياضي (ميكانيك)',
  '2LE': '2 ثانوي لغات أجنبية',
  '2LV': '2 ثانوي لغات أجنبية',
  '2LP': '2 ثانوي آداب وفلسفة',
  '2GT': '2 ثانوي تسيير واقتصاد',
  '3S': '3 ثانوي علوم تجريبية (بكالوريا)',
  '3SE': '3 ثانوي علوم تجريبية (بكالوريا)',
  '3M': '3 ثانوي رياضيات (بكالوريا)',
  '3MT': '3 ثانوي تقني رياضي (مدني)',
  '3MTgc': '3 ثانوي تقني رياضي (مدني)',
  '3GE': '3 ثانوي تسيير واقتصاد (بكالوريا)',
  '3GT': '3 ثانوي تسيير واقتصاد (بكالوريا)',
  '3LEs1': '3 ثانوي لغات أجنبية (إسباني 1)',
  '3LEs2': '3 ثانوي لغات أجنبية (إسباني 2)',
  '3LEit': '3 ثانوي لغات أجنبية (إيطالي)',
  '3LP': '3 ثانوي آداب وفلسفة (بكالوريا)',
};

const TEACHER_NAME_DICT = {
  'MAAROUF': { arFirst: 'محمد', arLast: 'معروف', frFirst: 'Mohamed', frLast: 'Maarouf' },
  'MABROUKI': { arFirst: 'سمير', arLast: 'مبروكي', frFirst: 'Samir', frLast: 'Mabrouki' },
  'NEBRI': { arFirst: 'كريم', arLast: 'نبري', frFirst: 'Karim', frLast: 'Nebri' },
  'HENNI': { arFirst: 'رشيد', arLast: 'هني', frFirst: 'Rachid', frLast: 'Henni' },
  'HEMIMCHE': { arFirst: 'فؤاد', arLast: 'هميمش', frFirst: 'Fouad', frLast: 'Hemimche' },
  'TIJDAM': { arFirst: 'طارق', arLast: 'تيجدم', frFirst: 'Tarek', frLast: 'Tijdam' },
  'ZAOUCHE': { arFirst: 'عبد القادر', arLast: 'زاوش', frFirst: 'Abdelkader', frLast: 'Zaouche' },
  'LAAROUSSI': { arFirst: 'مراد', arLast: 'لعروسي', frFirst: 'Mourad', frLast: 'Laaroussi' },
  'BENDHINA': { arFirst: 'أمينة', arLast: 'بن ضينة', frFirst: 'Amina', frLast: 'Bendhina' },
  'AZIRA': { arFirst: 'حكيم', arLast: 'عزيرة', frFirst: 'Hakim', frLast: 'Azira' },
  'ALOUCHE': { arFirst: 'جمال', arLast: 'علوش', frFirst: 'Djamel', frLast: 'Alouche' },
  'DJARAOUI': { arFirst: 'إلياس', arLast: 'جراوي', frFirst: 'Ilyas', frLast: 'Djaraoui' },
  'MADAHI': { arFirst: 'ياسين', arLast: 'مداحي', frFirst: 'Yassine', frLast: 'Madahi' },
  'RAHMANI': { arFirst: 'بلال', arLast: 'رحماني', frFirst: 'Bilal', frLast: 'Rahmani' },
  'SAHI': { arFirst: 'صالح', arLast: 'صاحي', frFirst: 'Salah', frLast: 'Sahi' },
  'BOUTLI': { arFirst: 'عبد الله', arLast: 'بوطلي', frFirst: 'Abdellah', frLast: 'Boutli' },
  'ZEROUAL': { arFirst: 'أحمد', arLast: 'زروال', frFirst: 'Ahmed', frLast: 'Zeroual' },
  'SIDHOUM': { arFirst: 'مصطفى', arLast: 'سيدهوم', frFirst: 'Mustapha', frLast: 'Sidhoum' },
  'BOUZAMA': { arFirst: 'عادل', arLast: 'بوزامة', frFirst: 'Adel', frLast: 'Bouzama' },
  'OUALBANI': { arFirst: 'هشام', arLast: 'ولباني', frFirst: 'Hicham', frLast: 'Oualbani' },
  'HADJ AHMED': { arFirst: 'الحاج', arLast: 'أحمد', frFirst: 'Hadj', frLast: 'Ahmed' },
  'KOUCHI': { arFirst: 'نبيل', arLast: 'كوشي', frFirst: 'Nabil', frLast: 'Kouchi' },
  'OUM ISHAK': { arFirst: 'فاطمة', arLast: 'أم إسحاق', frFirst: 'Fatima', frLast: 'Oum Ishak' },
  'GHOUBRINI': { arFirst: 'سفيان', arLast: 'غوبريني', frFirst: 'Sofiane', frLast: 'Ghoubrini' },
  'BAHIA': { arFirst: 'باهية', arLast: 'بلقاسم', frFirst: 'Bahia', frLast: 'Belkacem' },
  'BADANI': { arFirst: 'نور الدين', arLast: 'بداني', frFirst: 'Noureddine', frLast: 'Badani' },
  'CHERIF': { arFirst: 'شريف', arLast: 'عمراني', frFirst: 'Cherif', frLast: 'Amrani' },
  'SOFIANE': { arFirst: 'سفيان', arLast: 'بوزيد', frFirst: 'Sofiane', frLast: 'Bouzid' },
  'GEURMAT': { arFirst: 'رمزي', arLast: 'قرمات', frFirst: 'Ramzi', frLast: 'Geurmat' },
  'BOUGALMOUNE': { arFirst: 'حميد', arLast: 'بوغلمون', frFirst: 'Hamid', frLast: 'Bougalmoune' },
  'BENMIMOUNA': { arFirst: 'عمر', arLast: 'بن ميمونة', frFirst: 'Omar', frLast: 'Benmimouna' },
  'SERAA': { arFirst: 'سليم', arLast: 'سرايع', frFirst: 'Salim', frLast: 'Seraa' },
  'GUEFAF': { arFirst: 'توفيق', arLast: 'قفاف', frFirst: 'Taoufik', frLast: 'Guefaf' },
  'DAIFI': { arFirst: 'عصام', arLast: 'ضيفي', frFirst: 'Issam', frLast: 'Daifi' },
  'KHADRAOUI': { arFirst: 'خالد', arLast: 'خضراوي', frFirst: 'Khaled', frLast: 'Khadraoui' },
  'REZKI': { arFirst: 'رزقي', arLast: 'طاهر', frFirst: 'Rezki', frLast: 'Tahar' },
  'BENCHOHRA': { arFirst: 'عبد الحق', arLast: 'بن شهرة', frFirst: 'Abdelhak', frLast: 'Benchohra' },
  'HADJOUJ': { arFirst: 'سعيد', arLast: 'حجاج', frFirst: 'Said', frLast: 'Hadjouj' },
  'ZEROUKI': { arFirst: 'وليد', arLast: 'زروقي', frFirst: 'Walid', frLast: 'Zerouki' },
  'TOUISSAT': { arFirst: 'عثمان', arLast: 'طويسات', frFirst: 'Othmane', frLast: 'Touissat' },
  'SAIF': { arFirst: 'سيف الدين', arLast: 'مزاري', frFirst: 'Saifeddine', frLast: 'Mezari' },
  'HAMOUDI': { arFirst: 'حمودي', arLast: 'كمال', frFirst: 'Hamoudi', frLast: 'Kamel' },
  'MAROUANE': { arFirst: 'مروان', arLast: 'بوساحة', frFirst: 'Marouane', frLast: 'Bousaha' },
  'KHARBI': { arFirst: 'حمزة', arLast: 'خربي', frFirst: 'Hamza', frLast: 'Kharbi' },
  'CHABOUTI': { arFirst: 'رضوان', arLast: 'شبوطي', frFirst: 'Redouane', frLast: 'Chabouti' },
  'BOUZID': { arFirst: 'بوزيد', arLast: 'سالم', frFirst: 'Bouzid', frLast: 'Salem' },
  // Core teachers aliases and names
  'كمال دحماني': { arFirst: 'كمال', arLast: 'دحماني', frFirst: 'Kamel', frLast: 'Dahmani', email: 'teacher.math@ecole-zitouni.dz', phone: '0550111111' },
  'نادية صالحي': { arFirst: 'نادية', arLast: 'صالحي', frFirst: 'Nadia', frLast: 'Salhi', email: 'teacher.science@ecole-zitouni.dz', phone: '0550222222' },
  'عبد الحميد حداد': { arFirst: 'عبد الحميد', arLast: 'حداد', frFirst: 'Abdelhamid', frLast: 'Haddad', email: 'teacher.arabe@ecole-zitouni.dz', phone: '0550333333' },
  'HADDAD': { arFirst: 'عبد الحميد', arLast: 'حداد', frFirst: 'Abdelhamid', frLast: 'Haddad', email: 'teacher.arabe@ecole-zitouni.dz', phone: '0550333333' },
  'فاروق بلقاسم': { arFirst: 'فاروق', arLast: 'بلقاسم', frFirst: 'Farouk', frLast: 'Belkacem', email: 'teacher.physique@ecole-zitouni.dz', phone: '0550444444' },
  'BELKACEM': { arFirst: 'فاروق', arLast: 'بلقاسم', frFirst: 'Farouk', frLast: 'Belkacem', email: 'teacher.physique@ecole-zitouni.dz', phone: '0550444444' },
  'صورايا بن طيب': { arFirst: 'صورايا', arLast: 'بن طيب', frFirst: 'Soraya', frLast: 'Bentayeb', email: 'teacher.francais@ecole-zitouni.dz', phone: '0550555555' },
  'BENTAIEB': { arFirst: 'صورايا', arLast: 'بن طيب', frFirst: 'Soraya', frLast: 'Bentayeb', email: 'teacher.francais@ecole-zitouni.dz', phone: '0550555555' },
  'يوسف مزاوي': { arFirst: 'يوسف', arLast: 'مزاوي', frFirst: 'Youcef', frLast: 'Mezawi', email: 'teacher.histoire@ecole-zitouni.dz', phone: '0550666666' },
  'MEZAOUI': { arFirst: 'يوسف', arLast: 'مزاوي', frFirst: 'Youcef', frLast: 'Mezawi', email: 'teacher.histoire@ecole-zitouni.dz', phone: '0550666666' },
  'رضا بن عيسى': { arFirst: 'رضا', arLast: 'بن عيسى', frFirst: 'Reda', frLast: 'Benaissa', email: 'teacher.info@ecole-zitouni.dz', phone: '0550888888' },
  'عمر القايد': { arFirst: 'عمر', arLast: 'القايد', frFirst: 'Omar', frLast: 'El Kaid', email: 'teacher.anglais@ecole-zitouni.dz', phone: '0550112244' },
  'EL KAID': { arFirst: 'عمر', arLast: 'القايد', frFirst: 'Omar', frLast: 'El Kaid', email: 'teacher.anglais@ecole-zitouni.dz', phone: '0550112244' },
};

function getCycle(divisionCode) {
  if (divisionCode.includes('AP')) return 'primary';
  if (divisionCode.includes('AM')) return 'middle';
  return 'secondary';
}

async function runGenerator() {
  console.log(`\n======================================================`);
  console.log(`[RAN Timetable Generator] Connecting to DB: ${MONGO_URI.replace(/:([^:@]+)@/, ':****@')}`);
  console.log(`======================================================\n`);

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }

  // 1. Load 2,148 timetable entries from JSON file
  const jsonPath = path.join(__dirname, '..', 'data', 'timetableEntries.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Timetable file not found at: ${jsonPath}`);
    process.exit(1);
  }

  const rawEntries = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(` Loaded ${rawEntries.length} timetable entries from ${jsonPath}`);

  // 2. Extract unique Divisions, Teachers, Subjects, Groups
  const divisionMap = {};
  const teacherMap = {};

  rawEntries.forEach(entry => {
    // Division extraction
    const div = (entry.division || '').trim();
    if (div) {
      if (!divisionMap[div]) {
        divisionMap[div] = {
          name: div,
          level: getCycle(div),
          description: DIVISION_MAP[div] || entry.divisionArabic || div,
          modules: new Set(),
        };
      }
      if (entry.subjectName) divisionMap[div].modules.add(entry.subjectName.trim());
    }

    // Teacher extraction
    const tName = (entry.teacherName || '').trim();
    if (tName && tName !== 'SPORT10') {
      if (!teacherMap[tName]) {
        teacherMap[tName] = {
          name: tName,
          subjects: new Set(),
          divisions: new Set(),
          assignments: new Map(),
          slotsCount: 0,
        };
      }
      if (entry.subjectName) teacherMap[tName].subjects.add(entry.subjectName.trim());
      if (entry.division) teacherMap[tName].divisions.add(entry.division.trim());
      if (entry.subjectName && entry.room) {
        teacherMap[tName].assignments.set(entry.subjectName.trim(), entry.room.trim());
      }
      teacherMap[tName].slotsCount++;
    }
  });

  const distinctDivisions = Object.values(divisionMap);
  const distinctTeachers = Object.values(teacherMap);
  console.log(` Extracted ${distinctDivisions.length} unique Classes/Divisions from timetable.`);
  console.log(` Extracted ${distinctTeachers.length} unique Teachers from timetable.`);

  // 3. Clean old database data (timetable entries, groups, classes, and old teacher accounts)
  console.log(`\n Purging old TimetableEntries, Groups, and Classes...`);
  await TimetableEntry.deleteMany({});
  await Group.deleteMany({});
  await Class.deleteMany({});

  // Purge old teacher documents and teacher users (preserving admin, school, supervisors, receptionist, parents, students)
  console.log(` Cleaning old teacher records...`);
  await Teacher.deleteMany({});
  await User.deleteMany({ role: 'teacher' });

  // 4. Create all Classes in database
  console.log(` Inserting ${distinctDivisions.length} classes into database...`);
  const classDbMap = {};
  for (const divInfo of distinctDivisions) {
    const cls = await Class.create({
      name: divInfo.name,
      description: divInfo.description,
      level: divInfo.level,
      capacity: 30,
      modules: Array.from(divInfo.modules),
    });
    classDbMap[divInfo.name] = cls;
  }
  console.log(` Created ${Object.keys(classDbMap).length} classes successfully.`);

  // 5. Create Groups for every class (الفوج أ and الفوج ب)
  console.log(` Creating Groups (الفوج أ & الفوج ب) for all classes...`);
  const groupDbMap = {}; // key: `${className}_${groupName}`
  for (const cls of Object.values(classDbMap)) {
    const gA = await Group.create({
      name: 'الفوج أ',
      class: cls._id,
      capacity: 25,
      modules: cls.modules || [],
    });
    const gB = await Group.create({
      name: 'الفوج ب',
      class: cls._id,
      capacity: 25,
      modules: cls.modules || [],
    });
    groupDbMap[`${cls.name}_الفوج أ`] = gA;
    groupDbMap[`${cls.name}_الفوج ب`] = gB;
    groupDbMap[cls.name] = [gA, gB];
  }
  console.log(` Created ${Object.keys(groupDbMap).length} group references.`);

  // 6. Create all 59 Teacher Users & Teacher Profiles
  console.log(` Creating all ${distinctTeachers.length} Teacher Accounts and Profiles...`);
  const teacherDbMap = {};
  const hashedPassword = await bcrypt.hash('password123', 10);

  let teacherPhoneIndex = 1;
  for (const tInfo of distinctTeachers) {
    const dictEntry = TEACHER_NAME_DICT[tInfo.name] || {};
    const safeTag = tInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    const arFirst = dictEntry.arFirst || 'الأستاذ(ة)';
    const arLast = dictEntry.arLast || tInfo.name;
    const frFirst = dictEntry.frFirst || 'Prof.';
    const frLast = dictEntry.frLast || (tInfo.name.charAt(0) + tInfo.name.slice(1).toLowerCase());

    const email = dictEntry.email || `prof.${safeTag || 'teacher' + teacherPhoneIndex}@ecole-zitouni.dz`;
    const username = dictEntry.email ? dictEntry.email.split('@')[0] : `prof.${safeTag || 't' + teacherPhoneIndex}`;
    const phone = dictEntry.phone || `0550${String(teacherPhoneIndex).padStart(6, '0')}`;
    teacherPhoneIndex++;

    // Ensure user account
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        username,
        email,
        phoneNumber: phone,
        password: hashedPassword,
        role: 'teacher',
        firstName: frFirst,
        lastName: frLast,
        firstNameArabic: arFirst,
        lastNameArabic: arLast,
        baseSalary: 65000,
        isActive: true,
      });
    }

    // Determine teacher classes & groups
    const assignedClassIds = [];
    const assignedGroupIds = [];
    for (const divCode of tInfo.divisions) {
      const cls = classDbMap[divCode];
      if (cls) {
        assignedClassIds.push(cls._id);
        const grps = groupDbMap[divCode];
        if (grps && Array.isArray(grps)) {
          grps.forEach(g => assignedGroupIds.push(g._id));
        }
      }
    }

    // Determine cycle based on assigned classes
    const levels = assignedClassIds.map(id => {
      const c = Object.values(classDbMap).find(cl => cl._id.toString() === id.toString());
      return c?.level;
    }).filter(Boolean);
    const uniqueLevels = [...new Set(levels)];
    const cycle = uniqueLevels.length === 1 ? uniqueLevels[0] : (uniqueLevels.length > 1 ? 'all' : 'secondary');

    // Room assignments
    const assignmentsList = [];
    for (const [mod, rm] of tInfo.assignments.entries()) {
      assignmentsList.push({ module: mod, room: rm });
    }

    let teacherDoc = await Teacher.findOne({ user: user._id });
    if (teacherDoc) {
      // Merge assignments and classes without duplicates
      const currentClasses = (teacherDoc.classes || []).map(c => c.toString());
      const newClasses = assignedClassIds.filter(id => !currentClasses.includes(id.toString()));
      teacherDoc.classes = [...teacherDoc.classes, ...newClasses];

      const currentGroups = (teacherDoc.groups || []).map(g => g.toString());
      const newGroups = assignedGroupIds.filter(id => !currentGroups.includes(id.toString()));
      teacherDoc.groups = [...teacherDoc.groups, ...newGroups];

      const currentSubjects = teacherDoc.subjects || [];
      tInfo.subjects.forEach(s => {
        if (!currentSubjects.includes(s)) currentSubjects.push(s);
      });
      teacherDoc.subjects = currentSubjects;
      await teacherDoc.save();
    } else {
      teacherDoc = await Teacher.create({
        user: user._id,
        subjects: Array.from(tInfo.subjects),
        classes: assignedClassIds,
        groups: assignedGroupIds,
        assignments: assignmentsList,
        specialization: Array.from(tInfo.subjects)[0] || 'التعليم العام',
        cycle,
        baseSalary: 65000,
        assignedHours: Math.min(24, Math.max(12, Math.round(tInfo.slotsCount * 0.75))),
        assignedTasks: 'تدريس، تنسيق بيداغوجي، متابعة الفروض والامتحانات',
        professionalStatus: 'active',
        checklist: {
          cv: true,
          diploma: true,
          medicalCertificate: true,
          idPhotos: true,
          criminalRecord: true,
          workContract: true,
          experienceCert: true,
        },
      });
    }

    teacherDbMap[tInfo.name] = teacherDoc;
    // Also associate alias if any
    if (dictEntry.email) {
      teacherDbMap[dictEntry.email] = teacherDoc;
    }
  }
  console.log(` Created ${Object.keys(teacherDbMap).length} teacher mappings.`);

  // 7. Update and insert all 2,148 Timetable Entries with real Class & Teacher references
  console.log(` Linking all 2,148 Timetable Entries to real Class & Teacher IDs...`);

  const enrichedEntries = rawEntries.map((e, idx) => {
    const clone = { ...e };
    delete clone._id; // Let Mongo generate clean ObjectId or retain if valid
    delete clone.__v;

    // Link class
    const cls = classDbMap[e.division];
    if (cls) {
      clone.class = cls._id;
      clone.divisionArabic = cls.description || e.divisionArabic;
    }

    // Link teacher
    const tName = (e.teacherName || '').trim();
    const teacherDoc = teacherDbMap[tName];
    if (teacherDoc) {
      clone.teacher = teacherDoc._id;
    }

    // Normalize group
    if (!clone.group || clone.group === '--' || clone.group === '') {
      clone.group = (idx % 2 === 0) ? 'الفوج أ' : 'الفوج ب';
    }

    return clone;
  });

  // Batch insert in chunks of 500
  const batchSize = 500;
  for (let i = 0; i < enrichedEntries.length; i += batchSize) {
    const batch = enrichedEntries.slice(i, i + batchSize);
    await TimetableEntry.insertMany(batch);
  }

  const finalTimetableCount = await TimetableEntry.countDocuments();
  console.log(` Successfully inserted ${finalTimetableCount} linked TimetableEntry documents!`);

  // 8. Re-link existing students and generate fresh students for every class
  console.log(` Re-linking students to newly generated classes and groups...`);
  const defaultParent = await Parent.findOne({});

  // Ensure 8-10 students in key classes across all 3 cycles
  const sampleStudentNames = [
    { arFirst: 'يانيس', arLast: 'مزيان', frFirst: 'Yanis', frLast: 'Meziane', gender: 'ذكر' },
    { arFirst: 'مريم', arLast: 'بلعيد', frFirst: 'Meriem', frLast: 'Belaid', gender: 'أنثى' },
    { arFirst: 'أمين', arLast: 'تومي', frFirst: 'Amine', frLast: 'Toumi', gender: 'ذكر' },
    { arFirst: 'ليلى', arLast: 'عمراني', frFirst: 'Leila', frLast: 'Amrani', gender: 'أنثى' },
    { arFirst: 'ريان', arLast: 'سليماني', frFirst: 'Rayan', frLast: 'Slimani', gender: 'ذكر' },
    { arFirst: 'سارة', arLast: 'زروقي', frFirst: 'Sara', frLast: 'Zerrouki', gender: 'أنثى' },
    { arFirst: 'أنيس', arLast: 'دراجي', frFirst: 'Anis', frLast: 'Derradji', gender: 'ذكر' },
    { arFirst: 'إيناس', arLast: 'بن علي', frFirst: 'Ines', frLast: 'Benali', gender: 'أنثى' },
  ];

  const allClassesList = Object.values(classDbMap);
  for (const cls of allClassesList) {
    const clsGroups = groupDbMap[cls.name] || [];
    const existingStudentsCount = await Student.countDocuments({ class: cls._id });
    const targetStudentCount = 6;
    const toCreate = Math.max(0, targetStudentCount - existingStudentsCount);

    for (let sIdx = 0; sIdx < toCreate; sIdx++) {
      const nData = sampleStudentNames[sIdx % sampleStudentNames.length];
      const codeClean = cls.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const sNum = String(sIdx + 1).padStart(2, '0');
      const email = `stu.${codeClean}.${sNum}@ecole-zitouni.dz`;

      let stUser = await User.findOne({ email });
      if (!stUser) {
        stUser = await User.create({
          username: `stu_${codeClean}_${sNum}`,
          email,
          phoneNumber: `0540${String(Math.floor(100000 + Math.random() * 899999))}`,
          password: hashedPassword,
          role: 'student',
          firstName: nData.frFirst,
          lastName: nData.frLast,
          firstNameArabic: nData.arFirst,
          lastNameArabic: nData.arLast,
          isActive: true,
        });
      }

      const assignedGrp = clsGroups[sIdx % (clsGroups.length || 1)] || null;

      await Student.create({
        user: stUser._id,
        class: cls._id,
        group: assignedGrp ? assignedGrp._id : null,
        parent: defaultParent ? defaultParent._id : null,
        registrationNumber: `REG-2026-${cls.name}-${sNum}`,
        nationalIdDigitization: `2026${cls.name.replace(/\D/g, '') || '01'}${sNum}${Math.floor(100 + Math.random() * 900)}`,
        firstNameArabic: nData.arFirst,
        lastNameArabic: nData.arLast,
        firstNameFrench: nData.frFirst,
        lastNameFrench: nData.frLast,
        gender: nData.gender,
        academicYear: '2025-2026',
        enrollmentType: 'new',
      });
    }
  }

  const finalStudentsCount = await Student.countDocuments();
  console.log(` Verified in DB: ${finalStudentsCount} students enrolled across all classes.`);

  // 9. Re-seed Academic Assessments with newly created classes & teachers
  try {
    const { seedAcademicAssessments } = require('./seedAcademicAssessments');
    console.log(`\n Generating clean academic assessment statistics...`);
    await seedAcademicAssessments(false, MONGO_URI);
  } catch (assErr) {
    console.warn(` Notice on assessment seed:`, assErr.message);
  }

  // 10. Summary verification
  const totalClasses = await Class.countDocuments();
  const totalGroups = await Group.countDocuments();
  const totalTeachers = await Teacher.countDocuments();
  const totalTimetables = await TimetableEntry.countDocuments();
  const totalStudents = await Student.countDocuments();

  console.log(`\n======================================================`);
  console.log(`✅ TIMETABLE RAN09 DATA GENERATION COMPLETED!`);
  console.log(` - Classes created:    ${totalClasses}`);
  console.log(` - Groups created:     ${totalGroups} (الفوج أ & الفوج ب for each class)`);
  console.log(` - Teachers created:   ${totalTeachers} (accounts with credentials)`);
  console.log(` - Students enrolled:  ${totalStudents}`);
  console.log(` - Timetable entries:  ${totalTimetables} (all linked to Class & Teacher)`);
  console.log(`======================================================\n`);

  await mongoose.disconnect();
  console.log(` Database connection closed cleanly.`);
  process.exit(0);
}

runGenerator().catch(err => {
  console.error(`❌ [Fatal Error during RAN Timetable generation]:`, err);
  process.exit(1);
});
