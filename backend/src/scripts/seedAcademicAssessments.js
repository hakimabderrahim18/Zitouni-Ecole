/**
 * Comprehensive Academic Assessments & Evaluation Statistics Seed
 * Seeds realistic data for:
 * - Educational Reports & Statistics Dashboard (التقارير والإحصائيات التربوية)
 * - Exam & Class Statistics (إحصائيات الفروض والأقسام)
 * - Teacher Completion Progress (متابعة إنجاز الأساتذة)
 * 
 * Works for both Local MongoDB and MongoDB Atlas via ATLAS_URI or MONGODB_URI.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');
const Class = require('../models/class.model');
const Group = require('../models/group.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const Assessment = require('../models/assessment.model');
const ParentNotice = require('../models/parentNotice.model');

const MONGO_URI = process.env.ATLAS_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/zitouni_school';

const STUDENT_NAMES_DATA = [
  { arFirst: 'محمد الأمين', arLast: 'بلقاسم', frFirst: 'Mohamed El Amine', frLast: 'Belkacem', gender: 'ذكر' },
  { arFirst: 'مريم', arLast: 'بن علي', frFirst: 'Meriem', frLast: 'Benali', gender: 'أنثى' },
  { arFirst: 'عبد الرحمان', arLast: 'زروقي', frFirst: 'Abderrahmane', frLast: 'Zerrouki', gender: 'ذكر' },
  { arFirst: 'إيناس', arLast: 'حداد', frFirst: 'Ines', frLast: 'Haddad', gender: 'أنثى' },
  { arFirst: 'سامي', arLast: 'دراجي', frFirst: 'Sami', frLast: 'Derradji', gender: 'ذكر' },
  { arFirst: 'نور الهدى', arLast: 'مزيان', frFirst: 'Nour El Houda', frLast: 'Meziane', gender: 'أنثى' },
  { arFirst: 'عصام', arLast: 'بوجمعة', frFirst: 'Issam', frLast: 'Boudjemaa', gender: 'ذكر' },
  { arFirst: 'أميرة', arLast: 'بن عيسى', frFirst: 'Amira', frLast: 'Benaissa', gender: 'أنثى' },
  { arFirst: 'حمزة', arLast: 'بوعلام', frFirst: 'Hamza', frLast: 'Boualem', gender: 'ذكر' },
  { arFirst: 'سيرين', arLast: 'تومي', frFirst: 'Sirine', frLast: 'Toumi', gender: 'أنثى' },
  { arFirst: 'ياسين', arLast: 'عمراني', frFirst: 'Yassine', frLast: 'Amrani', gender: 'ذكر' },
  { arFirst: 'رانيا', arLast: 'صالحي', frFirst: 'Rania', frLast: 'Salhi', gender: 'أنثى' },
  { arFirst: 'أيمن', arLast: 'دحماني', frFirst: 'Aymen', frLast: 'Dahmani', gender: 'ذكر' },
  { arFirst: 'كنزة', arLast: 'سليماني', frFirst: 'Kenza', frLast: 'Slimani', gender: 'أنثى' },
  { arFirst: 'وليد', arLast: 'مزاوي', frFirst: 'Walid', frLast: 'Mezaoui', gender: 'ذكر' },
];

const REMARKS_POOL = [
  'ممتاز، استيعاب عميق ومشاركة مميزة ومواظبة تامة.',
  'جيد جداً، إتقان للمفاهيم واجتهاد متواصل في الحصة.',
  'عمل حسن، نتائج مشجعة وقدرة جيدة على حل المسائل.',
  'مستوى متوسط، يرجى بذل المزيد من التركيز وتفادي التسرع.',
  'يحتاج إلى تحسين في المنهجية وحل التمارين التطبيقية.',
  'جهد ملحوظ مع تحسن تدريجي، واصل المتابعة المنزلية.',
  'عمل منظم ودقة في الإجابات، بارك الله فيك.',
  'مستوى واعد، قادر على تحقيق نتائج أعلى بالانضباط المستمر.',
];

const CLASS_REMARKS = [
  'أظهر تلاميذ القسم تحسناً ملموساً واستيعاباً ممتازاً للمفاهيم الأساسية، مع تفاعل إيجابي في معالجة الإشكاليات.',
  'نتائج جيدة ومشجعة بوجه عام، مع ضرورة تكثيف التمارين التطبيقية لدعم التلاميذ ذوي الصعوبات الظرفية.',
  'مستوى منسجم للقسم، ونسبة تحقيق المعايير تجاوزت الأهداف المسطرة لهذا الثلاثي.',
  'تقويم عالي الدقة يعكس جاهزية التلاميذ للتقويمات الرسمية، مع انضباط كبير داخل الحجرات.',
];

async function seedAcademicAssessments(shouldDisconnect = true, targetUri = null) {
  const uriToUse = targetUri || process.env.ATLAS_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/zitouni_school';
  console.log(`\n======================================================`);
  console.log(`[Seed Academic Assessments] Connecting to database...`);
  console.log(`Target URI: ${uriToUse.replace(/:([^:@]+)@/, ':****@')}`);
  console.log(`======================================================\n`);

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uriToUse);
  }
  console.log(` Connected to MongoDB: ${mongoose.connection.name}`);

  // 1. Fetch core administration & teachers
  const adminUser = await User.findOne({ role: { $in: ['admin', 'school'] } }) || await User.findOne({});
  const teachers = await Teacher.find({}).populate('user');
  console.log(` Found ${teachers.length} teachers in database.`);

  if (!teachers.length) {
    const errorMsg = '❌ No teachers found! Please run basic seed first.';
    console.error(errorMsg);
    if (standalone) process.exit(1);
    throw new Error(errorMsg);
  }

  // 2. Fetch all classes across primary, middle, secondary
  const allClasses = await Class.find({});
  console.log(` Found ${allClasses.length} classes across all levels.`);

  const primaryClasses = allClasses.filter(c => c.level === 'primary');
  const middleClasses = allClasses.filter(c => c.level === 'middle');
  const secondaryClasses = allClasses.filter(c => c.level === 'secondary');

  console.log(` - Primary: ${primaryClasses.length} | Middle: ${middleClasses.length} | Secondary: ${secondaryClasses.length}`);

  // Key targeted classes for rich statistics
  const targetClasses = [
    // Primary
    primaryClasses.find(c => c.name === '1AP') || primaryClasses[0],
    primaryClasses.find(c => c.name === '4AP') || primaryClasses[1] || primaryClasses[0],
    primaryClasses.find(c => c.name === '5AP') || primaryClasses[2] || primaryClasses[0],
    // Middle
    middleClasses.find(c => c.name === '1AM') || middleClasses[0],
    middleClasses.find(c => c.name === '2AM') || middleClasses[1] || middleClasses[0],
    middleClasses.find(c => c.name === '4AM') || middleClasses[2] || middleClasses[0],
    // Secondary
    secondaryClasses.find(c => c.name === '1 Scientifique') || secondaryClasses[0],
    secondaryClasses.find(c => c.name === '2S') || secondaryClasses[1] || secondaryClasses[0],
    secondaryClasses.find(c => c.name === '3S') || secondaryClasses[2] || secondaryClasses[0],
  ].filter(Boolean);

  // 3. Ensure Groups exist for all target classes
  console.log(`\n Ensuring Groups (الأفواج) for targeted classes...`);
  const groupsMap = {};
  for (const cls of targetClasses) {
    let grpA = await Group.findOne({ class: cls._id, name: 'الفوج أ' });
    if (!grpA) {
      grpA = await Group.create({ name: 'الفوج أ', class: cls._id, capacity: 25 });
    }
    let grpB = await Group.findOne({ class: cls._id, name: 'الفوج ب' });
    if (!grpB) {
      grpB = await Group.create({ name: 'الفوج ب', class: cls._id, capacity: 25 });
    }
    groupsMap[cls._id.toString()] = [grpA, grpB];
  }

  // 4. Ensure each target class has at least 8 to 12 enrolled students
  console.log(` Ensuring full student rosters for targeted classes...`);
  const parents = await Parent.find({}).populate('user');
  const defaultParent = parents[0] || null;

  for (let cIdx = 0; cIdx < targetClasses.length; cIdx++) {
    const cls = targetClasses[cIdx];
    const existingCount = await Student.countDocuments({ class: cls._id });
    const targetCount = 10;
    const needed = Math.max(0, targetCount - existingCount);

    if (needed > 0) {
      const clsGroups = groupsMap[cls._id.toString()] || [];
      for (let sIdx = 0; sIdx < needed; sIdx++) {
        const nameData = STUDENT_NAMES_DATA[(cIdx * 3 + sIdx) % STUDENT_NAMES_DATA.length];
        const uniqueNum = `${cIdx + 1}${sIdx + 1}`.padStart(3, '0');
        const regNum = `REG-2026-${cls.name.replace(/\s+/g, '')}-${uniqueNum}`;
        const natId = `2026${cls.name.replace(/\D/g, '') || '01'}${uniqueNum}${Math.floor(100 + Math.random() * 900)}`;

        const userEmail = `student.${cls.name.toLowerCase().replace(/\s+/g, '')}.${uniqueNum}@ecole-zitouni.dz`;
        let studentUser = await User.findOne({ email: userEmail });
        if (studentUser) {
          const existingStudent = await Student.findOne({ user: studentUser._id });
          if (existingStudent) {
            continue;
          }
        } else {
          studentUser = await User.create({
            username: `stu_${cls.name.toLowerCase().replace(/\s+/g, '')}_${uniqueNum}`,
            email: userEmail,
            password: 'password123',
            role: 'student',
            firstName: nameData.frFirst,
            lastName: nameData.frLast,
            firstNameArabic: nameData.arFirst,
            lastNameArabic: nameData.arLast,
            phoneNumber: `055${String(Math.floor(1000000 + Math.random() * 8999999))}`,
            isActive: true,
          });
        }

        const assignedGroup = clsGroups[sIdx % (clsGroups.length || 1)] || null;

        await Student.create({
          user: studentUser._id,
          class: cls._id,
          group: assignedGroup ? assignedGroup._id : null,
          parent: defaultParent ? defaultParent._id : null,
          registrationNumber: regNum,
          nationalIdDigitization: natId,
          firstNameArabic: nameData.arFirst,
          lastNameArabic: nameData.arLast,
          firstNameFrench: nameData.frFirst,
          lastNameFrench: nameData.frLast,
          gender: nameData.gender,
          academicYear: '2026-2027',
          enrollmentType: 'new',
        });
      }
    }
  }

  // 5. Update teacher assigned classes so all 6 teachers cover target classes
  console.log(`\n Verifying teacher class assignments...`);
  const teacherClassConfigs = [
    { email: 'teacher.math@ecole-zitouni.dz', classes: ['1AP', '1AM', '3S'], subject: 'رياضيات' },
    { email: 'teacher.science@ecole-zitouni.dz', classes: ['1AP', '4AP', '2AM', '3S'], subject: 'علوم طبيعية' },
    { email: 'teacher.arabe@ecole-zitouni.dz', classes: ['1AP', '4AP', '1AM', '2AM', '3S'], subject: 'لغة عربية' },
    { email: 'teacher.physique@ecole-zitouni.dz', classes: ['2AM', '4AM', '1 Scientifique', '3S'], subject: 'فيزياء' },
    { email: 'teacher.francais@ecole-zitouni.dz', classes: ['4AP', '1AM', '2AM', '1 Scientifique'], subject: 'لغة فرنسية' },
    { email: 'teacher.histoire@ecole-zitouni.dz', classes: ['4AP', '1AM', '2AM', '3S'], subject: 'تاريخ وجغرافيا' },
  ];

  for (const cfg of teacherClassConfigs) {
    const tUser = await User.findOne({ email: cfg.email });
    if (!tUser) continue;
    const tDoc = await Teacher.findOne({ user: tUser._id });
    if (!tDoc) continue;

    const matchedClasses = allClasses.filter(c => cfg.classes.includes(c.name));
    const matchedClassIds = matchedClasses.map(c => c._id);

    // Merge without duplicates
    const currentIds = (tDoc.classes || []).map(c => c.toString());
    const newIds = matchedClassIds.filter(id => !currentIds.includes(id.toString()));
    if (newIds.length > 0) {
      tDoc.classes = [...(tDoc.classes || []), ...newIds];
      if (!tDoc.subjects.includes(cfg.subject)) {
        tDoc.subjects.push(cfg.subject);
      }
      await tDoc.save();
    }
  }

  // 6. Delete old assessments to avoid inconsistent or partial records
  console.log(`\n Resetting assessments collection for pristine statistics...`);
  await Assessment.deleteMany({});

  // 7. Generate Rich Assessment Sheets
  console.log(` Generating realistic, multi-cycle Assessments across all teachers & classes...`);

  const activeTeachers = await Teacher.find({}).populate('user').populate('classes');
  let createdAssessmentsCount = 0;

  // Types of assessments to generate
  const assessmentTemplates = [
    {
      type: 'الفرض الأول',
      daysAgo: 22,
      status: 'approved',
      isPublished: true,
      gradeOffset: 0,
      remark: 'أظهر تلاميذ القسم تحسناً ملحوظاً في هذا الفرض، مع استيعاب جيد للدروس التأسيسية.',
    },
    {
      type: 'التقويم المستمر',
      daysAgo: 14,
      status: 'approved',
      isPublished: true,
      gradeOffset: 0.8,
      remark: 'مشاركة صفية متفاعلة وانضباط عالي في إنجاز الواجبات المنزلية والأنشطة البيداغوجية.',
    },
    {
      type: 'الفرض الثاني',
      daysAgo: 5,
      status: 'submitted',
      isPublished: false,
      gradeOffset: -0.4,
      remark: 'كشف الفرض الثاني مكتمل ومدقق ومحال على إدارة المؤسسة للمراجعة والاعتماد.',
    },
    {
      type: 'اختبار الفصل الأول',
      daysAgo: 1,
      status: 'draft',
      isPublished: false,
      gradeOffset: 0.2,
      remark: 'مسودة اختبار الفصل الأول قيد التحرير وإدخال النقاط.',
    },
  ];

  for (let tIdx = 0; tIdx < activeTeachers.length; tIdx++) {
    const teacher = activeTeachers[tIdx];
    if (!teacher.classes || !teacher.classes.length) continue;

    const teacherSubject = teacher.subjects?.[0] || 'المادة المقررة';

    // Each teacher takes 2 to 3 classes
    const classesForTeacher = teacher.classes.slice(0, 3);

    for (let cIdx = 0; cIdx < classesForTeacher.length; cIdx++) {
      const cls = classesForTeacher[cIdx];
      const students = await Student.find({ class: cls._id }).populate('user');
      if (!students.length) continue;

      // Decide how many assessment sheets this teacher/class pair gets
      // Giving different teachers different progress rates (from 60% to 100%)
      const templateCount = (tIdx % 2 === 0) ? 3 : 4;
      const templatesToUse = assessmentTemplates.slice(0, templateCount);

      for (let tmplIdx = 0; tmplIdx < templatesToUse.length; tmplIdx++) {
        const tmpl = templatesToUse[tmplIdx];
        const aDate = new Date(Date.now() - tmpl.daysAgo * 24 * 60 * 60 * 1000);
        const pubDate = tmpl.isPublished ? new Date(aDate.getTime() + 4 * 24 * 60 * 60 * 1000) : null;
        const appDate = ['approved', 'submitted'].includes(tmpl.status) ? new Date(aDate.getTime() + 2 * 24 * 60 * 60 * 1000) : null;

        // Generate realistic student grade records
        const records = students.map((st, sIndex) => {
          // Absent condition (1 student absent every ~12 students)
          const isAbsent = (sIndex + tmplIdx) % 11 === 0 && tmpl.type !== 'التقويم المستمر';

          if (isAbsent) {
            return {
              student: st._id,
              studentUser: st.user?._id,
              grade: null,
              isAbsent: true,
              individualRemark: 'غياب مبرر بتقرير طبي.',
              isPublished: tmpl.isPublished,
              publishedAt: pubDate,
            };
          }

          // Grade algorithm: bell curve around 14.5 with some 8-9 and some 18-19.5
          const seedSeed = (sIndex * 3 + tIdx * 5 + tmplIdx * 7) % 17;
          let grade = 11.5 + (seedSeed * 0.5) + tmpl.gradeOffset;
          if (sIndex === 0) grade = 19.5; // Top student
          if (sIndex === 1) grade = 18.0;
          if (sIndex === students.length - 1 && students.length > 5) grade = 8.5; // Occasional lower grade

          grade = Math.min(20, Math.max(7, Math.round(grade * 2) / 2));

          const remark = REMARKS_POOL[(sIndex + tmplIdx + tIdx) % REMARKS_POOL.length];

          return {
            student: st._id,
            studentUser: st.user?._id,
            grade,
            isAbsent: false,
            individualRemark: remark,
            isPublished: tmpl.isPublished,
            publishedAt: pubDate,
          };
        });

        // Audit History trace
        const history = [
          {
            action: 'create_draft',
            by: teacher.user?._id,
            byName: `${teacher.user?.firstName || ''} ${teacher.user?.lastName || ''}`.trim() || 'الأستاذ',
            at: aDate,
            details: `إنشاء مسودة ${tmpl.type} لمادة ${teacherSubject}`,
          },
        ];

        if (tmpl.status === 'submitted' || tmpl.status === 'approved') {
          history.push({
            action: 'submit_to_admin',
            by: teacher.user?._id,
            byName: `${teacher.user?.firstName || ''} ${teacher.user?.lastName || ''}`.trim() || 'الأستاذ',
            at: new Date(aDate.getTime() + 1 * 24 * 60 * 60 * 1000),
            details: 'إرسال كشف النقاط للإدارة التربوية للمراجعة والاعتماد',
          });
        }

        if (tmpl.status === 'approved') {
          history.push({
            action: 'approve',
            by: adminUser?._id,
            byName: 'الإدارة التربوية',
            at: appDate,
            details: 'اعتماد نتائج الفرض بصفة نهائية',
          });
        }

        if (tmpl.isPublished) {
          history.push({
            action: 'publish',
            by: adminUser?._id,
            byName: 'الإدارة التربوية',
            at: pubDate,
            details: 'نشر العلامات في فضاء الأولياء والتلاميذ',
          });
        }

        await Assessment.create({
          academicYear: '2026-2027',
          cycle: cls.level, // 'primary', 'middle', 'secondary'
          class: cls._id,
          subject: teacherSubject,
          teacher: teacher._id,
          teacherUser: teacher.user?._id,
          assessmentType: tmpl.type,
          assessmentDate: aDate,
          maxGrade: 20,
          status: tmpl.status,
          classRemark: CLASS_REMARKS[(cIdx + tmplIdx) % CLASS_REMARKS.length],
          records,
          isPublished: tmpl.isPublished,
          publishedAt: pubDate,
          publishedBy: tmpl.isPublished ? adminUser?._id : null,
          publishScope: 'general',
          approvedAt: tmpl.status === 'approved' ? appDate : null,
          approvedBy: tmpl.status === 'approved' ? adminUser?._id : null,
          submittedAt: ['submitted', 'approved'].includes(tmpl.status) ? new Date(aDate.getTime() + 1 * 24 * 60 * 60 * 1000) : null,
          history,
        });

        createdAssessmentsCount++;
      }
    }
  }

  console.log(`\n Successfully seeded ${createdAssessmentsCount} assessments across all teachers and classes!`);

  // 8. Print quick summary of newly created statistics
  const total = await Assessment.countDocuments({});
  const primaryCount = await Assessment.countDocuments({ cycle: 'primary' });
  const middleCount = await Assessment.countDocuments({ cycle: 'middle' });
  const secondaryCount = await Assessment.countDocuments({ cycle: 'secondary' });
  const approvedCount = await Assessment.countDocuments({ status: 'approved' });
  const submittedCount = await Assessment.countDocuments({ status: 'submitted' });
  const draftCount = await Assessment.countDocuments({ status: 'draft' });

  console.log(`\n================== STATISTICS SUMMARY ==================`);
  console.log(` Total Assessments: ${total}`);
  console.log(` By Cycle: Primary=${primaryCount} | Middle=${middleCount} | Secondary=${secondaryCount}`);
  console.log(` By Status: Approved=${approvedCount} | Submitted=${submittedCount} | Draft=${draftCount}`);
  console.log(`========================================================\n`);

  if (shouldDisconnect) {
    await mongoose.disconnect();
    console.log(`[Seed Complete] Database connection closed.`);
    process.exit(0);
  }
  return { success: true, count: createdAssessmentsCount };
}

if (require.main === module) {
  seedAcademicAssessments(true).catch((err) => {
    console.error(`❌ [Seed Failed]:`, err);
    process.exit(1);
  });
}

module.exports = { seedAcademicAssessments };
