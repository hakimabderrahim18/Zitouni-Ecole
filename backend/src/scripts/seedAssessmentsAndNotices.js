const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const connectDB = require('../config/db');
const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');
const Class = require('../models/class.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const Assessment = require('../models/assessment.model');
const ParentNotice = require('../models/parentNotice.model');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to DB, creating assessments and parent notices...');

    // 1. Find teachers
    const teachers = await Teacher.find({}).populate('user').populate('classes');
    if (!teachers.length) {
      console.log('[Seed] No teachers found in DB. Run main seed first.');
      process.exit(0);
    }

    const adminUser = await User.findOne({ role: { $in: ['admin', 'school'] } });

    // Clean existing assessments & parent notices
    await Assessment.deleteMany({});
    await ParentNotice.deleteMany({});

    // 2. Create Assessments for teachers
    for (const teacher of teachers.slice(0, 3)) {
      if (!teacher.classes || !teacher.classes.length) continue;
      const targetClass = teacher.classes[0];
      const subject = teacher.subjects?.[0] || 'الرياضيات';

      const students = await Student.find({ class: targetClass._id }).populate('user');
      if (!students.length) continue;

      // Sample remarks list
      const remarks = [
        'ممتاز، استيعاب عميق ومشاركة مميزة.',
        'جيد جداً، واصل على هذا النسق.',
        'عمل جيد، نتائج مشجعة.',
        'مستوى متوسط، يحتاج للمزيد من التركيز.',
        'يحتاج إلى تحسين في حل التمارين.',
        'يحتاج إلى متابعة منزلية دورية.',
      ];

      // Assessment 1: Published Approved Exam (الفرض الأول)
      const records1 = students.map((st, i) => {
        const gradeVal = 10 + ((i * 3 + 2) % 10) + ((i % 2 === 0) ? 0.5 : 0);
        return {
          student: st._id,
          studentUser: st.user?._id,
          grade: Math.min(20, Math.max(7, gradeVal)),
          isAbsent: i === students.length - 1, // last student absent
          individualRemark: remarks[i % remarks.length],
          isPublished: true,
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        };
      });

      await Assessment.create({
        academicYear: '2026-2027',
        cycle: targetClass.level,
        class: targetClass._id,
        subject,
        teacher: teacher._id,
        teacherUser: teacher.user._id,
        assessmentType: 'الفرض الأول',
        assessmentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        maxGrade: 20,
        status: 'approved',
        classRemark: 'أظهر تلاميذ القسم تحسناً ملحوظاً في هذا الفرض، مع ضرورة التركيز على المفاهيم الهندسية الأساسية.',
        records: records1,
        isPublished: true,
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        publishedBy: adminUser?._id,
        publishScope: 'general',
        approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        approvedBy: adminUser?._id,
        history: [
          {
            action: 'create_draft',
            by: teacher.user._id,
            byName: `${teacher.user.firstName} ${teacher.user.lastName}`,
            at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            details: 'إنشاء مسودة الفرض الأول',
          },
          {
            action: 'submit_to_admin',
            by: teacher.user._id,
            byName: `${teacher.user.firstName} ${teacher.user.lastName}`,
            at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            details: 'إرسال الكشف إلى الإدارة للمراجعة',
          },
          {
            action: 'approve',
            by: adminUser?._id,
            byName: 'إدارة المدرسة',
            at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            details: 'اعتماد الكشف نهائياً',
          },
          {
            action: 'publish',
            by: adminUser?._id,
            byName: 'إدارة المدرسة',
            at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            details: 'نشر النتائج في فضاء الأولياء والتلاميذ',
          },
        ],
      });

      // Assessment 2: Submitted to Admin (التقويم المستمر)
      const records2 = students.map((st, i) => ({
        student: st._id,
        studentUser: st.user?._id,
        grade: 12 + (i % 8),
        isAbsent: false,
        individualRemark: remarks[(i + 1) % remarks.length],
        isPublished: false,
      }));

      await Assessment.create({
        academicYear: '2026-2027',
        cycle: targetClass.level,
        class: targetClass._id,
        subject,
        teacher: teacher._id,
        teacherUser: teacher.user._id,
        assessmentType: 'التقويم المستمر',
        assessmentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        maxGrade: 20,
        status: 'submitted',
        classRemark: 'مشاركة ممتازة للقسم في الأنشطة الصفية والواجبات المنزلية.',
        records: records2,
        isPublished: false,
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        history: [
          {
            action: 'create_draft',
            by: teacher.user._id,
            byName: `${teacher.user.firstName} ${teacher.user.lastName}`,
            at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            details: 'إنشاء مسودة التقويم المستمر',
          },
          {
            action: 'submit_to_admin',
            by: teacher.user._id,
            byName: `${teacher.user.firstName} ${teacher.user.lastName}`,
            at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            details: 'إرسال كشف التقويم المستمر للإدارة للمراجعة',
          },
        ],
      });

      // Assessment 3: Draft (الفرض الثاني)
      const records3 = students.slice(0, 5).map((st, i) => ({
        student: st._id,
        studentUser: st.user?._id,
        grade: 14 + (i % 6),
        isAbsent: false,
        individualRemark: 'عمل واعد',
        isPublished: false,
      }));

      await Assessment.create({
        academicYear: '2026-2027',
        cycle: targetClass.level,
        class: targetClass._id,
        subject,
        teacher: teacher._id,
        teacherUser: teacher.user._id,
        assessmentType: 'الفرض الثاني',
        assessmentDate: new Date(),
        maxGrade: 20,
        status: 'draft',
        classRemark: 'قيد إدخال باقي نقاط القسم.',
        records: records3,
        isPublished: false,
        history: [
          {
            action: 'create_draft',
            by: teacher.user._id,
            byName: `${teacher.user.firstName} ${teacher.user.lastName}`,
            at: new Date(),
            details: 'حفظ مسودة أولية',
          },
        ],
      });
    }

    console.log('[Seed] Assessments seeded.');

    // 3. Create Sample Parent Notices
    const sampleClass = await Class.findOne({});
    const sampleStudents = await Student.find({}).limit(2);

    // Notice 1: Official Reception Day Template (Section 8.2)
    await ParentNotice.create({
      title: 'برمجة يوم استقبال أولياء التلاميذ',
      content:
        'تعلم إدارة مؤسسة حبر وألوان أولياء التلاميذ أنه سيتم استقبالهم يوم السبت الموافق لـ 21 نوفمبر، من الساعة 09:00 إلى 13:00، وذلك من أجل متابعة الوضعية الدراسية والتربوية لأبنائهم. مرحباً بالجميع.',
      noticeType: 'reception',
      targetAudience: 'all',
      sendType: 'immediate',
      appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      appointmentEndTime: '13:00',
      appointmentLocation: 'مقر المؤسسة - قاعة الاستقبال الكبرى',
      status: 'sent',
      sender: adminUser?._id,
      senderName: 'إدارة مؤسسة حبر وألوان',
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      recipientCount: 45,
    });

    // Notice 2: Exam Calendar Announcement
    await ParentNotice.create({
      title: 'رزنامة فروض واختبارات الثلاثي الأول',
      content:
        'نحيطكم علماً بأن فروض المراقبة المستمرة ستنطلق ابتداءً من الأسبوع المقبل وفق الجداول المعلنة في فضاء التلميذ والولي. يُرجى مرافقة الأبناء وحثهم على المراجعة الجادة.',
      noticeType: 'announcement',
      targetAudience: 'all',
      sendType: 'immediate',
      status: 'sent',
      sender: adminUser?._id,
      senderName: 'المديرية العامة',
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      recipientCount: 45,
    });

    // Notice 3: Scheduled Notice (Section 8.1 & 8.3)
    await ParentNotice.create({
      title: 'تذكير: موعد اللقاء التربوي الدوري',
      content:
        'تذكير لكافة الأولياء المعنيين بموعد اللقاء التربوي المبرمج غداً، نرجو الحضور في الموعد المحدد لضمان حسن سير الاستقبال.',
      noticeType: 'reminder',
      targetAudience: sampleClass ? 'class' : 'all',
      targetClass: sampleClass?._id,
      sendType: 'scheduled',
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      appointmentLocation: 'مكتب الإدارة',
      status: 'scheduled',
      sender: adminUser?._id,
      senderName: 'إدارة مدرسة حبر',
      idempotencyKey: 'seed_sched_key_001',
    });

    console.log('[Seed] Parent notices seeded.');
    console.log('[Seed] Completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
