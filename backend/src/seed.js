const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
require('dotenv').config();

// All 30 Models
const User = require('./models/user.model');
const Teacher = require('./models/teacher.model');
const Student = require('./models/student.model');
const Parent = require('./models/parent.model');
const Class = require('./models/class.model');
const Group = require('./models/group.model');
const Module = require('./models/module.model');
const Supervisor = require('./models/supervisor.model');
const Receptionist = require('./models/receptionist.model');
const Attendance = require('./models/attendance.model');
const AbsenceWarning = require('./models/absenceWarning.model');
const LessonNotebook = require('./models/lessonNotebook.model');
const AdministrativeRequest = require('./models/administrativeRequest.model');
const Announcement = require('./models/announcement.model');
const Message = require('./models/message.model');
const Notification = require('./models/notification.model');
const Schedule = require('./models/schedule.model');
const Course = require('./models/course.model');
const Document = require('./models/document.model');
const StaffAttendance = require('./models/staffAttendance.model');
const { FinanceTransaction, FinancialProduct, SalaryDeduction, Payroll } = require('./models/finance.model');
const Payment = require('./models/payment.model');
const CanteenReservation = require('./models/canteenReservation.model');
const ExitPass = require('./models/exitPass.model');
const MaterialDamage = require('./models/materialDamage.model');
const VisitorLog = require('./models/visitorLog.model');
const SchoolSetting = require('./models/schoolSetting.model');
const AuditLog = require('./models/auditLog.model');
const BackupLog = require('./models/backupLog.model');
const TimetableEntry = require('./models/timetableEntry.model');

let isSeeding = false;

const seedDatabase = async (standalone = false) => {
  if (isSeeding) {
    console.log('[Seed] Seed is already in progress, skipping concurrent execution.');
    return { success: true, message: 'Seed already in progress.' };
  }
  isSeeding = true;

  try {
    let shouldDisconnect = false;
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/zitouni_school';
      console.log(`[Seed] Connecting to MongoDB: ${mongoUri}`);
      await mongoose.connect(mongoUri);
      console.log('[Seed] MongoDB Connected successfully.');
      shouldDisconnect = standalone;
    }

    // 1. Clear previous collections
    console.log('[Seed] Clearing existing collections for clean seed...');
    await Promise.all([
      User.deleteMany({}),
      Teacher.deleteMany({}),
      Student.deleteMany({}),
      Parent.deleteMany({}),
      Class.deleteMany({}),
      Group.deleteMany({}),
      Module.deleteMany({}),
      Supervisor.deleteMany({}),
      Receptionist.deleteMany({}),
      Attendance.deleteMany({}),
      AbsenceWarning.deleteMany({}),
      LessonNotebook.deleteMany({}),
      AdministrativeRequest.deleteMany({}),
      Announcement.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      Schedule.deleteMany({}),
      Course.deleteMany({}),
      Document.deleteMany({}),
      StaffAttendance.deleteMany({}),
      SalaryDeduction.deleteMany({}),
      Payroll.deleteMany({}),
      FinancialProduct.deleteMany({}),
      FinanceTransaction.deleteMany({}),
      Payment.deleteMany({}),
      CanteenReservation.deleteMany({}),
      ExitPass.deleteMany({}),
      MaterialDamage.deleteMany({}),
      VisitorLog.deleteMany({}),
      SchoolSetting.deleteMany({}),
      AuditLog.deleteMany({}),
      BackupLog.deleteMany({}),
    ]);
    console.log('[Seed] All specified collections cleared.');

    // 2. School Settings (مؤسسة حبر وألوان - مدرسة حبر)
    console.log('[Seed] Seeding SchoolSetting...');
    const schoolSettings = await SchoolSetting.create({
      schoolNameArabic: 'مدرسة حبر',
      schoolNameFrench: 'Groupe scolaire Encre & Pastel',
      slogan: 'يا نشء أنت رجاؤنا',
      institutionName: 'مؤسسة التربية والتعليم حبر وألوان الخاصة',
      location: 'أولاد فايت - الجزائر غرب',
      contactPhone: '0554075701',
      primaryColor: '#7B1E3A',
      secondaryColor: '#F3E9DC',
      accentColor: '#C9A24D',
      textColor: '#2B2022',
      titleFont: 'Cormorant Garamond',
      bodyFont: 'Lato',
      academicYear: '2026-2027',
      sessionTimeoutMinutes: 30,
      maxFailedLoginAttempts: 4,
      carouselImages: [
        {
          url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1400&q=85',
          title: 'فضاءات تعليمية عصرية ومحفزة',
          subtitle: 'قاعات تدريس مجهزة بأحدث السبورات الذكية والوسائط التفاعلية للأطوار الثلاثة',
        },
        {
          url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1400&q=85',
          title: 'مخابر علمية وتجريبية متقدمة',
          subtitle: 'تجارب تطبيقية في الفيزياء والكيمياء والعلوم الطبيعية لتحضير متميز للبكالوريا',
        },
        {
          url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1400&q=85',
          title: 'فضاء المطالعة ومصادر المعرفة',
          subtitle: 'مكتبة شاملة وقاعات مذاكرة هادئة لتنمية حب القراءة والتعلم الذاتي',
        },
        {
          url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1400&q=85',
          title: 'نوادي الروبوتيك والذكاء الاصطناعي',
          subtitle: 'ورشات أسبوعية لاكتشاف البرمجة والعلوم التكنولوجية ومسابقات الابتكار',
        },
        {
          url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=85',
          title: 'يا نشء أنت رجاؤنا',
          subtitle: 'مؤسسة التربية والتعليم حبر وألوان الخاصة — رعاية متكاملة تصنع التفوق',
        },
      ],
    });
    console.log('[Seed] SchoolSetting seeded.');

    // 3. School Modules (المواد الدراسية)
    console.log('[Seed] Seeding Modules...');
    const moduleNames = [
      'لغة عربية',
      'لغة فرنسية',
      'لغة انجليزية',
      'لغة اسبانية',
      'لغة ألمانية',
      'رياضيات',
      'فيزياء',
      'علوم طبيعية',
      'تاريخ وجغرافيا',
      'تربية مدنية',
      'تربية اسلامية',
      'رسم',
      'تربية بدنية',
      'تكنولوجيا (هندسة مدنية وكهربائية وميكانيكية والطرائق)',
    ];
    const moduleDocs = await Module.insertMany(moduleNames.map((name) => ({ name })));
    console.log(`[Seed] ${moduleDocs.length} Modules seeded.`);

    // 4. Classes across cycles (Primary, Middle, Secondary) + 2 Groups each
    console.log('[Seed] Seeding Classes & Groups...');
    const cycleClasses = [
      // Primaire
      { name: '1AP', level: 'primary', description: 'السنة الأولى ابتدائي' },
      { name: '2AP', level: 'primary', description: 'السنة الثانية ابتدائي' },
      { name: '3AP', level: 'primary', description: 'السنة الثالثة ابتدائي' },
      { name: '4AP', level: 'primary', description: 'السنة الرابعة ابتدائي' },
      { name: '5AP', level: 'primary', description: 'السنة الخامسة ابتدائي' },
      // Moyen
      { name: '1AM', level: 'middle', description: 'السنة الأولى متوسط' },
      { name: '2AM', level: 'middle', description: 'السنة الثانية متوسط' },
      { name: '3AM', level: 'middle', description: 'السنة الثالثة متوسط' },
      { name: '4AM', level: 'middle', description: 'السنة الرابعة متوسط' },
      // Secondaire
      { name: '1 Scientifique', level: 'secondary', description: 'أولى ثانوي علمي' },
      { name: '1 Lettres', level: 'secondary', description: 'أولى ثانوي أدبي' },
      { name: '2S', level: 'secondary', description: 'ثانية علوم تجريبية' },
      { name: '2M', level: 'secondary', description: 'ثانية رياضيات' },
      { name: '2MT', level: 'secondary', description: 'ثانية تقني رياضي' },
      { name: '2GT', level: 'secondary', description: 'ثانية تسيير واقتصاد' },
      { name: '2LP', level: 'secondary', description: 'ثانية لغات أجنبية' },
      { name: '2LV', level: 'secondary', description: 'ثانية آداب وفلسفة' },
      { name: '3S', level: 'secondary', description: 'ثالثة علوم تجريبية (بكالوريا)' },
      { name: '3M', level: 'secondary', description: 'ثالثة رياضيات (بكالوريا)' },
      { name: '3MT', level: 'secondary', description: 'ثالثة تقني رياضي (بكالوريا)' },
      { name: '3GT', level: 'secondary', description: 'ثالثة تسيير واقتصاد (بكالوريا)' },
      { name: '3LP', level: 'secondary', description: 'ثالثة آداب وفلسفة (بكالوريا)' },
    ];

    const classDocs = [];
    const groupDocs = [];
    for (const cls of cycleClasses) {
      const createdClass = await Class.create(cls);
      classDocs.push(createdClass);
      const gA = await Group.create({ name: 'الفوج أ', class: createdClass._id, capacity: 30 });
      const gB = await Group.create({ name: 'الفوج ب', class: createdClass._id, capacity: 30 });
      groupDocs.push(gA, gB);
    }
    console.log(`[Seed] ${classDocs.length} Classes and ${groupDocs.length} Groups created.`);

    const findClass = (name) => classDocs.find((c) => c.name === name);
    const groupsOf = (classId) => groupDocs.filter((g) => g.class.toString() === classId.toString());

    const c1AP = findClass('1AP');
    const c4AP = findClass('4AP');
    const c5AP = findClass('5AP');
    const c1AM = findClass('1AM');
    const c2AM = findClass('2AM');
    const c4AM = findClass('4AM');
    const c1Sci = findClass('1 Scientifique');
    const c2S = findClass('2S');
    const c3S = findClass('3S');
    const c3M = findClass('3M');

    const [g1AP_A, g1AP_B] = groupsOf(c1AP._id);
    const [g4AP_A, g4AP_B] = groupsOf(c4AP._id);
    const [g1AM_A, g1AM_B] = groupsOf(c1AM._id);
    const [g2AM_A, g2AM_B] = groupsOf(c2AM._id);
    const [g1Sci_A, g1Sci_B] = groupsOf(c1Sci._id);
    const [g3S_A, g3S_B] = groupsOf(c3S._id);

    // Helper to safely upsert core users avoiding race conditions
    const upsertUser = async (uData) => {
      let existing = await User.findOne({
        $or: [{ username: uData.username }, { email: uData.email }]
      }).select('+password');
      if (existing) {
        Object.assign(existing, uData);
        existing.password = uData.password;
        await existing.save();
        return existing;
      }
      return await User.create(uData);
    };

    // 5. Core Platform Users: Admin & School Director
    console.log('[Seed] Seeding Admin & School Director accounts...');
    const adminUser = await upsertUser({
      username: 'admin',
      email: 'admin@ecole-zitouni.dz',
      password: 'Admin123!',
      firstName: 'مالك',
      lastName: 'زيتوني',
      firstNameArabic: 'مالك',
      lastNameArabic: 'زيتوني',
      firstNameFrench: 'Malek',
      lastNameFrench: 'Zitouni',
      role: 'admin',
      phoneNumber: '0550000000',
      baseSalary: 130000,
    });

    const schoolUser = await upsertUser({
      username: 'school',
      email: 'school@ecole-zitouni.dz',
      password: 'School123!',
      firstName: 'أمال',
      lastName: 'بن علي',
      firstNameArabic: 'أمال',
      lastNameArabic: 'بن علي',
      firstNameFrench: 'Amel',
      lastNameFrench: 'Benali',
      role: 'school',
      phoneNumber: '0550000001',
      baseSalary: 110000,
    });

    // 6. Supervisors (General & Pedagogical)
    console.log('[Seed] Seeding Supervisors...');
    const genSupUser = await upsertUser({
      username: 'superviseur.gen',
      email: 'superviseur.gen@ecole-zitouni.dz',
      password: '0550112233',
      firstName: 'عمر',
      lastName: 'القايد',
      firstNameArabic: 'عمر',
      lastNameArabic: 'القايد',
      firstNameFrench: 'Omar',
      lastNameFrench: 'El Kaid',
      role: 'general_supervisor',
      phoneNumber: '0550112233',
      baseSalary: 85000,
      salaryDeductionPerAbsence: 3000,
    });
    const genSupDoc = await Supervisor.create({
      user: genSupUser._id,
      supervisorType: 'general_supervisor',
      assignedClasses: [c1AP._id, c4AP._id, c1AM._id, c2AM._id, c1Sci._id, c3S._id],
      officeLocation: 'المكتب الرئيسي - الجناح الإداري',
    });

    const pedSupUser = await upsertUser({
      username: 'superviseur.ped',
      email: 'superviseur.ped@ecole-zitouni.dz',
      password: '0550445566',
      firstName: 'زكية',
      lastName: 'بن عيسى',
      firstNameArabic: 'زكية',
      lastNameArabic: 'بن عيسى',
      firstNameFrench: 'Zakia',
      lastNameFrench: 'Benissa',
      role: 'pedagogical_supervisor',
      phoneNumber: '0550445566',
      baseSalary: 78000,
      salaryDeductionPerAbsence: 2800,
    });
    const pedSupDoc = await Supervisor.create({
      user: pedSupUser._id,
      supervisorType: 'pedagogical_supervisor',
      assignedClasses: [c1AP._id, c4AP._id, c1AM._id, c2AM._id, c1Sci._id, c3S._id],
      officeLocation: 'مكتب التوجيه والمتابعة البيداغوجية',
    });

    // 7. Receptionist
    console.log('[Seed] Seeding Receptionist...');
    const recepUser = await upsertUser({
      username: 'receptionniste',
      email: 'receptionniste@ecole-zitouni.dz',
      password: '0550778899',
      firstName: 'كريم',
      lastName: 'منصور',
      firstNameArabic: 'كريم',
      lastNameArabic: 'منصور',
      firstNameFrench: 'Karim',
      lastNameFrench: 'Mansour',
      role: 'receptionist',
      phoneNumber: '0550778899',
      baseSalary: 55000,
      salaryDeductionPerAbsence: 2000,
    });
    const recepDoc = await Receptionist.create({ user: recepUser._id });

    // 8. Teachers across subjects
    console.log('[Seed] Seeding Teachers...');
    const teacherConfigs = [
      {
        username: 'teacher.math',
        email: 'teacher.math@ecole-zitouni.dz',
        phone: '0550111111',
        firstName: 'كمال',
        lastName: 'دحماني',
        firstNameArabic: 'كمال',
        lastNameArabic: 'دحماني',
        firstNameFrench: 'Kamel',
        lastNameFrench: 'Dahmani',
        subjects: ['رياضيات'],
        classes: [c1AP._id, c3S._id],
        groups: [g1AP_A._id, g3S_A._id],
        salary: 68000,
      },
      {
        username: 'teacher.science',
        email: 'teacher.science@ecole-zitouni.dz',
        phone: '0550222222',
        firstName: 'نادية',
        lastName: 'صالحي',
        firstNameArabic: 'نادية',
        lastNameArabic: 'صالحي',
        firstNameFrench: 'Nadia',
        lastNameFrench: 'Salhi',
        subjects: ['علوم طبيعية'],
        classes: [c1AP._id, c4AP._id, c3S._id],
        groups: [g1AP_B._id, g4AP_A._id, g3S_A._id],
        salary: 65000,
      },
      {
        username: 'teacher.arabe',
        email: 'teacher.arabe@ecole-zitouni.dz',
        phone: '0550333333',
        firstName: 'عبد الحميد',
        lastName: 'حداد',
        firstNameArabic: 'عبد الحميد',
        lastNameArabic: 'حداد',
        firstNameFrench: 'Abdelhamid',
        lastNameFrench: 'Haddad',
        subjects: ['لغة عربية', 'تربية اسلامية'],
        classes: [c1AP._id, c2AM._id, c3S._id],
        groups: [g1AP_A._id, g2AM_A._id, g3S_B._id],
        salary: 66000,
      },
      {
        username: 'teacher.physique',
        email: 'teacher.physique@ecole-zitouni.dz',
        phone: '0550444444',
        firstName: 'فاروق',
        lastName: 'بلقاسم',
        firstNameArabic: 'فاروق',
        lastNameArabic: 'بلقاسم',
        firstNameFrench: 'Farouk',
        lastNameFrench: 'Belkacem',
        subjects: ['فيزياء'],
        classes: [c1Sci._id, c3S._id],
        groups: [g1Sci_A._id, g3S_A._id],
        salary: 67000,
      },
      {
        username: 'teacher.francais',
        email: 'teacher.francais@ecole-zitouni.dz',
        phone: '0550555555',
        firstName: 'صورايا',
        lastName: 'بن طيب',
        firstNameArabic: 'صورايا',
        lastNameArabic: 'بن طيب',
        firstNameFrench: 'Soraya',
        lastNameFrench: 'Bentayeb',
        subjects: ['لغة فرنسية'],
        classes: [c4AP._id, c2AM._id],
        groups: [g4AP_A._id, g2AM_A._id],
        salary: 64000,
      },
      {
        username: 'teacher.histoire',
        email: 'teacher.histoire@ecole-zitouni.dz',
        phone: '0550666666',
        firstName: 'يوسف',
        lastName: 'مزاوي',
        firstNameArabic: 'يوسف',
        lastNameArabic: 'مزاوي',
        firstNameFrench: 'Youcef',
        lastNameFrench: 'Mezawi',
        subjects: ['تاريخ وجغرافيا', 'تربية مدنية'],
        classes: [c1AM._id, c3S._id],
        groups: [g1AM_A._id, g3S_B._id],
        salary: 63000,
      },
    ];

    const teacherDocs = [];
    const teacherUsers = [];
    for (const t of teacherConfigs) {
      const u = await User.create({
        username: t.username,
        email: t.email,
        password: t.phone,
        firstName: t.firstName,
        lastName: t.lastName,
        firstNameArabic: t.firstNameArabic,
        lastNameArabic: t.lastNameArabic,
        firstNameFrench: t.firstNameFrench,
        lastNameFrench: t.lastNameFrench,
        role: 'teacher',
        phoneNumber: t.phone,
        baseSalary: t.salary,
        salaryDeductionPerAbsence: 2500,
      });
      const prof = await Teacher.create({
        user: u._id,
        subjects: t.subjects,
        classes: t.classes,
        groups: t.groups,
      });
      teacherDocs.push(prof);
      teacherUsers.push(u);

      for (const gId of t.groups) {
        const targetGroup = groupDocs.find((g) => g._id.toString() === gId.toString());
        if (targetGroup && !targetGroup.teachers.includes(prof._id)) {
          targetGroup.teachers.push(prof._id);
          await targetGroup.save();
        }
      }
    }
    console.log(`[Seed] ${teacherDocs.length} Teachers seeded.`);

    // 9. Parents with dual language spelling & Algerian phone numbers
    console.log('[Seed] Seeding Parents...');
    const parentConfigs = [
      {
        username: 'parent.meziane',
        email: 'parent.meziane@ecole-zitouni.dz',
        phone: '0550110011',
        firstName: 'سفيان',
        lastName: 'مزيان',
        firstNameArabic: 'سفيان',
        lastNameArabic: 'مزيان',
        firstNameFrench: 'Sofiane',
        lastNameFrench: 'Meziane',
        fatherNameArabic: 'سفيان مزيان',
        fatherNameFrench: 'Sofiane Meziane',
        fatherPhone: '0550110011',
        motherNameArabic: 'فاطمة الزهراء مزيان',
        motherNameFrench: 'Fatma Zohra Meziane',
        motherPhone: '0550110012',
        profession: 'مهندس إعلام آلي',
        address: 'حي 1200 مسكن، عمارة 14، أولاد فايت، الجزائر',
      },
      {
        username: 'parent.belaid',
        email: 'parent.belaid@ecole-zitouni.dz',
        phone: '0550220022',
        firstName: 'سارة',
        lastName: 'بلعيد',
        firstNameArabic: 'سارة',
        lastNameArabic: 'بلعيد',
        firstNameFrench: 'Sarah',
        lastNameFrench: 'Belaid',
        fatherNameArabic: 'طارق بلعيد',
        fatherNameFrench: 'Tarek Belaid',
        fatherPhone: '0550220021',
        motherNameArabic: 'سارة بلعيد',
        motherNameFrench: 'Sarah Belaid',
        motherPhone: '0550220022',
        profession: 'طبيبة أطفال',
        address: 'إقامة المنظر الجميل، فيلا رقم 8، أولاد فايت',
      },
      {
        username: 'parent.toumi',
        email: 'parent.toumi@ecole-zitouni.dz',
        phone: '0550330033',
        firstName: 'رشيد',
        lastName: 'تومي',
        firstNameArabic: 'رشيد',
        lastNameArabic: 'تومي',
        firstNameFrench: 'Rachid',
        lastNameFrench: 'Toumi',
        fatherNameArabic: 'رشيد تومي',
        fatherNameFrench: 'Rachid Toumi',
        fatherPhone: '0550330033',
        motherNameArabic: 'حسيبة تومي',
        motherNameFrench: 'Hassiba Toumi',
        motherPhone: '0550330034',
        profession: 'محامي معتمد لدى مجلس قضاء الجزائر',
        address: 'شارع الاستقلال، أولاد فايت المركز',
      },
      {
        username: 'parent.amrani',
        email: 'parent.amrani@ecole-zitouni.dz',
        phone: '0550440044',
        firstName: 'فتيحة',
        lastName: 'عمراني',
        firstNameArabic: 'فتيحة',
        lastNameArabic: 'عمراني',
        firstNameFrench: 'Fatiha',
        lastNameFrench: 'Amrani',
        fatherNameArabic: 'عبد القادر عمراني',
        fatherNameFrench: 'Abdelkader Amrani',
        fatherPhone: '0550440043',
        motherNameArabic: 'فتيحة عمراني',
        motherNameFrench: 'Fatiha Amrani',
        motherPhone: '0550440044',
        profession: 'أستاذة جامعية',
        address: 'حي 800 مسكن، أولاد فايت',
      },
      {
        username: 'parent.slimani',
        email: 'parent.slimani@ecole-zitouni.dz',
        phone: '0550550055',
        firstName: 'مراد',
        lastName: 'سليماني',
        firstNameArabic: 'مراد',
        lastNameArabic: 'سليماني',
        firstNameFrench: 'Mourad',
        lastNameFrench: 'Slimani',
        fatherNameArabic: 'مراد سليماني',
        fatherNameFrench: 'Mourad Slimani',
        fatherPhone: '0550550055',
        motherNameArabic: 'نوال سليماني',
        motherNameFrench: 'Nawal Slimani',
        motherPhone: '0550550056',
        profession: 'تاجر جملة ومقاول',
        address: 'المنطقة الحرفية، أولاد فايت',
      },
      {
        username: 'parent.zerrouki',
        email: 'parent.zerrouki@ecole-zitouni.dz',
        phone: '0550660066',
        firstName: 'جمال',
        lastName: 'زروقي',
        firstNameArabic: 'جمال',
        lastNameArabic: 'زروقي',
        firstNameFrench: 'Djamel',
        lastNameFrench: 'Zerrouki',
        fatherNameArabic: 'جمال زروقي',
        fatherNameFrench: 'Djamel Zerrouki',
        fatherPhone: '0550660066',
        motherNameArabic: 'أمينة زروقي',
        motherNameFrench: 'Amina Zerrouki',
        motherPhone: '0550660067',
        profession: 'صيدلي',
        address: 'حي الهضاب، طريق بوشاوي، أولاد فايت',
      },
    ];

    const parentDocs = [];
    const parentUsers = [];
    for (const p of parentConfigs) {
      const u = await User.create({
        username: p.username,
        email: p.email,
        password: p.phone,
        firstName: p.firstName,
        lastName: p.lastName,
        firstNameArabic: p.firstNameArabic,
        lastNameArabic: p.lastNameArabic,
        firstNameFrench: p.firstNameFrench,
        lastNameFrench: p.lastNameFrench,
        role: 'parent',
        phoneNumber: p.phone,
      });
      const prof = await Parent.create({
        user: u._id,
        fatherNameArabic: p.fatherNameArabic,
        fatherNameFrench: p.fatherNameFrench,
        fatherPhone: p.fatherPhone,
        motherNameArabic: p.motherNameArabic,
        motherNameFrench: p.motherNameFrench,
        motherPhone: p.motherPhone,
        profession: p.profession,
        address: p.address,
      });
      parentDocs.push(prof);
      parentUsers.push(u);
    }
    console.log(`[Seed] ${parentDocs.length} Parents seeded.`);

    // 10. Students with National Digitization IDs and Birthdate Passwords
    console.log('[Seed] Seeding Students...');
    const studentConfigs = [
      {
        username: 'student.yanis',
        email: 'student.yanis@ecole-zitouni.dz',
        dob: '2014-03-20',
        pob: 'أولاد فايت - الجزائر',
        gender: 'ذكر',
        firstName: 'يانيس',
        lastName: 'مزيان',
        firstNameArabic: 'يانيس',
        lastNameArabic: 'مزيان',
        firstNameFrench: 'Yanis',
        lastNameFrench: 'Meziane',
        natId: '20261601001',
        reg: 'REG-26-001',
        parentIndex: 0,
        class: c1AP,
        group: g1AP_A,
      },
      {
        username: 'student.leila',
        email: 'student.leila@ecole-zitouni.dz',
        dob: '2012-07-15',
        pob: 'الجزائر الوسطى',
        gender: 'أنثى',
        firstName: 'ليلى',
        lastName: 'مزيان',
        firstNameArabic: 'ليلى',
        lastNameArabic: 'مزيان',
        firstNameFrench: 'Leila',
        lastNameFrench: 'Meziane',
        natId: '20261601002',
        reg: 'REG-26-002',
        parentIndex: 0,
        class: c4AP,
        group: g4AP_A,
      },
      {
        username: 'student.meriem',
        email: 'student.meriem@ecole-zitouni.dz',
        dob: '2014-05-11',
        pob: 'زرالدة',
        gender: 'أنثى',
        firstName: 'مريم',
        lastName: 'بلعيد',
        firstNameArabic: 'مريم',
        lastNameArabic: 'بلعيد',
        firstNameFrench: 'Meriem',
        lastNameFrench: 'Belaid',
        natId: '20261601003',
        reg: 'REG-26-003',
        parentIndex: 1,
        class: c1AP,
        group: g1AP_A,
      },
      {
        username: 'student.amin',
        email: 'student.amin@ecole-zitouni.dz',
        dob: '2008-09-24',
        pob: 'الجزائر الوسطى',
        gender: 'ذكر',
        firstName: 'أمين',
        lastName: 'بلعيد',
        firstNameArabic: 'أمين',
        lastNameArabic: 'بلعيد',
        firstNameFrench: 'Amin',
        lastNameFrench: 'Belaid',
        natId: '20261601004',
        reg: 'REG-26-004',
        parentIndex: 1,
        class: c3S,
        group: g3S_A,
      },
      {
        username: 'student.samir',
        email: 'student.samir@ecole-zitouni.dz',
        dob: '2014-11-03',
        pob: 'بئر مراد رايس',
        gender: 'ذكر',
        firstName: 'سمير',
        lastName: 'تومي',
        firstNameArabic: 'سمير',
        lastNameArabic: 'تومي',
        firstNameFrench: 'Samir',
        lastNameFrench: 'Toumi',
        natId: '20261601005',
        reg: 'REG-26-005',
        parentIndex: 2,
        class: c1AP,
        group: g1AP_B,
      },
      {
        username: 'student.lynda',
        email: 'student.lynda@ecole-zitouni.dz',
        dob: '2008-04-18',
        pob: 'أولاد فايت',
        gender: 'أنثى',
        firstName: 'ليندة',
        lastName: 'تومي',
        firstNameArabic: 'ليندة',
        lastNameArabic: 'تومي',
        firstNameFrench: 'Lynda',
        lastNameFrench: 'Toumi',
        natId: '20261601006',
        reg: 'REG-26-006',
        parentIndex: 2,
        class: c3S,
        group: g3S_B,
      },
      {
        username: 'student.riad',
        email: 'student.riad@ecole-zitouni.dz',
        dob: '2012-02-28',
        pob: 'دالي براهيم',
        gender: 'ذكر',
        firstName: 'رياض',
        lastName: 'عمراني',
        firstNameArabic: 'رياض',
        lastNameArabic: 'عمراني',
        firstNameFrench: 'Riad',
        lastNameFrench: 'Amrani',
        natId: '20261601007',
        reg: 'REG-26-007',
        parentIndex: 3,
        class: c4AP,
        group: g4AP_A,
      },
      {
        username: 'student.feriel',
        email: 'student.feriel@ecole-zitouni.dz',
        dob: '2008-12-05',
        pob: 'الشراقة',
        gender: 'أنثى',
        firstName: 'فريال',
        lastName: 'عمراني',
        firstNameArabic: 'فريال',
        lastNameArabic: 'عمراني',
        firstNameFrench: 'Feriel',
        lastNameFrench: 'Amrani',
        natId: '20261601008',
        reg: 'REG-26-008',
        parentIndex: 3,
        class: c3S,
        group: g3S_A,
      },
      {
        username: 'student.anis',
        email: 'student.anis@ecole-zitouni.dz',
        dob: '2013-08-19',
        pob: 'سطاوالي',
        gender: 'ذكر',
        firstName: 'أنيس',
        lastName: 'سليماني',
        firstNameArabic: 'أنيس',
        lastNameArabic: 'سليماني',
        firstNameFrench: 'Anis',
        lastNameFrench: 'Slimani',
        natId: '20261601009',
        reg: 'REG-26-009',
        parentIndex: 4,
        class: c1AM,
        group: g1AM_A,
      },
      {
        username: 'student.kenza',
        email: 'student.kenza@ecole-zitouni.dz',
        dob: '2011-10-30',
        pob: 'أولاد فايت',
        gender: 'أنثى',
        firstName: 'كنزة',
        lastName: 'سليماني',
        firstNameArabic: 'كنزة',
        lastNameArabic: 'سليماني',
        firstNameFrench: 'Kenza',
        lastNameFrench: 'Slimani',
        natId: '20261601010',
        reg: 'REG-26-010',
        parentIndex: 4,
        class: c2AM,
        group: g2AM_A,
      },
      {
        username: 'student.bilal',
        email: 'student.bilal@ecole-zitouni.dz',
        dob: '2010-06-14',
        pob: 'الدرارية',
        gender: 'ذكر',
        firstName: 'بلال',
        lastName: 'زروقي',
        firstNameArabic: 'بلال',
        lastNameArabic: 'زروقي',
        firstNameFrench: 'Bilal',
        lastNameFrench: 'Zerrouki',
        natId: '20261601011',
        reg: 'REG-26-011',
        parentIndex: 5,
        class: c1Sci,
        group: g1Sci_A,
      },
      {
        username: 'student.yasmine',
        email: 'student.yasmine@ecole-zitouni.dz',
        dob: '2014-01-25',
        pob: 'أولاد فايت',
        gender: 'أنثى',
        firstName: 'ياسمين',
        lastName: 'زروقي',
        firstNameArabic: 'ياسمين',
        lastNameArabic: 'زروقي',
        firstNameFrench: 'Yasmine',
        lastNameFrench: 'Zerrouki',
        natId: '20261601012',
        reg: 'REG-26-012',
        parentIndex: 5,
        class: c1AP,
        group: g1AP_B,
      },
    ];

    const studentDocs = [];
    const studentUsers = [];
    for (const s of studentConfigs) {
      const birthDate = new Date(s.dob);
      const dobPassword = s.dob; // Exact YYYY-MM-DD
      const u = await User.create({
        username: s.username,
        email: s.email,
        password: dobPassword,
        firstName: s.firstName,
        lastName: s.lastName,
        firstNameArabic: s.firstNameArabic,
        lastNameArabic: s.lastNameArabic,
        firstNameFrench: s.firstNameFrench,
        lastNameFrench: s.lastNameFrench,
        role: 'student',
      });
      const pDoc = parentDocs[s.parentIndex];
      const stud = await Student.create({
        user: u._id,
        nationalIdDigitization: s.natId,
        registrationNumber: s.reg,
        firstNameArabic: s.firstNameArabic,
        lastNameArabic: s.lastNameArabic,
        firstNameFrench: s.firstNameFrench,
        lastNameFrench: s.lastNameFrench,
        gender: s.gender,
        dateOfBirth: birthDate,
        placeOfBirth: s.pob,
        class: s.class._id,
        group: s.group._id,
        parent: pDoc._id,
      });

      pDoc.children.push(stud._id);
      await pDoc.save();

      studentDocs.push(stud);
      studentUsers.push(u);
    }
    console.log(`[Seed] ${studentDocs.length} Students seeded.`);

    // 11. Attendance Records with all 6 states
    console.log('[Seed] Seeding Attendance records...');
    const attendanceEntries = [];
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000);
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
    const fourDaysAgo = new Date(Date.now() - 4 * 86400000);

    const attDates = [today, yesterday, twoDaysAgo, threeDaysAgo, fourDaysAgo];

    for (let i = 0; i < studentDocs.length; i++) {
      const stud = studentDocs[i];
      for (let dIdx = 0; dIdx < attDates.length; dIdx++) {
        const curDate = attDates[dIdx];
        let status = 'Present';
        let lateMin = 0;
        let remarks = 'حضور في الموعد';
        let justReason = '';
        let justStatus = 'None';

        if (i === 0 && dIdx >= 1 && dIdx <= 3) {
          // Student Yanis Meziane: 3 absences to trigger warning!
          status = 'Absent';
          remarks = 'غياب متكرر مسجل في الفترة الصباحية';
        } else if (i === 1 && dIdx === 1) {
          status = 'Late';
          lateMin = 15;
          remarks = 'تأخر عن الحصة الأولى بسبب الازدحام المروري';
        } else if (i === 2 && dIdx === 2) {
          status = 'Excused';
          remarks = 'مبرر بشهادة طبية مسلمة من طبيب الأطفال';
          justReason = 'وعكة صحية طارئة مصحوبة بشهادة طبية معتمدة';
          justStatus = 'Approved';
        } else if (i === 3 && dIdx === 0) {
          status = 'ExitPass';
          remarks = 'خروج استثنائي مرخص من طرف المشرف التربوي لموعد رياضي';
        } else if (i === 4 && dIdx >= 2 && dIdx <= 4) {
          // Student Samir Toumi: 3 unexcused absences!
          status = 'Unexcused';
          remarks = 'غياب غير مبرر دون إشعار مسبق من الولي';
        } else if (i === 6 && dIdx === 3) {
          status = 'Late';
          lateMin = 20;
          remarks = 'تأخر 20 دقيقة مع بطاقة دخول';
        } else if (dIdx === 4 && i % 4 === 0) {
          status = 'Absent';
          remarks = 'غياب مسجل';
        }

        attendanceEntries.push({
          student: stud._id,
          class: stud.class,
          group: stud.group,
          date: curDate,
          session: 'Daily',
          status,
          lateMinutes: lateMin,
          justificationReason: justReason,
          justificationStatus: justStatus,
          remarks,
          recordedBy: genSupUser._id,
          warningThresholdTriggered: (i === 0 && dIdx === 1) || (i === 4 && dIdx === 2),
        });
      }
    }
    await Attendance.insertMany(attendanceEntries);
    console.log(`[Seed] ${attendanceEntries.length} Attendance records seeded.`);

    // 12. Absence Warnings (Page 24 - 3 Absences Formal Warning)
    console.log('[Seed] Seeding Absence Warnings...');
    await AbsenceWarning.insertMany([
      {
        student: studentDocs[0]._id, // Yanis Meziane
        parent: parentDocs[0]._id,
        class: studentDocs[0].class,
        warningLevel: 1,
        absenceCount: 3,
        absenceDates: [twoDaysAgo, threeDaysAgo, fourDaysAgo],
        issueDate: yesterday,
        appointmentDate: new Date(Date.now() + 3 * 86400000), // in 3 days
        status: 'Pending',
        messageArabic: 'نلفت انتباهكم إلى تسجيل ثلاث (03) غيابات غير مبررة للتلميذ يانيس مزيان. يرجى الحضور إلى إدارة المؤسسة لتسوية الوضعية.',
        issuedBy: genSupUser._id,
      },
      {
        student: studentDocs[4]._id, // Samir Toumi
        parent: parentDocs[2]._id,
        class: studentDocs[4].class,
        warningLevel: 1,
        absenceCount: 3,
        absenceDates: [twoDaysAgo, threeDaysAgo, fourDaysAgo],
        issueDate: today,
        appointmentDate: new Date(Date.now() + 2 * 86400000),
        status: 'Delivered',
        messageArabic: 'تنبيه إداري رسمي: تجاوز التلميذ سمير تومي الحد القانوني للغيابات (3 غيابات). موعد الاستقبال مبرمج يوم الأحد صباحاً.',
        issuedBy: genSupUser._id,
      },
      {
        student: studentDocs[6]._id, // Riad Amrani
        parent: parentDocs[3]._id,
        class: studentDocs[6].class,
        warningLevel: 1,
        absenceCount: 3,
        absenceDates: [new Date(Date.now() - 10 * 86400000), new Date(Date.now() - 9 * 86400000), new Date(Date.now() - 8 * 86400000)],
        issueDate: new Date(Date.now() - 7 * 86400000),
        appointmentDate: new Date(Date.now() - 5 * 86400000),
        status: 'Resolved',
        messageArabic: 'إعذار رسمي لتسوية الغيابات.',
        resolutionNotes: 'حضر الولي الأستاذ عبد القادر وقدم ملفاً طبياً مصادقاً عليه، وتم تبرير الغيابات نظامياً.',
        resolvedAt: new Date(Date.now() - 5 * 86400000),
        issuedBy: genSupUser._id,
      },
    ]);
    console.log('[Seed] 3 Absence Warnings seeded.');

    // 13. Lesson Notebooks (« كراس الدروس والواجبات » - Page 20)
    console.log('[Seed] Seeding Lesson Notebooks...');
    await LessonNotebook.insertMany([
      {
        title: 'درس تفكيك الأعداد والجمع البسيط للأرقام من 1 إلى 50',
        subject: 'رياضيات',
        class: c1AP._id,
        teacher: teacherDocs[0]._id,
        teacherUser: teacherUsers[0]._id,
        teacherName: 'كمال دحماني',
        date: yesterday,
        period: '08:30 - 09:30',
        summary: 'تعلم تقنية الجمع بالأصابع والمكعبات الحسابية، وتفكيك الأعداد المكونة من رقمين إلى وحدات وعشرات مع حل تمارين كتاب النشاطات ص 22.',
        homework: {
          hasHomework: true,
          title: 'حل تمارين كتاب الرياضيات ص 23',
          description: 'إنجاز التمارين 1 و2 و3 على كراس الواجبات وتسليمه صباح يوم الأحد.',
          dueDate: new Date(Date.now() + 2 * 86400000),
          completedBy: [
            { student: studentDocs[0]._id, completedAt: new Date() },
            { student: studentDocs[2]._id, completedAt: new Date() },
          ],
        },
        attachments: [
          { name: 'fiche_activite_addition_1ap.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'application/pdf', size: 245000 },
        ],
        pedagogicalLinks: [
          { title: 'فيديو تعليمي للأطفال: الجمع البسيط', url: 'https://youtube.com/watch?v=math_primary_addition' },
        ],
        administrativeVisa: {
          isVisaed: true,
          visaedBy: pedSupUser._id,
          visaedByName: 'زكية بن عيسى',
          visaedAt: new Date(),
          remarks: 'كراس الدروس موافق للمنهاج السنوي، التمارين هادفة وتم تصحيحها بدقة.',
        },
      },
      {
        title: 'آليات انتقال السيالة العصبية في المشابك الكيميائية',
        subject: 'علوم طبيعية',
        class: c3S._id,
        teacher: teacherDocs[1]._id,
        teacherUser: teacherUsers[1]._id,
        teacherName: 'نادية صالحي',
        date: today,
        period: '10:30 - 12:30',
        summary: 'دراسة بنية المشبك العصبي - العصبي، دور أيونات الكالسيوم Ca2+ في تحرير الأستيل كولين، والتسجيلات الكهروفيزيولوجية لـ PPSE وPPSI.',
        homework: {
          hasHomework: true,
          title: 'رسم تخطيطي تفسيري للمشبك مع البيانات العلمية',
          description: 'رسم مجسم المشبك على ورقة ملمترية مع شرح تأثير مادة الكورار السامة على المستقبلات الغشائية.',
          dueDate: new Date(Date.now() + 3 * 86400000),
          completedBy: [
            { student: studentDocs[3]._id, completedAt: new Date() },
          ],
        },
        attachments: [
          { name: 'schema_synapse_neuro_3as.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'application/pdf', size: 520000 },
        ],
        pedagogicalLinks: [
          { title: 'محاكاة تفاعلية لانتقال السيالة العصبية', url: 'https://phet.colorado.edu/ar/simulations/neuron' },
        ],
        administrativeVisa: {
          isVisaed: true,
          visaedBy: pedSupUser._id,
          visaedByName: 'زكية بن عيسى',
          visaedAt: new Date(),
          remarks: 'سير الدرس ممتاز واستعمال الوسائط التفاعلية محفز لطلاب البكالوريا.',
        },
      },
      {
        title: 'قواعد اللغة: إعراب الأفعال الخمسة وعلامات الإعراب الفرعية',
        subject: 'لغة عربية',
        class: c2AM._id,
        teacher: teacherDocs[2]._id,
        teacherUser: teacherUsers[2]._id,
        teacherName: 'عبد الحميد حداد',
        date: twoDaysAgo,
        period: '13:30 - 14:30',
        summary: 'تعريف الأفعال الخمسة، ثبوت النون في حالة الرفع، وحذفها في حالتي النصب والجزم، مع تطبيقات نموذجية من نصوص أدبية جزائرية.',
        homework: {
          hasHomework: true,
          title: 'إعراب الشواهد النحوية ص 45',
          description: 'إعراب ثلاثة أبيات شعرية وتحديد الأفعال الخمسة وحالتها الإعرابية.',
          dueDate: new Date(Date.now() + 86400000),
          completedBy: [
            { student: studentDocs[9]._id, completedAt: new Date() },
          ],
        },
        administrativeVisa: {
          isVisaed: false,
        },
      },
      {
        title: 'الحركة والقوة: القانون الأول لنيوتن (مبدأ العطالة)',
        subject: 'فيزياء',
        class: c1Sci._id,
        teacher: teacherDocs[3]._id,
        teacherUser: teacherUsers[3]._id,
        teacherName: 'فاروق بلقاسم',
        date: threeDaysAgo,
        period: '09:30 - 10:30',
        summary: 'تجارب المنضدة الهوائية، دراسة حركة جسم شبه معزول ميكانيكياً، وتمثيل أشعة السرعة اللحظية ومجموع القوى الخارجية.',
        homework: {
          hasHomework: false,
        },
        administrativeVisa: {
          isVisaed: true,
          visaedBy: pedSupUser._id,
          visaedByName: 'زكية بن عيسى',
          visaedAt: twoDaysAgo,
          remarks: 'تمت مصادقة المشرف البيداغوجي.',
        },
      },
      {
        title: 'Conjugaison : Le passé composé avec l’auxiliaire avoir et être',
        subject: 'لغة فرنسية',
        class: c4AP._id,
        teacher: teacherDocs[4]._id,
        teacherUser: teacherUsers[4]._id,
        teacherName: 'صورايا بن طيب',
        date: yesterday,
        period: '11:30 - 12:30',
        summary: 'Formation du participe passé des verbes du 1er groupe (-er) et accord du participe passé avec le sujet.',
        homework: {
          hasHomework: true,
          title: 'Exercices 4 et 5 page 56 du livret de français',
          description: 'Conjuguer au passé composé les phrases données.',
          dueDate: new Date(Date.now() + 86400000),
          completedBy: [
            { student: studentDocs[1]._id, completedAt: new Date() },
            { student: studentDocs[6]._id, completedAt: new Date() },
          ],
        },
        administrativeVisa: {
          isVisaed: true,
          visaedBy: pedSupUser._id,
          visaedByName: 'زكية بن عيسى',
          visaedAt: yesterday,
          remarks: 'Séance bien structurée et exercices adaptés au niveau primaire.',
        },
      },
      {
        title: 'الحرب الباردة واستراتيجيات المعسكرين الغربي والشرقي (1945-1989)',
        subject: 'تاريخ وجغرافيا',
        class: c3S._id,
        teacher: teacherDocs[5]._id,
        teacherUser: teacherUsers[5]._id,
        teacherName: 'يوسف مزاوي',
        date: fourDaysAgo,
        period: '14:30 - 16:30',
        summary: 'أسباب الصراع الإيديولوجي، المظاهر العسكرية (حلف الناتو وحلف وارسو)، والمظاهر الاقتصادية (مبدأ ترومان ومشروع مارشال).',
        homework: {
          hasHomework: true,
          title: 'تحليل وثيقة تاريخية ورسم خط زمني للأزمات الكبرى',
          description: 'دراسة أزمة الصواريخ الكوبية 1962 مع التعليق على السندات المرفقة.',
          dueDate: today,
          completedBy: [
            { student: studentDocs[3]._id, completedAt: new Date() },
            { student: studentDocs[5]._id, completedAt: new Date() },
          ],
        },
        administrativeVisa: {
          isVisaed: true,
          visaedBy: pedSupUser._id,
          visaedByName: 'زكية بن عيسى',
          visaedAt: threeDaysAgo,
          remarks: 'محتوى متميز وتحضير جيد لشهادة البكالوريا.',
        },
      },
      {
        title: 'تربية إسلامية: حفظ وفهم سورة الفاتحة وآداب التحية في الإسلام',
        subject: 'تربية اسلامية',
        class: c1AP._id,
        teacher: teacherDocs[2]._id,
        teacherUser: teacherUsers[2]._id,
        teacherName: 'عبد الحميد حداد',
        date: twoDaysAgo,
        period: '09:30 - 10:30',
        summary: 'ترتيل سورة الفاتحة، شرح معاني آياتها الكريمة للأطفال، وتدريب التلاميذ على إفشاء السلام ورد التحية بأحسن منها.',
        homework: {
          hasHomework: true,
          title: 'حفظ سورة الفاتحة وترتيلها مع الوالدين',
          description: 'تسميع السورة الكريمة في البيت ومراجعة معاني المفردات.',
          dueDate: new Date(Date.now() + 86400000),
          completedBy: [
            { student: studentDocs[0]._id, completedAt: new Date() },
            { student: studentDocs[1]._id, completedAt: new Date() },
          ],
        },
        administrativeVisa: {
          isVisaed: true,
          visaedBy: pedSupUser._id,
          visaedByName: 'زكية بن عيسى',
          visaedAt: yesterday,
          remarks: 'درس تربوي هادف وتفاعل ممتاز من تلاميذ السنة الأولى.',
        },
      },
      {
        title: 'التحولات النووية: الانشطار والاندماج والطاقة المحررة',
        subject: 'فيزياء',
        class: c3S._id,
        teacher: teacherDocs[3]._id,
        teacherUser: teacherUsers[3]._id,
        teacherName: 'فاروق بلقاسم',
        date: yesterday,
        period: '08:30 - 10:30',
        summary: 'قوانين صودي للانحفاظ، حساب النقص في الكتلة وطاقة الربط لكل نوية، منحنى أستون وتطبيقات الطاقة النووية في الجزائر.',
        homework: {
          hasHomework: true,
          title: 'حل تمارين البكالوريا السابقة حول التفكك الإشعاعي ص 98',
          description: 'إنجاز التمارين النموذجية 4 و5 و7 وتسليم الحلول المصححة.',
          dueDate: new Date(Date.now() + 2 * 86400000),
          completedBy: [
            { student: studentDocs[3]._id, completedAt: new Date() },
            { student: studentDocs[6]._id, completedAt: new Date() },
          ],
        },
        attachments: [
          { name: 'resume_physique_nucleaire_bac.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'application/pdf', size: 610000 },
        ],
        pedagogicalLinks: [
          { title: 'محاكاة تفاعلية للانشطار والاندماج النووي', url: 'https://phet.colorado.edu/ar/simulations/nuclear-fission' },
        ],
        administrativeVisa: {
          isVisaed: true,
          visaedBy: pedSupUser._id,
          visaedByName: 'زكية بن عيسى',
          visaedAt: yesterday,
          remarks: 'درس عالي المستوى ومتوافق تماماً مع التوزيع السنوي الرسمي.',
        },
      },
      {
        title: 'Expression Écrite : Rédiger un texte narratif court (Le conte merveilleux)',
        subject: 'لغة فرنسية',
        class: c2AM._id,
        teacher: teacherDocs[4]._id,
        teacherUser: teacherUsers[4]._id,
        teacherName: 'صورايا بن طيب',
        date: threeDaysAgo,
        period: '10:30 - 11:30',
        summary: 'Structure du récit féerique : situation initiale, élément perturbateur, péripéties et dénouement. Utilisation des connecteurs temporels et des adjectifs qualificatifs.',
        homework: {
          hasHomework: true,
          title: 'Rédiger le premier paragraphe d’un conte imaginaire',
          description: 'Écrire 6 à 8 lignes en introduisant le héros et le cadre spatio-temporel.',
          dueDate: today,
          completedBy: [
            { student: studentDocs[5]._id, completedAt: new Date() },
          ],
        },
        administrativeVisa: {
          isVisaed: true,
          visaedBy: pedSupUser._id,
          visaedByName: 'زكية بن عيسى',
          visaedAt: twoDaysAgo,
          remarks: 'Excellent travail de production écrite pour le cycle moyen.',
        },
      },
      {
        title: 'تاريخ الجزائر القديم: الممالك الأمازيغية ومقاومة الاحتلال الروماني',
        subject: 'تاريخ وجغرافيا',
        class: c1AM._id,
        teacher: teacherDocs[5]._id,
        teacherUser: teacherUsers[5]._id,
        teacherName: 'يوسف مزاوي',
        date: twoDaysAgo,
        period: '13:30 - 14:30',
        summary: 'دراسة مملكة نوميديا الموحدة في عهد الملك ماسينيسا، التطور الاقتصادي والعمراني في سيرتا وتيبازة، وثورات يوغرطة وتاكفاريناس.',
        homework: {
          hasHomework: true,
          title: 'رسم خريطة الممالك النوميدية القديمة في بلاد المغرب',
          description: 'تحديد حدود نوميديا الشرقية والغربية وأهم المدن الأثرية على كراس الجغرافيا.',
          dueDate: new Date(Date.now() + 3 * 86400000),
          completedBy: [
            { student: studentDocs[0]._id, completedAt: new Date() },
            { student: studentDocs[8]._id, completedAt: new Date() },
          ],
        },
        attachments: [
          { name: 'carte_numidie_antique_algerie.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'application/pdf', size: 480000 },
        ],
        administrativeVisa: {
          isVisaed: false,
        },
      },
      {
        title: 'الدوال الأسية واللوغاريتمية: دراسة التغيرات وحل المعادلات التفاضلية',
        subject: 'رياضيات',
        class: c3S._id,
        teacher: teacherDocs[0]._id,
        teacherUser: teacherUsers[0]._id,
        teacherName: 'كمال دحماني',
        date: yesterday,
        period: '11:30 - 12:30',
        summary: 'خواص الدالة الأسية النيبيرية، النهايات الشهيرة والتزايد المقارن، مشتقة الدالة المركبة وحل المعادلة التفاضلية y\' = ay + b.',
        homework: {
          hasHomework: true,
          title: 'دراسة دالة أسية شاملة مع رسم المنحنى المقارب',
          description: 'حل المسألة النموذجية رقم 12 من الكتاب المدرسي ص 114.',
          dueDate: new Date(Date.now() + 2 * 86400000),
          completedBy: [
            { student: studentDocs[3]._id, completedAt: new Date() },
          ],
        },
        administrativeVisa: {
          isVisaed: true,
          visaedBy: pedSupUser._id,
          visaedByName: 'زكية بن عيسى',
          visaedAt: yesterday,
          remarks: 'تأشيرة المشرف البيداغوجي: استيعاب المفاهيم عميق ومستوى التمارين راقٍ.',
        },
      },
      {
        title: 'تركيب المادة الحية: مظاهر التنفس والتخمر والكتلة الحيوية',
        subject: 'علوم طبيعية',
        class: c1Sci._id,
        teacher: teacherDocs[1]._id,
        teacherUser: teacherUsers[1]._id,
        teacherName: 'نادية صالحي',
        date: today,
        period: '14:30 - 16:30',
        summary: 'تجارب قياس المبادلات الغازية التنفسية، استهلاك الغلوكوز وإنتاج الـ ATP في الميتوكوندري، والمقارنة الطاقوية بين التنفس والتخمر الكحولي.',
        homework: {
          hasHomework: false,
        },
        attachments: [
          { name: 'schema_bilan_respiration_fermentation.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'application/pdf', size: 380000 },
        ],
        administrativeVisa: {
          isVisaed: true,
          visaedBy: pedSupUser._id,
          visaedByName: 'زكية بن عيسى',
          visaedAt: today,
          remarks: 'حصة تطبيقية ناجحة وتم إنجاز جميع القياسات المخبرية بدقة.',
        },
      },
    ]);
    console.log('[Seed] 12 Lesson Notebook records seeded.');

    // 14. Administrative Requests (Art. 38 - Page 21)
    console.log('[Seed] Seeding Administrative Requests...');
    await AdministrativeRequest.insertMany([
      {
        trackingNumber: 'REQ-2026-0001',
        applicant: parentUsers[0]._id,
        applicantName: 'سفيان مزيان',
        applicantRole: 'parent',
        student: studentDocs[0]._id,
        studentName: 'يانيس مزيان',
        type: 'school_certificate',
        subject: 'طلب شهادة مدرسية أصلية لملف الضمان الاجتماعي (CNAS)',
        description: 'نرجو من إدارة المدرسة الموقرة استخراج شهادة مدرسية رسمية تثبت تمدرس ابني يانيس في قسم السنة الأولى ابتدائي للموسم الحالي 2026-2027.',
        status: 'Répondu',
        responseMessage: 'تمت معالجة طلبكم وإصدار الشهادة المدرسية الرسمية بختم المؤسسة. يمكنكم تحميلها مباشرة من هذا الرابط أو استلامها من أمانة الاستقبال.',
        responseAttachmentUrl: '/uploads/certificat_scolaire_yanis.pdf',
        respondedBy: adminUser._id,
        respondedAt: new Date(Date.now() - 3600000 * 12),
      },
      {
        trackingNumber: 'REQ-2026-0002',
        applicant: parentUsers[1]._id,
        applicantName: 'سارة بلعيد',
        applicantRole: 'parent',
        student: studentDocs[3]._id,
        studentName: 'أمين بلعيد',
        type: 'appointment',
        subject: 'طلب موعد مقابلة مع المشرف البيداغوجي لمناقشة التوجيه المدرسي',
        description: 'أرغب في مقابلة السيدة بن عيسى زكية للاطلاع على نتائج أمين في مادة العلوم الفيزيائية والتحضير لامتحان البكالوريا.',
        status: 'En cours',
        preferredDate: new Date(Date.now() + 4 * 86400000),
        responseMessage: 'تم تسجيل طلب الموعد وهو قيد التنسيق مع جدول مداومة المشرف البيداغوجي.',
        respondedBy: schoolUser._id,
        respondedAt: new Date(Date.now() - 3600000 * 6),
      },
      {
        trackingNumber: 'REQ-2026-0003',
        applicant: teacherUsers[0]._id,
        applicantName: 'كمال دحماني',
        applicantRole: 'teacher',
        type: 'other',
        subject: 'طلب صيانة وإضافة أقلام تفاعلية للسبورة الذكية بقاعة 3S',
        description: 'الأقلام التفاعلية الخاصة بشاشة العرض الذكية تحتاج إلى استبدال البطاريات ومعايرة الحساسات الضوئية.',
        status: 'Répondu',
        responseMessage: 'تم إعلام مصلحة الصيانة وتوفير الأقلام الجديدة لدى مكتب الاستقبال.',
        respondedBy: schoolUser._id,
        respondedAt: yesterday,
      },
      {
        trackingNumber: 'REQ-2026-0004',
        applicant: parentUsers[2]._id,
        applicantName: 'رشيد تومي',
        applicantRole: 'parent',
        student: studentDocs[5]._id,
        studentName: 'ليندة تومي',
        type: 'grade_transcript',
        subject: 'طلب كشف نقاط رسمي مصادق عليه للثلاثي الماضي',
        description: 'نحتاج إلى نسخة طبق الأصل من كشف نقاط ليندة لملف المشاركة في الأولمبياد الوطني للرياضيات.',
        status: 'Clôturé',
        responseMessage: 'تم تسليم كشف النقاط المصادق عليه بمكتب الأمانة بتاريخ أمس.',
        respondedBy: adminUser._id,
        respondedAt: twoDaysAgo,
      },
      {
        trackingNumber: 'REQ-2026-0005',
        applicant: parentUsers[3]._id,
        applicantName: 'فتيحة عمراني',
        applicantRole: 'parent',
        student: studentDocs[6]._id,
        studentName: 'رياض عمراني',
        type: 'complaint',
        subject: 'استفسار حول برمجة حصص الاستدراك يوم السبت',
        description: 'أود الاستفسار عن توقيت الحصص الإضافية المقررة لمادة الرياضيات وهل هي إجبارية لجميع التلاميذ.',
        status: 'Nouveau',
      },
      {
        trackingNumber: 'REQ-2026-0006',
        applicant: studentUsers[0]._id,
        applicantName: 'يانيس مزيان',
        applicantRole: 'student',
        type: 'school_certificate',
        subject: 'طلب بطاقة مدرسية جديدة بدل ضائعة',
        description: 'أضعت بطاقتي المدرسية في حافلة النقل وأرغب في استخراج بطاقة جديدة.',
        status: 'En cours',
      },
      {
        trackingNumber: 'REQ-2026-0007',
        applicant: parentUsers[4]._id,
        applicantName: 'مراد سليماني',
        applicantRole: 'parent',
        student: studentDocs[8]._id,
        studentName: 'ياسين سليماني',
        type: 'school_certificate',
        subject: 'طلب شهادة مدرسية مترجمة إلى الفرنسية لملف تأشيرة سفر',
        description: 'يرجى تزويدنا بشهادة مدرسية رسمية باللغتين العربية والفرنسية لملف السفر العائلي خلال العطلة المدرسية.',
        status: 'Répondu',
        responseMessage: 'تم تجهيز الشهادة المدرسية المترجمة والمصادقة وهي جاهزة للاستلام لدى الأمانة العامة.',
        responseAttachmentUrl: '/uploads/certificat_scolaire_yacine_fr.pdf',
        respondedBy: schoolUser._id,
        respondedAt: yesterday,
      },
      {
        trackingNumber: 'REQ-2026-0008',
        applicant: parentUsers[5]._id,
        applicantName: 'جمال زروقي',
        applicantRole: 'parent',
        student: studentDocs[10]._id,
        studentName: 'مهدي زروقي',
        type: 'grade_transcript',
        subject: 'طلب كشف نقاط الثلاثي الأول لملف التسجيل في النادي العلمي الولائي',
        description: 'أرجو استخراج نسخة رسمية من كشف النقاط لمهدي لتقديمها للنادي العلمي للشباب بالجزائر العاصمة.',
        status: 'En cours',
      },
      {
        trackingNumber: 'REQ-2026-0009',
        applicant: teacherUsers[1]._id,
        applicantName: 'نادية صالحي',
        applicantRole: 'teacher',
        type: 'other',
        subject: 'طلب تزويد مخبر العلوم الطبيعية بمجاهر ضوئية وشرائح مجهرية إضافية',
        description: 'نحتاج إلى 5 مجاهر ضوئية جديدة وعلب شرائح زجاجية جاهزة لدعم الحصص التطبيقية لطلاب قسم 3 علوم تجريبية.',
        status: 'Répondu',
        responseMessage: 'تمت المصادقة على الطلب وسيتم تسليم المعدات للمخبر مطلع الأسبوع القادم بالتنسيق مع مصلحة الوسائل.',
        respondedBy: adminUser._id,
        respondedAt: twoDaysAgo,
      },
      {
        trackingNumber: 'REQ-2026-0010',
        applicant: parentUsers[1]._id,
        applicantName: 'سارة بلعيد',
        applicantRole: 'parent',
        student: studentDocs[2]._id,
        studentName: 'مريم بلعيد',
        type: 'appointment',
        subject: 'طلب مقابلة مع مديرة المؤسسة لمناقشة ترتيبات الأنشطة الرياضية',
        description: 'أرغب في مقابلة السيدة المديرة لمناقشة مشاركة ابنتي مريم في البطولة الوطنية للشطرنج وتسهيل الغياب المبرر.',
        status: 'Nouveau',
        preferredDate: new Date(Date.now() + 3 * 86400000),
      },
      {
        trackingNumber: 'REQ-2026-0011',
        applicant: studentUsers[3]._id,
        applicantName: 'أمين بلعيد',
        applicantRole: 'student',
        type: 'grade_transcript',
        subject: 'طلب كشف نقاط مفصل للتقديم على منحة التميز العلمي',
        description: 'أرغب في استخراج كشف نقاط تفصيلي لمعدلات المواد العلمية للفصل المنصرم لتقديمه لملف الترشح للمنحة.',
        status: 'En cours',
      },
      {
        trackingNumber: 'REQ-2026-0012',
        applicant: parentUsers[0]._id,
        applicantName: 'سفيان مزيان',
        applicantRole: 'parent',
        student: studentDocs[1]._id,
        studentName: 'ليلى مزيان',
        type: 'complaint',
        subject: 'استفسار واقتراح حول تحسين مسار حافلة النقل المدرسي رقم 3',
        description: 'نلفت انتباه الإدارة إلى تأخر وصول الحافلة لبضع دقائق بسبب الأشغال في الطريق الوطني، ونقترح المرور عبر الطريق الاجتنابي.',
        status: 'Clôturé',
        responseMessage: 'شكراً جزيلاً لسيد مزيان على الملاحظة القيمة، تم التنسيق مع السائق واعتماد المسار البديل ابتداءً من اليوم.',
        respondedBy: genSupUser._id,
        respondedAt: yesterday,
      },
    ]);
    console.log('[Seed] 12 Administrative Requests seeded.');

    // 15. Announcements (Social Network - Arts. 10 to 17)
    console.log('[Seed] Seeding Announcements (18 comprehensive posts)...');
    const ann1 = await Announcement.create({
      title: 'بيان هام ومثبّت: انطلاق امتحانات الثلاثي الأول وتنظيم قاعات المذاكرة والمراجعة',
      content: 'أعزاءنا التلاميذ وأولياء الأمور المحترمين، تنهي إدارة مدرسة حبر إلى علم كافة الأسرة التربوية أن امتحانات الثلاثي الأول للموسم الدراسي 2025-2026 ستنطلق ابتداءً من الأسبوع القادم وفق الجداول التفصيلية المرفقة أدناه. يرجى من جميع التلاميذ الالتزام بالحضور قبل 15 دقيقة من موعد انطلاق الاختبارات، وإحضار الأدوات المدرسية كاملة وبطاقة التلميذ. تم تخصيص قاعات المذاكرة الهادئة للمراجعة الجماعية تحت إشراف الأساتذة المؤطرين.',
      publisher: schoolUser._id,
      publisherRole: 'school',
      targetAudience: 'all',
      isGlobal: true,
      isPinned: true,
      isImportant: true,
      confirmations: [
        { user: parentUsers[0]._id, confirmedAt: new Date(Date.now() - 3600000 * 5) },
        { user: parentUsers[1]._id, confirmedAt: new Date(Date.now() - 3600000 * 4) },
        { user: parentUsers[2]._id, confirmedAt: new Date(Date.now() - 3600000 * 3) },
        { user: teacherUsers[0]._id, confirmedAt: new Date(Date.now() - 3600000 * 6) },
        { user: teacherUsers[1]._id, confirmedAt: new Date(Date.now() - 3600000 * 5) },
      ],
      attachments: [
        { name: 'رزنامة_امتحانات_الثلاثي_الأول_2026.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'pdf', size: 345000 },
        { name: 'دليل_تنظيم_قاعات_المذاكرة_المدرسية.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'pdf', size: 210000 },
      ],
      pedagogicalLinks: [
        { title: 'البوابة الرقمية لمتابعة النتائج والتقارير', url: 'https://ecole-zitouni.dz/portal' },
      ],
      likes: [parentUsers[0]._id, parentUsers[1]._id, teacherUsers[0]._id, teacherUsers[1]._id, adminUser._id, studentUsers[0]._id, studentUsers[3]._id],
      views: [
        { user: parentUsers[0]._id, firstViewedAt: new Date(Date.now() - 3600000 * 6), lastViewedAt: new Date(), viewCount: 4 },
        { user: parentUsers[1]._id, firstViewedAt: new Date(Date.now() - 3600000 * 5), lastViewedAt: new Date(), viewCount: 3 },
        { user: teacherUsers[0]._id, firstViewedAt: new Date(Date.now() - 3600000 * 7), lastViewedAt: new Date(), viewCount: 5 },
        { user: teacherUsers[1]._id, firstViewedAt: new Date(Date.now() - 3600000 * 4), lastViewedAt: new Date(), viewCount: 2 },
        { user: studentUsers[0]._id, firstViewedAt: new Date(Date.now() - 3600000 * 2), lastViewedAt: new Date(), viewCount: 2 },
        { user: studentUsers[3]._id, firstViewedAt: new Date(Date.now() - 3600000 * 3), lastViewedAt: new Date(), viewCount: 3 },
      ],
      comments: [
        {
          user: parentUsers[0]._id,
          userName: 'سفيان مزيان',
          userRole: 'parent',
          content: 'شكراً جزيلاً للإدارة الموقرة على التنظيم المحكم، بالتوفيق لأبنائنا وبناتنا !',
          createdAt: new Date(Date.now() - 3600000 * 4),
          replies: [
            {
              user: schoolUser._id,
              userName: 'إدارة المدرسة (أمال بن علي)',
              userRole: 'school',
              content: 'وفقهم الله جميعاً، أبواب الإدارة مفتوحة لأي استفسار.',
              createdAt: new Date(Date.now() - 3600000 * 3),
            },
          ],
        },
        {
          user: teacherUsers[0]._id,
          userName: 'كمال دحماني (أستاذ الرياضيات)',
          userRole: 'teacher',
          content: 'المواضيع جاهزة وتمت مراجعتها بيداغوجياً، نتمنى أعلى العلامات للجميع.',
          createdAt: new Date(Date.now() - 3600000 * 2),
        },
      ],
    });

    const ann2 = await Announcement.create({
      title: 'افتتاح النادي العلمي ونادي الروبوتيك والذكاء الاصطناعي لموسم 2026',
      content: 'يسر مدرسة حبر أن تعلن عن الافتتاح الرسمي لنادي الروبوتيك والذكاء الاصطناعي لفائدة تلاميذ الطورين المتوسط والثانوي. يشمل البرنامج ورشات برمجية تفاعلية، بناء وبرمجة الروبوتات التعليمية (Arduino / Lego Spike)، والتحضير للبطولة الوطنية للروبوتيك. الأماكن محدودة، والتسجيلات مفتوحة لدى مكتب الأنشطة اللاصفية.',
      publisher: schoolUser._id,
      publisherRole: 'school',
      targetAudience: 'all',
      isGlobal: true,
      isPinned: true,
      attachments: [
        { name: 'برنامج_نادي_الروبوتيك_والذكاء_الاصطناعي.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'pdf', size: 520000 },
      ],
      likes: [studentUsers[0]._id, studentUsers[3]._id, studentUsers[4]._id, parentUsers[1]._id],
      views: [
        { user: studentUsers[0]._id, firstViewedAt: new Date(Date.now() - 3600000 * 8), lastViewedAt: new Date(), viewCount: 6 },
        { user: studentUsers[3]._id, firstViewedAt: new Date(Date.now() - 3600000 * 7), lastViewedAt: new Date(), viewCount: 4 },
        { user: parentUsers[1]._id, firstViewedAt: new Date(Date.now() - 3600000 * 6), lastViewedAt: new Date(), viewCount: 2 },
      ],
      comments: [
        {
          user: studentUsers[0]._id,
          userName: 'يانيس مزيان',
          userRole: 'student',
          content: 'متحمس جداً للتسجيل في ورشة البرمجة والروبوتات ! هل سنشارك في مسابقة الأولمبياد ؟',
          createdAt: new Date(Date.now() - 3600000 * 5),
          replies: [
            {
              user: schoolUser._id,
              userName: 'أمال بن علي (المديرة)',
              userRole: 'school',
              content: 'نعم بالتأكيد يا يانيس، تم تسجيل المؤسسة رسمياً في التصفيات الولائية.',
              createdAt: new Date(Date.now() - 3600000 * 4),
            },
          ],
        },
      ],
    });

    const ann3 = await Announcement.create({
      title: 'دعوة لأولياء تلاميذ الطور الابتدائي: اليوم المفتوح ولقاء الأساتذة',
      content: 'تتشرف إدارة المؤسسة وهيئة التدريس بدعوة أولياء تلاميذ الطور الابتدائي (من 1AP إلى 5AP) لحضور اللقاء التقييمي الفردي الدوري يوم الخميس القادم من الساعة 14:00 إلى 17:00 للاطلاع على نتائج أبنائكم ومناقشة تطورهم في القراءة والحساب.',
      publisher: schoolUser._id,
      publisherRole: 'school',
      targetAudience: 'level',
      targetLevel: 'primary',
      isGlobal: false,
      attachments: [
        { name: 'جدول_استقبال_أولياء_الابتدائي.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'pdf', size: 180000 },
      ],
      likes: [parentUsers[0]._id, parentUsers[2]._id, parentUsers[4]._id],
      views: [
        { user: parentUsers[0]._id, firstViewedAt: new Date(Date.now() - 3600000 * 8), lastViewedAt: new Date(), viewCount: 3 },
        { user: parentUsers[2]._id, firstViewedAt: new Date(Date.now() - 3600000 * 7), lastViewedAt: new Date(), viewCount: 2 },
      ],
      comments: [
        {
          user: parentUsers[0]._id,
          userName: 'سفيان مزيان',
          userRole: 'parent',
          content: 'سنكون حاضرين إن شاء الله، مبادرة قيمة جداً لمتابعة التلاميذ.',
          createdAt: new Date(Date.now() - 3600000 * 6),
        },
      ],
    });

    const ann4 = await Announcement.create({
      title: 'قسم 3 علوم تجريبية (بكالوريا): ملخص الأعمال التطبيقية في الجيولوجيا وحركات الصفائح',
      content: 'أعزائي طلبة قسم 3S، أضع بين أيديكم الملف التلخيصي الكامل للوحدة التعليمية في الجيولوجيا وحركات الصفائح التكتونية والظواهر المرتبطة بالغوص والاصطدام، متضمناً أهم الرسومات التخطيطية والبيانات المعتمدة في مواضيع البكالوريا الرسمية السابقة.',
      publisher: teacherUsers[1]._id,
      publisherRole: 'teacher',
      targetAudience: 'class',
      targetClass: c3S._id,
      targetGroup: g3S_A._id,
      isGlobal: false,
      attachments: [
        { name: 'ملخص_جيولوجيا_البكالوريا_علوم_تجريبية.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'pdf', size: 890000 },
      ],
      pedagogicalLinks: [
        { title: 'محاكاة تفاعلية لحركات الصفائح التكتونية والبراكين', url: 'https://phet.colorado.edu/ar/simulations/plate-tectonics' },
      ],
      likes: [studentUsers[3]._id, studentUsers[6]._id, teacherUsers[0]._id],
      views: [
        { user: studentUsers[3]._id, firstViewedAt: new Date(Date.now() - 3600000 * 10), lastViewedAt: new Date(), viewCount: 5 },
        { user: studentUsers[6]._id, firstViewedAt: new Date(Date.now() - 3600000 * 9), lastViewedAt: new Date(), viewCount: 3 },
      ],
      comments: [
        {
          user: studentUsers[3]._id,
          userName: 'أمين بلعيد',
          userRole: 'student',
          content: 'شكراً جزيلاً أستاذة صالحي ! هل هناك حصة استدراك لحل التمارين ؟',
          createdAt: new Date(Date.now() - 3600000 * 8),
          replies: [
            {
              user: teacherUsers[1]._id,
              userName: 'نادية صالحي',
              userRole: 'teacher',
              content: 'نعم بالتأكيد أمين، الحصة مبرمجة يوم الثلاثاء القادم على الساعة 14:00 بالمخبر.',
              createdAt: new Date(Date.now() - 3600000 * 7),
            },
          ],
        },
      ],
    });

    const ann5 = await Announcement.create({
      title: 'تلاميذ السنة الرابعة متوسط (BEM): ورشات المراجعة المكثفة وحل المواضيع النموذجية',
      content: 'أبنائي تلاميذ شهادة التعليم المتوسط، تبرمج المؤسسة ابتداءً من يوم السبت القادم حصص دعم مكثفة ومجانية في مواد الشهادة الأساسية (الرياضيات، اللغة العربية، العلوم الطبيعية، واللغة الفرنسية). يرجى الاطلاع على توقيت الأفواج والتسجيل لدى المشرف التربوي.',
      publisher: genSupUser._id,
      publisherRole: 'general_supervisor',
      targetAudience: 'level',
      targetLevel: 'middle',
      isGlobal: false,
      attachments: [
        { name: 'جدول_ورشات_مراجعة_BEM_2026.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'pdf', size: 310000 },
      ],
      likes: [studentUsers[0]._id, parentUsers[3]._id],
      views: [
        { user: studentUsers[0]._id, firstViewedAt: new Date(Date.now() - 3600000 * 11), lastViewedAt: new Date(), viewCount: 3 },
        { user: parentUsers[3]._id, firstViewedAt: new Date(Date.now() - 3600000 * 10), lastViewedAt: new Date(), viewCount: 2 },
      ],
      comments: [
        {
          user: parentUsers[3]._id,
          userName: 'فتيحة عمراني',
          userRole: 'parent',
          content: 'مبادرة ممتازة تدل على حرص الإدارة على تفوق التلاميذ في الشهادة، جزاكم الله خيراً.',
          createdAt: new Date(Date.now() - 3600000 * 9),
        },
      ],
    });

    const ann6 = await Announcement.create({
      title: 'إشعار داخلي خاص بهيئة التدريس: رزنامة مجالس الأقسام للثلاثي الأول',
      content: 'زميلاتي وزملائي الأساتذة الكرام، نرجو منكم الاطلاع على الرزنامة الرسمية لانعقاد مجالس الأقسام للثلاثي الأول. نهيب بالجميع ضبط علامات التقويم المستمر، الفروض والاختبارات في المنظومة الرقمية وتدوين الملاحظات التوجيهية الدقيقة قبل نهاية الأسبوع لتسهيل استخراج كشوف النقاط.',
      publisher: pedSupUser._id,
      publisherRole: 'pedagogical_supervisor',
      targetAudience: 'teachers',
      isGlobal: false,
      commentsLocked: true,
      isImportant: true,
      confirmations: [
        { user: teacherUsers[0]._id, confirmedAt: new Date(Date.now() - 3600000 * 10) },
        { user: teacherUsers[1]._id, confirmedAt: new Date(Date.now() - 3600000 * 9) },
        { user: teacherUsers[2]._id, confirmedAt: new Date(Date.now() - 3600000 * 8) },
      ],
      views: [
        { user: teacherUsers[0]._id, firstViewedAt: new Date(Date.now() - 3600000 * 12), lastViewedAt: new Date(), viewCount: 3 },
        { user: teacherUsers[1]._id, firstViewedAt: new Date(Date.now() - 3600000 * 11), lastViewedAt: new Date(), viewCount: 2 },
        { user: teacherUsers[2]._id, firstViewedAt: new Date(Date.now() - 3600000 * 9), lastViewedAt: new Date(), viewCount: 1 },
      ],
    });

    const ann7 = await Announcement.create({
      title: 'قسم 1 متوسط (1AM): الرحلة الاستكشافية والتربوية إلى الآثار الرومانية بتيبازة',
      content: 'تنظم المؤسسة بالتنسيق مع أستاذ مادة التاريخ والجغرافيا رحلة استكشافية ميدانية لتلاميذ السنة الأولى متوسط إلى الحظيرة الأثرية الرومانية والمتحف الوطني بتيبازة يوم السبت 15 نوفمبر. تهدف الزيارة لربط المنهاج الدراسي بالتراث الوطني وتاريخ الحضارات القديمة في بلاد المغرب.',
      publisher: teacherUsers[5]._id,
      publisherRole: 'teacher',
      targetAudience: 'class',
      targetClass: c1AM._id,
      targetGroup: g1AM_A._id,
      isGlobal: false,
      attachments: [
        { name: 'استمارة_ترخيص_أولياء_الرحلة_الميدانية_تيبازة.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'pdf', size: 275000 },
      ],
      likes: [parentUsers[0]._id, studentUsers[0]._id],
      views: [
        { user: parentUsers[0]._id, firstViewedAt: new Date(Date.now() - 3600000 * 14), lastViewedAt: new Date(), viewCount: 2 },
        { user: studentUsers[0]._id, firstViewedAt: new Date(Date.now() - 3600000 * 13), lastViewedAt: new Date(), viewCount: 3 },
      ],
      comments: [
        {
          user: parentUsers[0]._id,
          userName: 'سفيان مزيان',
          userRole: 'parent',
          content: 'فكرة ممتازة لربط الدروس النظرية بالواقع الميداني، سأرسل استمارة الموافقة غداً.',
          createdAt: new Date(Date.now() - 3600000 * 12),
        },
      ],
    });

    const ann8 = await Announcement.create({
      title: 'دليل أولياء الأمور: كيفية تبرير الغيابات والشهادات الطبية عبر المنظومة الرقمية',
      content: 'سيداتنا وسادتنا أولياء الأمور، حرصاً على ضمان الانضباط المدرسي وتسهيل الإجراءات الإدارية، نضع بين أيديكم دليلاً مبسطاً لكيفية إرسال مبررات الغياب والشهادات الطبية إلكترونياً عبر تطبيق المدرسة في أجل أقصاه 48 ساعة من تاريخ الغياب لتفادي احتسابه غير مبرر وفق المادة 24 من النظام الداخلي.',
      publisher: genSupUser._id,
      publisherRole: 'general_supervisor',
      targetAudience: 'parents',
      isGlobal: false,
      attachments: [
        { name: 'دليل_استخدام_خدمة_تبرير_الغياب_الإلكتروني.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'pdf', size: 420000 },
      ],
      likes: [parentUsers[1]._id, parentUsers[2]._id, parentUsers[3]._id],
      views: [
        { user: parentUsers[1]._id, firstViewedAt: new Date(Date.now() - 3600000 * 16), lastViewedAt: new Date(), viewCount: 4 },
        { user: parentUsers[2]._id, firstViewedAt: new Date(Date.now() - 3600000 * 15), lastViewedAt: new Date(), viewCount: 2 },
      ],
      comments: [
        {
          user: parentUsers[2]._id,
          userName: 'رشيد تومي',
          userRole: 'parent',
          content: 'خدمة رقمية ممتازة توفر الكثير من الوقت وتغني عن التنقل للمؤسسة.',
          createdAt: new Date(Date.now() - 3600000 * 14),
        },
      ],
    });

    const ann9 = await Announcement.create({
      title: 'المسابقة السنوية الكبرى لحفظ القرآن الكريم وتجويده وفصاحة الشعر العربي',
      content: 'تعلن مدرسة حبر عن إطلاق مسابقتها السنوية الكبرى لحفظ القرآن الكريم وترتيله وإلقاء الشعر العربي الفصيح. تتضمن المسابقة ثلاثة مستويات: حفظ 5 أجزاء، حفظ حزبي المفصل، والتجويد المرتل، بالإضافة إلى مسابقة الإلقاء الشعري الوطني. جوائز قيمة وشهادات تقدير في انتظار الفائزين في الحفل التكريمي.',
      publisher: schoolUser._id,
      publisherRole: 'school',
      targetAudience: 'all',
      isGlobal: true,
      attachments: [
        { name: 'شروط_ومحاور_مسابقة_القرآن_والشعر.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'pdf', size: 360000 },
      ],
      likes: [parentUsers[0]._id, parentUsers[4]._id, teacherUsers[2]._id],
      views: [
        { user: parentUsers[0]._id, firstViewedAt: new Date(Date.now() - 3600000 * 18), lastViewedAt: new Date(), viewCount: 3 },
        { user: teacherUsers[2]._id, firstViewedAt: new Date(Date.now() - 3600000 * 17), lastViewedAt: new Date(), viewCount: 2 },
      ],
      comments: [
        {
          user: teacherUsers[2]._id,
          userName: 'عبد الحميد حداد (أستاذ اللغة والتربية الإسلامية)',
          userRole: 'teacher',
          content: 'لجنة التحكيم جاهزة، ونتمنى مشاركة واسعة من حفظة كتاب الله وأصحاب الحناجر الذهبية.',
          createdAt: new Date(Date.now() - 3600000 * 16),
        },
      ],
    });

    const ann10 = await Announcement.create({
      title: 'قسم 2 علوم تجريبية ورياضيات: بنك التمارين المحلولة في الدوال العددية وحساب النهايات',
      content: 'تلاميذ السنة الثانية ثانوي، تجدون مرفقاً بنك التمارين المحلولة بالتفصيل في محور الدوال العددية، النهايات، والاشتقاقية، مع تطبيقات على دراسة التغيرات ونقاط الانعطاف ورسم المنحنيات البيانية استعداداً لفروض الفصل الأول.',
      publisher: teacherUsers[0]._id,
      publisherRole: 'teacher',
      targetAudience: 'level',
      targetLevel: 'secondary',
      isGlobal: false,
      attachments: [
        { name: 'بنك_تمارين_الدوال_وحساب_النهايات_2AS.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'pdf', size: 940000 },
      ],
      likes: [studentUsers[4]._id, studentUsers[10]._id],
      views: [
        { user: studentUsers[4]._id, firstViewedAt: new Date(Date.now() - 3600000 * 20), lastViewedAt: new Date(), viewCount: 5 },
      ],
      comments: [
        {
          user: studentUsers[4]._id,
          userName: 'سمير تومي',
          userRole: 'student',
          content: 'تمارين ممتازة وشرح وافي جداً، شكراً جزيلاً أستاذ كمال.',
          createdAt: new Date(Date.now() - 3600000 * 18),
        },
      ],
    });

    const ann11 = await Announcement.create({
      title: 'المراقبة العامة: تقرير حركة الحافلات المدرسية وتنظيم الدخول الصباحي',
      content: 'إشعار خاص بفريق الإشراف والمساعدين التربويين: تم تعديل مسار الحافلة رقم 2 لتفادي الازدحام المروري على مستوى محور دوران أولاد فايت. يرجى من المشرفين المناوبين التواجد أمام المدخل الرئيسي وساحة الابتدائي عند تمام الساعة 07:45 لمرافقة التلاميذ وتأمين عبورهم.',
      publisher: genSupUser._id,
      publisherRole: 'general_supervisor',
      targetAudience: 'supervisors',
      isGlobal: false,
      commentsLocked: true,
      views: [
        { user: pedSupUser._id, firstViewedAt: new Date(Date.now() - 3600000 * 22), lastViewedAt: new Date(), viewCount: 3 },
      ],
    });

    const ann12 = await Announcement.create({
      title: 'المسابقة الثقافية والعلمية الكبرى بين الأقسام (منشور مجدول)',
      content: 'تعلن نوادي الأنشطة بالمؤسسة عن إطلاق المسابقة العلمية الكبرى بين الطورين المتوسط والثانوي مع جوائز تكريمية للفائزين.',
      publisher: schoolUser._id,
      publisherRole: 'school',
      targetAudience: 'all',
      isGlobal: true,
      scheduledPublishAt: new Date(Date.now() + 2 * 86400000), // In 2 days
    });

    const ann13 = await Announcement.create({
      title: 'المطعم المدرسي: الجدول الغذائي الأسبوعي المتوازن وتنبيهات الحساسية الغذائية',
      content: 'نضع بين أيديكم برنامج الوجبات الغذائية المعتمد للمطعم المدرسي بإشراف أخصائية التغذية والصحة المدرسية. نذكر السادة الأولياء بضرورة التصريح الفوري بأي حساسية غذائية لأبنائهم (غلوتين، مكسرات، لاكتوز) لضبط الوجبات الخاصة البديلة.',
      publisher: schoolUser._id,
      publisherRole: 'school',
      targetAudience: 'all',
      isGlobal: true,
      isImportant: true,
      confirmations: [
        { user: parentUsers[0]._id, confirmedAt: new Date(Date.now() - 3600000 * 24) },
        { user: parentUsers[1]._id, confirmedAt: new Date(Date.now() - 3600000 * 22) },
      ],
      attachments: [
        { name: 'برنامج_التغذية_الصحية_ووجبات_المطعم_نوفمبر.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'pdf', size: 450000 },
      ],
      likes: [parentUsers[0]._id, parentUsers[1]._id],
      views: [
        { user: parentUsers[0]._id, firstViewedAt: new Date(Date.now() - 3600000 * 25), lastViewedAt: new Date(), viewCount: 2 },
      ],
      comments: [
        {
          user: parentUsers[1]._id,
          userName: 'سارة بلعيد',
          userRole: 'parent',
          content: 'قائمة صحية ومتوازنة تراعي النمو السليم للأطفال، نشكر إدارة المطعم على هذا الاهتمام.',
          createdAt: new Date(Date.now() - 3600000 * 21),
        },
      ],
    });

    const ann14 = await Announcement.create({
      title: 'الطور الابتدائي (5AP): ورشة الخط العربي والإملاء والإنتاج الكتابي',
      content: 'ضمن برنامج تعزيز المهارات اللغوية للمرحلة الابتدائية، تنطلق ورشة تحسين الخط العربي والتدريب على الإملاء الدقيق لتلاميذ السنة الخامسة ابتدائي كل ثلاثاء بعد الزوال. تشمل الورشة تدريبات على خط النسخ والرقعة وإتقان علامات الترقيم.',
      publisher: teacherUsers[2]._id,
      publisherRole: 'teacher',
      targetAudience: 'level',
      targetLevel: 'primary',
      isGlobal: false,
      likes: [parentUsers[0]._id, parentUsers[5]._id],
      views: [
        { user: parentUsers[0]._id, firstViewedAt: new Date(Date.now() - 3600000 * 28), lastViewedAt: new Date(), viewCount: 2 },
      ],
      comments: [
        {
          user: parentUsers[5]._id,
          userName: 'جمال زروقي',
          userRole: 'parent',
          content: 'ورشة رائعة ومفيدة جداً للأطفال لترسيخ جماليات لغة الضاد.',
          createdAt: new Date(Date.now() - 3600000 * 26),
        },
      ],
    });

    const ann15 = await Announcement.create({
      title: 'English Language & Public Speaking Club: Weekly Environmental Debate',
      content: 'Dear students, the English Club invites you to this week’s spirited debate session: "Renewable Energy vs. Traditional Resources: Algeria’s Path to Green Transition". Join us in the Multimedia Room this Wednesday at 15:30. Sharpen your fluency, expand your vocabulary, and engage in constructive public speaking!',
      publisher: schoolUser._id,
      publisherRole: 'school',
      targetAudience: 'level',
      targetLevel: 'secondary',
      isGlobal: false,
      attachments: [
        { name: 'english_debate_guidelines_and_vocabulary.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'pdf', size: 280000 },
      ],
      pedagogicalLinks: [
        { title: 'TED-Ed: What is Green Energy and How Does it Work?', url: 'https://ed.ted.com/lessons/green-energy-basics' },
      ],
      likes: [studentUsers[3]._id, studentUsers[6]._id],
      views: [
        { user: studentUsers[3]._id, firstViewedAt: new Date(Date.now() - 3600000 * 30), lastViewedAt: new Date(), viewCount: 4 },
      ],
      comments: [
        {
          user: studentUsers[3]._id,
          userName: 'أمين بلعيد',
          userRole: 'student',
          content: 'I have prepared my opening presentation about solar energy in the Sahara! Looking forward to it.',
          createdAt: new Date(Date.now() - 3600000 * 28),
        },
      ],
    });

    const ann16 = await Announcement.create({
      title: 'مكتب الاستقبال والعلاقات العامة: مواعيد استقبال الأولياء والتواصل الإداري',
      content: 'نرحب بالسادة أولياء الأمور الكرام ونحيطكم علماً بأن أوقات الاستقبال الإداري والمواعيد الفردية مع الإدارة والمشرفين التربويين قد تم تنظيمها طيلة أيام الأسبوع من الساعة 08:30 إلى 11:30 ومن 14:00 إلى 16:00 (باستثناء أوقات الامتحانات). يمكنكم حجز موعد مسبق عبر المنصة أو لدى مكتب الاستقبال.',
      publisher: schoolUser._id,
      publisherRole: 'school',
      targetAudience: 'parents',
      isGlobal: false,
      attachments: [
        { name: 'مواعيد_استقبال_الأولياء_الفصل_الأول.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'pdf', size: 195000 },
      ],
      likes: [parentUsers[0]._id, parentUsers[3]._id],
      views: [
        { user: parentUsers[0]._id, firstViewedAt: new Date(Date.now() - 3600000 * 32), lastViewedAt: new Date(), viewCount: 2 },
      ],
    });

    const ann17 = await Announcement.create({
      title: 'الخدمات الرقمية: استخراج الشهادات المدرسية وكشوف النقاط خلال 24 ساعة',
      content: 'تذكر إدارة مدرسة حبر كافة الأولياء والتلاميذ بأن طلب الشهادات المدرسية، كشوف النقاط، وإثباتات التسجيل يتم بصورة ميسرة عبر خانة "الطلبات الإدارية" في التطبيق. تتم المعالجة والتأشير الرقمي واستلام الوثيقة من مكتب الاستقبال خلال 24 ساعة عمل.',
      publisher: adminUser._id,
      publisherRole: 'admin',
      targetAudience: 'all',
      isGlobal: true,
      likes: [parentUsers[2]._id, parentUsers[4]._id, studentUsers[0]._id],
      views: [
        { user: parentUsers[2]._id, firstViewedAt: new Date(Date.now() - 3600000 * 35), lastViewedAt: new Date(), viewCount: 3 },
      ],
      comments: [
        {
          user: parentUsers[4]._id,
          userName: 'مراد سليماني',
          userRole: 'parent',
          content: 'تم استلام الشهادة المدرسية في نفس اليوم، سرعة وكفاءة ممتازة تشكر عليها الإدارة.',
          createdAt: new Date(Date.now() - 3600000 * 33),
        },
      ],
    });

    const ann18 = await Announcement.create({
      title: 'المكتبة المدرسية: وصول دفعة كتب جديدة ومراجع البكالوريا وتحدي القراءة العربي',
      content: 'يسر مصلحة التوثيق والمكتبة المدرسية الإعلان عن وصول دفعة متميزة من أحدث المراجع العلمية، الحوليات الوزارية المحلولة لشهادات BEM والبكالوريا، بالإضافة إلى روايات أدبية مشوقة باللغات الثلاث. كما نعلن عن فتح باب التسجيل في مسابقة "تحدي القراءة العربي" للموسم الجديد.',
      publisher: schoolUser._id,
      publisherRole: 'school',
      targetAudience: 'all',
      isGlobal: true,
      attachments: [
        { name: 'قائمة_المراجع_والكتب_الجديدة_بالمكتبة.pdf', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', fileType: 'pdf', size: 380000 },
      ],
      likes: [studentUsers[0]._id, studentUsers[3]._id, teacherUsers[4]._id],
      views: [
        { user: studentUsers[0]._id, firstViewedAt: new Date(Date.now() - 3600000 * 38), lastViewedAt: new Date(), viewCount: 4 },
      ],
      comments: [
        {
          user: studentUsers[0]._id,
          userName: 'يانيس مزيان',
          userRole: 'student',
          content: 'سأستعير رواية الأمير الصغير غداً صباحاً، شكراً على توفير الكتب الجديدة.',
          createdAt: new Date(Date.now() - 3600000 * 36),
        },
      ],
    });
    console.log('[Seed] 18 Comprehensive Announcements seeded.');

    // 16. Internal Messages (Direct + Group channels + Audit Logs)
    console.log('[Seed] Seeding Messages...');
    const messageDocs = [
      // Direct Chats
      {
        sender: adminUser._id,
        receiver: schoolUser._id,
        conversationType: 'direct',
        content: 'مرحباً أمال، هل تم تجهيز كشوف النقاط للثلاثي الأول واستكمال المراجعة الإدارية ؟',
        status: 'read',
        isRead: true,
        deliveredAt: new Date(Date.now() - 3600000 * 24),
        readAt: new Date(Date.now() - 3600000 * 23),
      },
      {
        sender: schoolUser._id,
        receiver: adminUser._id,
        conversationType: 'direct',
        content: 'مرحباً مالك، نعم، تمت المراجعة مع المشرف البيداغوجي وجميع الملفات جاهزة للطباعة والتسليم.',
        status: 'read',
        isRead: true,
        deliveredAt: new Date(Date.now() - 3600000 * 22),
        readAt: new Date(Date.now() - 3600000 * 21),
      },
      {
        sender: teacherUsers[0]._id, // Kamel Math
        receiver: parentUsers[0]._id, // Sofiane Meziane
        conversationType: 'direct',
        content: 'السلام عليكم سيد مزيان، أحيطكم علماً بأن يانيس يظهر شغفاً كبيراً في مادة الرياضيات، وهو متميز في الحساب الذهني.',
        status: 'read',
        isRead: true,
        deliveredAt: new Date(Date.now() - 3600000 * 12),
        readAt: new Date(Date.now() - 3600000 * 10),
      },
      {
        sender: parentUsers[0]._id,
        receiver: teacherUsers[0]._id,
        conversationType: 'direct',
        content: 'وعليكم السلام ورحمة الله أستاذ دحماني. سعدت جداً بهذه الكلمات الطيبة، سنواصل تشجيعه في البيت. بارك الله فيكم.',
        status: 'read',
        isRead: true,
        deliveredAt: new Date(Date.now() - 3600000 * 9),
        readAt: new Date(Date.now() - 3600000 * 8),
      },
      {
        sender: studentUsers[0]._id, // Yanis Meziane
        receiver: teacherUsers[0]._id, // Kamel Math
        conversationType: 'direct',
        content: 'أستاذ كمال، هل يمكنني تقديم تمرين إضافي يوم الأحد للحصول على علامة استحسان ؟',
        status: 'read',
        isRead: true,
        deliveredAt: new Date(Date.now() - 3600000 * 5),
        readAt: new Date(Date.now() - 3600000 * 4),
      },
      {
        sender: teacherUsers[0]._id,
        receiver: studentUsers[0]._id,
        conversationType: 'direct',
        content: 'بكل تأكيد يا يانيس، يسعدني دائماً اجتهادك وشغفك بالرياضيات. أحضر التمرين وسنحله معاً في القسم.',
        status: 'read',
        isRead: true,
        deliveredAt: new Date(Date.now() - 3600000 * 3),
        readAt: new Date(Date.now() - 3600000 * 2),
      },
      {
        sender: genSupUser._id,
        receiver: pedSupUser._id,
        conversationType: 'direct',
        content: 'أهلاً زكية، هل تم الانتهاء من تأشيرة كراريس الدروس لأقسام الطور الثانوي ؟',
        status: 'read',
        isRead: true,
        deliveredAt: new Date(Date.now() - 3600000 * 7),
        readAt: new Date(Date.now() - 3600000 * 6),
      },
      {
        sender: pedSupUser._id,
        receiver: genSupUser._id,
        conversationType: 'direct',
        content: 'أهلاً عمر، نعم تم تأشير كراس الرياضيات والعلوم والتاريخ، والعملية مستمرة مع باقي الأساتذة اليوم.',
        status: 'read',
        isRead: true,
        deliveredAt: new Date(Date.now() - 3600000 * 5),
        readAt: new Date(Date.now() - 3600000 * 4),
      },

      // Group Channels (Art. 18)
      {
        sender: adminUser._id,
        conversationType: 'group',
        groupChannelId: 'group_teachers_staff',
        groupType: 'teachers',
        groupTitle: 'قناة التنسيق العام للأساتذة وهيئة التدريس',
        content: 'زملائي الأساتذة، نذكركم بضرورة التأكد من غلق النوافذ وإطفاء أجهزة العرض بعد الحصة الأخيرة من كل يوم.',
        status: 'sent',
        deliveredAt: new Date(Date.now() - 3600000 * 18),
      },
      {
        sender: teacherUsers[0]._id,
        conversationType: 'group',
        groupChannelId: 'group_teachers_staff',
        groupType: 'teachers',
        groupTitle: 'قناة التنسيق العام للأساتذة وهيئة التدريس',
        content: 'تم أخذ الأمر بعين الاعتبار أستاذ مالك، شكراً على التذكير.',
        status: 'sent',
        deliveredAt: new Date(Date.now() - 3600000 * 17),
      },
      {
        sender: genSupUser._id,
        conversationType: 'group',
        groupChannelId: 'group_supervisors_admin',
        groupType: 'supervisors',
        groupTitle: 'قناة التنسيق الإداري والمراقبة العامة',
        content: 'تقرير الصباح: نسبة الحضور 98% في الطور الابتدائي و96% في الطور الثانوي. تم تسجيل إعذارين للغياب.',
        status: 'sent',
        deliveredAt: new Date(Date.now() - 3600000 * 8),
      },
      {
        sender: schoolUser._id,
        conversationType: 'group',
        groupChannelId: 'group_supervisors_admin',
        groupType: 'supervisors',
        groupTitle: 'قناة التنسيق الإداري والمراقبة العامة',
        content: 'ممتاز، يرجى استقبال أولياء الأمور المعنيين بالإعذارات بكل عناية وتدوين بطاقات الدخول.',
        status: 'sent',
        deliveredAt: new Date(Date.now() - 3600000 * 7),
      },
      {
        sender: teacherUsers[0]._id,
        conversationType: 'group',
        groupChannelId: 'group_class_1AP',
        groupType: 'class',
        class: c1AP._id,
        groupTitle: 'قناة قسم السنة الأولى ابتدائي أ',
        content: 'مرحباً بتلاميذ قسم 1AP وأوليائهم، غداً سنبدأ نشاط الرسم التعبيري، يرجى إحضار علبة الألوان المائية.',
        status: 'sent',
        deliveredAt: new Date(Date.now() - 3600000 * 14),
      },
      {
        sender: parentUsers[0]._id,
        conversationType: 'group',
        groupChannelId: 'group_parents_1AP',
        groupType: 'class_parents',
        class: c1AP._id,
        groupTitle: 'قناة أولياء تلاميذ قسم 1 ابتدائي أ',
        content: 'السلام عليكم جميعاً، نرجو أن يكون جميع التلاميذ مستعدين للاختبارات القادمة.',
        status: 'sent',
        deliveredAt: new Date(Date.now() - 3600000 * 11),
      },
      {
        sender: parentUsers[1]._id,
        receiver: teacherUsers[1]._id,
        conversationType: 'direct',
        content: 'السلام عليكم أستاذة نادية، أود الاطمئنان على مشاركة ابنتي مريم في حصص العلوم.',
        status: 'read',
        isRead: true,
        deliveredAt: new Date(Date.now() - 3600000 * 9),
        readAt: new Date(Date.now() - 3600000 * 8),
      },
      {
        sender: teacherUsers[1]._id,
        receiver: parentUsers[1]._id,
        conversationType: 'direct',
        content: 'وعليكم السلام دكتورة سارة، مريم تلميذة مجتهدة ونبيهة وتشارك بفعالية في التجارب المخبرية.',
        status: 'read',
        isRead: true,
        deliveredAt: new Date(Date.now() - 3600000 * 7),
        readAt: new Date(Date.now() - 3600000 * 6),
      },
      {
        sender: teacherUsers[3]._id,
        receiver: adminUser._id,
        conversationType: 'direct',
        content: 'أستاذ مالك، قاعة الفيزياء بحاجة لتزويد إضافي بأسلاك التوصيل للمولدات الكهربائية.',
        status: 'read',
        isRead: true,
        deliveredAt: new Date(Date.now() - 3600000 * 15),
        readAt: new Date(Date.now() - 3600000 * 14),
      },
      {
        sender: adminUser._id,
        receiver: teacherUsers[3]._id,
        conversationType: 'direct',
        content: 'أهلاً أستاذ فاروق، تم تسجيل الطلب لدى مصلحة المشتريات وسيتم تسليمها للمخبر هذا الأسبوع.',
        status: 'read',
        isRead: true,
        deliveredAt: new Date(Date.now() - 3600000 * 13),
        readAt: new Date(Date.now() - 3600000 * 12),
      },
      {
        sender: teacherUsers[2]._id,
        conversationType: 'group',
        groupChannelId: 'group_teachers_staff',
        groupType: 'teachers',
        groupTitle: 'قناة التنسيق العام للأساتذة وهيئة التدريس',
        content: 'نذكر الزملاء بموعد المعرض السنوي للخط العربي في بهو المؤسسة يوم الثلاثاء القادم.',
        status: 'sent',
        deliveredAt: new Date(Date.now() - 3600000 * 6),
      },
      {
        sender: teacherUsers[3]._id,
        conversationType: 'group',
        groupChannelId: 'group_teachers_staff',
        groupType: 'teachers',
        groupTitle: 'قناة التنسيق العام للأساتذة وهيئة التدريس',
        content: 'بالتوفيق، سنشجع تلاميذ الطور الثانوي على زيارة المعرض والاطلاع على اللوحات التراثية.',
        status: 'sent',
        deliveredAt: new Date(Date.now() - 3600000 * 5),
      },
      {
        sender: genSupUser._id,
        conversationType: 'group',
        groupChannelId: 'group_supervisors_admin',
        groupType: 'supervisors',
        groupTitle: 'قناة التنسيق الإداري والمراقبة العامة',
        content: 'تم تنظيم خروج التلاميذ المسجلين في النقل المدرسي بسلاسة وهدوء تام.',
        status: 'sent',
        deliveredAt: new Date(Date.now() - 3600000 * 4),
      },
      {
        sender: teacherUsers[0]._id,
        conversationType: 'group',
        groupChannelId: 'group_class_1AP',
        groupType: 'class',
        class: c1AP._id,
        groupTitle: 'قناة قسم السنة الأولى ابتدائي أ',
        content: 'تذكير: نرجو من الأولياء الكرام مراجعة جدول الأعداد من 1 إلى 50 خلال عطلة نهاية الأسبوع.',
        status: 'sent',
        deliveredAt: new Date(Date.now() - 3600000 * 3),
      },
    ];

    await Message.insertMany(messageDocs);
    console.log(`[Seed] ${messageDocs.length} Messages seeded.`);

    // 17. Notifications
    console.log('[Seed] Seeding Notifications...');
    await Notification.insertMany([
      {
        recipient: studentUsers[0]._id,
        title: 'واجب منزلي جديد في الرياضيات',
        content: 'أضاف الأستاذ كمال دحماني واجباً جديداً: حل تمارين ص 23.',
        type: 'course',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 3),
      },
      {
        recipient: parentUsers[0]._id,
        title: 'إعذار غياب رسمي',
        content: 'تم تسجيل غياب التلميذ يانيس مزيان وتوليد إعذار رسمي لتسوية الوضعية.',
        type: 'attendance',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 4),
      },
      {
        recipient: parentUsers[0]._id,
        title: 'إعلان مثبت جديد',
        content: 'نشرت الإدارة بياناً هاماً: انطلاق امتحانات الثلاثي الأول وتنظيم قاعات المذاكرة.',
        type: 'post',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 6),
      },
      {
        recipient: teacherUsers[0]._id,
        title: 'تأشيرة المشرف البيداغوجي',
        content: 'تمت المصادقة على كراس الدروس لمادة الرياضيات من طرف المشرفة زكية بن عيسى.',
        type: 'course',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
      {
        recipient: schoolUser._id,
        title: 'طلب إداري جديد وارد',
        content: 'أرسل الولي سفيان مزيان طلب شهادة مدرسية رقم REQ-2026-0001.',
        type: 'message',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 12),
      },
      {
        recipient: studentUsers[3]._id,
        title: 'سند درس جديد في العلوم',
        content: 'تم نشر وثيقة ملخص الجيولوجيا لامتحان البكالوريا من طرف الأستاذة صالحي.',
        type: 'course',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 9),
      },
      {
        recipient: parentUsers[1]._id,
        title: 'تأكيد حجز وجبة المطعم المدرسي',
        content: 'تم تسجيل اشتراك المطعم المدرسي بنجاح للشهر الحالي.',
        type: 'message',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 10),
      },
      {
        recipient: studentUsers[0]._id,
        title: 'افتتاح النادي العلمي والروبوتيك',
        content: 'تم فتح التسجيل في ورشات الروبوتيك والذكاء الاصطناعي لموسم 2026.',
        type: 'post',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 8),
      },
      {
        recipient: teacherUsers[1]._id,
        title: 'تجهيزات مخبرية جديدة',
        content: 'تمت المصادقة على طلب المجاهر الضوئية الموجهة لمخبر العلوم الطبيعية.',
        type: 'message',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 15),
      },
      {
        recipient: parentUsers[2]._id,
        title: 'كشف النقاط جاهز للاستلام',
        content: 'تمت معالجة طلب كشف النقاط المصادق عليه وهو متاح لدى أمانة الاستقبال.',
        type: 'message',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 18),
      },
      {
        recipient: studentUsers[3]._id,
        title: 'حصة استدراك ومراجعة',
        content: 'برمجت الأستاذة صالحي حصة استدراك لحل تمارين البكالوريا يوم الثلاثاء على الساعة 14:00.',
        type: 'course',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 7),
      },
      {
        recipient: parentUsers[4]._id,
        title: 'شهادة مدرسية مترجمة جاهزة',
        content: 'تم تجهيز الشهادة المدرسية الرسمية باللغة الفرنسية للتلميذ ياسين سليماني.',
        type: 'message',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 5),
      },
      {
        recipient: teacherUsers[5]._id,
        title: 'الموافقة على الرحلة الاستكشافية',
        content: 'تمت المصادقة الإدارية على الرحلة الميدانية لتلاميذ 1AM إلى تيبازة الأثرية.',
        type: 'post',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 14),
      },
      {
        recipient: studentUsers[4]._id,
        title: 'بنك تمارين الرياضيات 2AS',
        content: 'تم نشر بنك تمارين الدوال المحلولة للتحضير لفروض الفصل الأول.',
        type: 'course',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 16),
      },
    ]);
    console.log('[Seed] 14 Notifications seeded.');

    // 18. Financial Products, Transactions, Staff Absences, Salary Deductions & Payrolls
    console.log('[Seed] Seeding Financial system...');
    const productsList = [
      { name: 'فصل دراسي أول (الابتدائي)', price: 45000, category: 'Tuition', description: 'رسوم التسجيل والفصل الدراسي الأول للمرحلة الابتدائية' },
      { name: 'فصل دراسي أول (المتوسط)', price: 55000, category: 'Tuition', description: 'رسوم التسجيل والفصل الدراسي الأول للمرحلة المتوسطة' },
      { name: 'فصل دراسي أول (الثانوي)', price: 65000, category: 'Tuition', description: 'رسوم التسجيل والفصل الدراسي الأول للمرحلة الثانوية' },
      { name: 'اشتراك المطعم المدرسي (شهري)', price: 8000, category: 'Canteen', description: 'وجبة غداء صحية ومتكاملة يومياً طوال الشهر' },
      { name: 'حقيبة الكتب والقرطاسية المدرسية', price: 6500, category: 'Books', description: 'الكتب المقررة والأدوات المدرسية المعتمدة' },
      { name: 'الزي المدرسي الرياضي والرسمي', price: 4500, category: 'Uniform', description: 'طقم الزي المدرسي الشتوي والصيفي' },
      { name: 'نقل مدرسي حافلات (شهري)', price: 5000, category: 'Transport', description: 'خدمة النقل عبر خطوط المدرسة' },
      { name: 'اشتراك نادي الروبوتيك والذكاء الاصطناعي', price: 4000, category: 'Club', description: 'أنشطة علمية ومسابقات روبوتيك أسبوعية' },
    ];
    await FinancialProduct.insertMany(productsList);

    const staffMembers = [
      { u: teacherUsers[0], role: 'teacher', deductionRate: 2500, salary: 68000 },
      { u: teacherUsers[1], role: 'teacher', deductionRate: 2500, salary: 65000 },
      { u: teacherUsers[2], role: 'teacher', deductionRate: 2500, salary: 66000 },
      { u: genSupUser, role: 'general_supervisor', deductionRate: 3000, salary: 85000 },
      { u: pedSupUser, role: 'pedagogical_supervisor', deductionRate: 2800, salary: 78000 },
      { u: recepUser, role: 'receptionist', deductionRate: 2000, salary: 55000 },
    ];

    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthStr = prevMonthDate.toISOString().slice(0, 7);

    const absenceMap = {
      [teacherUsers[0]._id.toString()]: { [prevMonthStr]: [12], [currentMonthStr]: [] },
      [teacherUsers[1]._id.toString()]: { [prevMonthStr]: [4, 18], [currentMonthStr]: [8] },
      [teacherUsers[2]._id.toString()]: { [prevMonthStr]: [], [currentMonthStr]: [3, 9] },
      [genSupUser._id.toString()]: { [prevMonthStr]: [], [currentMonthStr]: [] },
      [pedSupUser._id.toString()]: { [prevMonthStr]: [15], [currentMonthStr]: [] },
      [recepUser._id.toString()]: { [prevMonthStr]: [], [currentMonthStr]: [5] },
    };

    for (const staff of staffMembers) {
      const sId = staff.u._id.toString();
      for (const mStr of [prevMonthStr, currentMonthStr]) {
        const [yr, mn] = mStr.split('-').map(Number);
        const absenceDays = absenceMap[sId]?.[mStr] || [];

        for (let d = 1; d <= 15; d += 2) {
          const isAbsent = absenceDays.includes(d);
          const attDate = new Date(yr, mn - 1, d, 9, 0, 0);

          const attDoc = await StaffAttendance.create({
            staffUser: staff.u._id,
            role: staff.role,
            date: attDate,
            status: isAbsent ? 'Absent' : 'Present',
            remarks: isAbsent ? 'غياب مسجل في سجل المداومة من طرف المراقب العام' : 'حضور والتزام بالتوقيت',
            recordedBy: genSupUser._id,
            deductionApplied: isAbsent,
            deductionAmount: isAbsent ? staff.deductionRate : 0,
          });

          if (isAbsent) {
            await SalaryDeduction.create({
              user: staff.u._id,
              date: attDate,
              amount: staff.deductionRate,
              reason: `غياب غير مبرر عن العمل يوم ${attDate.toISOString().slice(0, 10)}`,
              attendanceRef: attDoc._id,
              deductedAutomatically: true,
              month: mStr,
            });
          }
        }

        const absenceCount = absenceDays.length;
        const totalDeds = absenceCount * staff.deductionRate;
        const bonus = staff.role === 'teacher' ? 4000 : 6000;
        const net = staff.salary + bonus - totalDeds;

        await Payroll.create({
          user: staff.u._id,
          month: mStr,
          baseSalary: staff.salary,
          totalAbsenceDays: absenceCount,
          totalDeductions: totalDeds,
          bonuses: bonus,
          netSalary: net,
          status: mStr === prevMonthStr ? 'Paid' : (absenceCount > 0 ? 'Pending' : 'Paid'),
          paidAt: mStr === prevMonthStr ? new Date(new Date().setDate(0)) : (absenceCount === 0 ? new Date() : undefined),
        });
      }
    }

    await FinanceTransaction.insertMany([
      { title: 'تحصيل أقساط دراسية للمرحلة الابتدائية والمتوسطة', amount: 850000, type: 'INCOME', category: 'Tuition / Inscriptions', recordedBy: adminUser._id, date: new Date(Date.now() - 25 * 86400000), description: 'تحصيل القسط الأول من 18 تلميذ' },
      { title: 'اشتراكات المطعم المدرسي لشهر جوان وجويلية', amount: 160000, type: 'INCOME', category: 'Cantine', recordedBy: schoolUser._id, date: new Date(Date.now() - 20 * 86400000), description: 'دفع اشتراكات المطعم لـ 20 تلميذ' },
      { title: 'تسديد رسوم الكتب والقرطاسية المدرسية', amount: 95000, type: 'INCOME', category: 'Livres & Matériel', recordedBy: adminUser._id, date: new Date(Date.now() - 15 * 86400000), description: 'بيع حقائب وأدوات مدرسية' },
      { title: 'اشتراكات نادي الروبوتيك والأنشطة الرياضية', amount: 72000, type: 'INCOME', category: 'Activités / Clubs', recordedBy: schoolUser._id, date: new Date(Date.now() - 10 * 86400000), description: 'رسوم الأندية المسائية والأسبوعية' },
      { title: 'صرف رواتب الأساتذة والموظفين', amount: 410000, type: 'EXPENSE', category: 'Salaires', recordedBy: adminUser._id, date: new Date(new Date().setDate(0)), description: 'تحويل الرواتب الصافية بعد خصم الغيابات' },
      { title: 'فاتورة الكهرباء والغاز والمياه (سونلغاز / سيال)', amount: 48000, type: 'EXPENSE', category: 'Factures (Électricité, Internet, Eau)', recordedBy: adminUser._id, date: new Date(Date.now() - 12 * 86400000), description: 'تسديد فواتير المرافق العامة' },
      { title: 'صيانة مكيفات الهواء وأجهزة المخابر', amount: 35000, type: 'EXPENSE', category: 'Maintenance', recordedBy: schoolUser._id, date: new Date(Date.now() - 14 * 86400000), description: 'صيانة دورية للمكيفات بقاعات التدريس' },
      { title: 'شراء شاشات تفاعلية وسبورات ذكية لقاعات الثانوي', amount: 120000, type: 'EXPENSE', category: 'Équipements', recordedBy: adminUser._id, date: new Date(Date.now() - 7 * 86400000), description: 'تجهيز قاعات المرحلة الثانوية بشاشات تفاعلية' },
      { title: 'اشتراك شبكة الألياف البصرية السريعة (اتصالات الجزائر)', amount: 15000, type: 'EXPENSE', category: 'Factures (Électricité, Internet, Eau)', recordedBy: schoolUser._id, date: new Date(Date.now() - 3 * 86400000), description: 'فاتورة التدفق العالي لإنترنت المؤسسة' },
      { title: 'تحصيل أقساط دراسية للمرحلة الثانوية', amount: 390000, type: 'INCOME', category: 'Tuition / Inscriptions', recordedBy: adminUser._id, date: new Date(Date.now() - 2 * 86400000), description: 'تسديد الأقساط الفصلية لطلاب البكالوريا' },
      { title: 'تجهيزات مواد التنظيف والتعقيم للمدرسة', amount: 22000, type: 'EXPENSE', category: 'Autre', recordedBy: schoolUser._id, date: new Date(Date.now() - 1 * 86400000), description: 'مستلزمات النظافة والصيانة اليومية' },
    ]);
    console.log('[Seed] Financial products, payrolls, and transactions seeded.');

    // 19. Payments
    console.log('[Seed] Seeding Payments...');
    const paymentPlans = [
      { type: 'Tuition', amount: 45000 },
      { type: 'Food', amount: 8000 },
      { type: 'Transport', amount: 5000 },
      { type: 'Activity', amount: 4000 },
    ];
    const pMethods = ['Cash', 'Card', 'Bank Transfer'];
    const pStatuses = ['Paid', 'Paid', 'Pending', 'Paid'];

    for (const stud of studentDocs) {
      for (const plan of paymentPlans) {
        const status = pStatuses[Math.floor(Math.random() * pStatuses.length)];
        await Payment.create({
          parent: stud.parent,
          student: stud._id,
          amount: plan.amount,
          type: plan.type,
          status,
          paidAt: status === 'Paid' ? new Date(Date.now() - Math.floor(Math.random() * 25) * 86400000) : undefined,
          paymentMethod: pMethods[Math.floor(Math.random() * pMethods.length)],
          transactionId: `TXN_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        });
      }
    }
    console.log('[Seed] Payment invoices seeded.');

    // 20. Canteen Reservations
    console.log('[Seed] Seeding Canteen Reservations...');
    // Distinct user and date to satisfy unique index { user: 1, date: 1 }
    await CanteenReservation.insertMany([
      {
        user: studentUsers[0]._id, // Yanis
        mealType: 'Déjeuner (Glaçé/Normal)',
        date: today,
        status: 'Reserved',
        remarks: 'وجبة الغداء العادية',
      },
      {
        user: studentUsers[1]._id, // Leila
        mealType: 'Déjeuner (Glaçé/Normal)',
        date: today,
        status: 'Reserved',
        remarks: 'وجبة الغداء العادية',
      },
      {
        user: studentUsers[2]._id, // Meriem
        mealType: 'Menu Régime Spécial',
        date: today,
        status: 'Reserved',
        remarks: 'حمية غذائية خالية من الغلوتين ومسببات الحساسية',
      },
      {
        user: studentUsers[3]._id, // Amin
        mealType: 'Déjeuner (Glaçé/Normal)',
        date: today,
        status: 'Served',
        remarks: 'تم تقديم الوجبة',
      },
      {
        user: studentUsers[4]._id, // Samir
        mealType: 'Snack / Goûter',
        date: today,
        status: 'Reserved',
        remarks: 'وجبة خفيفة مسائية',
      },
      {
        user: teacherUsers[0]._id, // Kamel Math
        mealType: 'Déjeuner (Glaçé/Normal)',
        date: today,
        status: 'Served',
        remarks: 'وجبة الأساتذة',
      },
      {
        user: teacherUsers[1]._id, // Nadia Science
        mealType: 'Déjeuner (Glaçé/Normal)',
        date: today,
        status: 'Reserved',
        remarks: 'وجبة الأساتذة',
      },
      {
        user: studentUsers[0]._id,
        mealType: 'Déjeuner (Glaçé/Normal)',
        date: yesterday,
        status: 'Served',
        remarks: 'وجبة الأمس',
      },
      {
        user: studentUsers[1]._id,
        mealType: 'Déjeuner (Glaçé/Normal)',
        date: yesterday,
        status: 'Served',
        remarks: 'وجبة الأمس',
      },
      {
        user: studentUsers[6]._id, // Riad
        mealType: 'Déjeuner (Glaçé/Normal)',
        date: today,
        status: 'Cancelled',
        remarks: 'إلغاء بناء على طلب الولي بسبب الغياب',
      },
    ]);
    console.log('[Seed] 10 Canteen Reservations seeded.');

    // 21. Exit Passes (Art. 25-26 & Reception/Supervision)
    console.log('[Seed] Seeding Exit Passes...');
    await ExitPass.insertMany([
      {
        student: studentDocs[0]._id, // Yanis Meziane
        class: studentDocs[0].class,
        reason: 'موعد طبي استعجالي في طب العيون مصحوب بالولي',
        exitTime: '11:30',
        accompaniedBy: 'الأب سفيان مزيان',
        status: 'Used',
        issuedBy: pedSupUser._id,
        verifiedByReceptionist: recepUser._id,
        verifiedAt: new Date(Date.now() - 3600000 * 2),
        date: today,
      },
      {
        student: studentDocs[1]._id, // Leila Meziane
        class: studentDocs[1].class,
        reason: 'وعكة صحية بالعيادة المدرسية والرجوع للمنزل للراحة',
        exitTime: '14:15',
        accompaniedBy: 'الأم سارة',
        status: 'Used',
        issuedBy: pedSupUser._id,
        verifiedByReceptionist: recepUser._id,
        verifiedAt: yesterday,
        date: yesterday,
      },
      {
        student: studentDocs[2]._id, // Meriem Belaid
        class: studentDocs[2].class,
        reason: 'مشاركة في مسابقة الشطرنج الولائية ممثلة للمؤسسة',
        exitTime: '10:00',
        accompaniedBy: 'الأستاذ المرافق عبد الحميد حداد',
        status: 'Approved',
        issuedBy: genSupUser._id,
        date: today,
      },
      {
        student: studentDocs[3]._id, // Amin Belaid
        class: studentDocs[3].class,
        reason: 'استدعاء رسمي للفريق الولائي للسباحة',
        exitTime: '13:00',
        accompaniedBy: 'المدرب الوطني',
        status: 'Used',
        issuedBy: genSupUser._id,
        verifiedByReceptionist: recepUser._id,
        verifiedAt: twoDaysAgo,
        date: twoDaysAgo,
      },
      {
        student: studentDocs[4]._id, // Samir Toumi
        class: studentDocs[4].class,
        reason: 'التزام عائلي قاهر مرخص من طرف الإدارة',
        exitTime: '15:00',
        accompaniedBy: 'الولي رشيد تومي',
        status: 'Approved',
        issuedBy: pedSupUser._id,
        date: today,
      },
      {
        student: studentDocs[6]._id, // Riad Amrani
        class: studentDocs[6].class,
        reason: 'جلسة علاج أسنان مبرمجة مسبقاً',
        exitTime: '09:30',
        accompaniedBy: 'الأم فتيحة عمراني',
        status: 'Pending',
        issuedBy: pedSupUser._id,
        date: new Date(Date.now() + 86400000),
      },
      {
        student: studentDocs[7]._id, // Selma Amrani
        class: studentDocs[7].class,
        reason: 'مشاركة في مسابقة الشعر والخط العربي الولائية',
        exitTime: '11:00',
        accompaniedBy: 'الأستاذ عبد الحميد حداد',
        status: 'Approved',
        issuedBy: pedSupUser._id,
        date: today,
      },
      {
        student: studentDocs[8]._id, // Yacine Slimani
        class: studentDocs[8].class,
        reason: 'موعد طبي استعجالي في عيادة طب الأطفال',
        exitTime: '13:30',
        accompaniedBy: 'الأب مراد سليماني',
        status: 'Used',
        issuedBy: genSupUser._id,
        verifiedByReceptionist: recepUser._id,
        verifiedAt: new Date(Date.now() - 3600000 * 3),
        date: today,
      },
      {
        student: studentDocs[10]._id, // Mehdi Zerrouki
        class: studentDocs[10].class,
        reason: 'تمثيل المدرسة في تصفيات أولمبياد الروبوتيك بالجزائر العاصمة',
        exitTime: '10:30',
        accompaniedBy: 'المشرف البيداغوجي',
        status: 'Approved',
        issuedBy: genSupUser._id,
        date: yesterday,
      },
      {
        student: studentDocs[11]._id, // Maya Zerrouki
        class: studentDocs[11].class,
        reason: 'التزام عائلي طارئ مصحوبة بوالدتها',
        exitTime: '14:00',
        accompaniedBy: 'الأم أمينة زروقي',
        status: 'Used',
        issuedBy: pedSupUser._id,
        verifiedByReceptionist: recepUser._id,
        verifiedAt: new Date(Date.now() - 3600000 * 2),
        date: yesterday,
      },
    ]);
    console.log('[Seed] 10 Exit Passes seeded.');

    // 22. Material Damage & Maintenance Reports
    console.log('[Seed] Seeding Material Damage reports...');
    await MaterialDamage.insertMany([
      {
        itemDescription: 'كسر زجاج النافذة الشرقية لقاعة التدريس 3S إثر هبوب رياح قوية',
        location: 'قاعة 3S - الجناح ب، الطابق الأول',
        estimatedCost: 4500,
        reportedBy: teacherUsers[0]._id,
        status: 'Reviewed by General Supervisor',
        generalSupervisorRemarks: 'تم إرسال فريق الصيانة وتركيب لوح زجاجي أمني جديد.',
        date: yesterday,
      },
      {
        itemDescription: 'عطل في جهاز العرض الرقمي (Data Show) لقاعة الفيزياء',
        location: 'مخبر الفيزياء والكيمياء - الطابق الأرضي',
        estimatedCost: 12000,
        reportedBy: pedSupUser._id,
        status: 'Repaired',
        generalSupervisorRemarks: 'تم استبدال المصباح الأصلي وتجربة العرض بنجاح.',
        date: threeDaysAgo,
      },
      {
        itemDescription: 'تلف في مقبض باب القاعة 1AP الابتدائية',
        location: 'قاعة 1AP - جناح الابتدائي',
        estimatedCost: 1800,
        reportedBy: recepUser._id,
        status: 'Reported',
        date: today,
      },
      {
        itemDescription: 'انسداد في شبكة الصرف بالمطبخ المركزي للمطعم المدرسي',
        location: 'المطعم المدرسي',
        estimatedCost: 6000,
        reportedBy: genSupUser._id,
        status: 'Repaired',
        generalSupervisorRemarks: 'تم التدخل الفوري وتطهير شبكة الصرف وتسليك الأنابيب.',
        date: fourDaysAgo,
      },
      {
        itemDescription: 'كسر في طاولة دراسية خشبية مزدوجة بقسم 2AM',
        location: 'القاعة 12 - الطور المتوسط',
        estimatedCost: 3500,
        reportedBy: teacherUsers[2]._id,
        status: 'Reviewed by General Supervisor',
        generalSupervisorRemarks: 'تم سحب الطاولة وإصلاحها بورشة النجارة المدرسية.',
        date: twoDaysAgo,
      },
      {
        itemDescription: 'معايرة المجاهر الضوئية واستبدال المصابيح بمخبر العلوم الطبيعية',
        location: 'مخبر العلوم الطبيعية - الطابق الأول',
        estimatedCost: 8000,
        reportedBy: teacherUsers[1]._id,
        status: 'Repaired',
        generalSupervisorRemarks: 'تمت المعايرة التقنية من طرف مهندس الصيانة وتعمل جميع المجاهر بكفاءة.',
        date: yesterday,
      },
      {
        itemDescription: 'تنظيف وتغيير مرشحات مكيفات الهواء بقاعة المطالعة والمكتبة',
        location: 'المكتبة المدرسية المركزية',
        estimatedCost: 4000,
        reportedBy: schoolUser._id,
        status: 'Repaired',
        generalSupervisorRemarks: 'تم تنظيف الفلاتر وتطهير مجاري الهواء استعداداً لفصل الشتاء.',
        date: threeDaysAgo,
      },
      {
        itemDescription: 'تلف شبكة كرة السلة واستبدال لوح التهديف في الملعب الرياضي',
        location: 'الملعب الرياضي متعدد النشاطات',
        estimatedCost: 7500,
        reportedBy: genSupUser._id,
        status: 'Reviewed by General Supervisor',
        generalSupervisorRemarks: 'تم إعداد طلب الشراء وسيجري التركيب في عطلة نهاية الأسبوع.',
        date: twoDaysAgo,
      },
      {
        itemDescription: 'نفاد حبر واستبدال أسطوانة الطباعة (Drum) بطابعة الأمانة العامة',
        location: 'مكتب السكرتاريا والاستقبال',
        estimatedCost: 11000,
        reportedBy: recepUser._id,
        status: 'Reviewed by General Supervisor',
        generalSupervisorRemarks: 'تم توفير الحبر الجديد واستبدال الأسطوانة وطباعة كشوف النقاط جارية.',
        date: today,
      },
    ]);
    console.log('[Seed] 9 Material Damage reports seeded.');

    // 23. Visitor Logs (Recorded by Receptionist)
    console.log('[Seed] Seeding Visitor Logs...');
    await VisitorLog.insertMany([
      {
        visitorName: 'السيد سفيان مزيان',
        visitorPhone: '0550110011',
        visitorIdCard: '160124890123',
        visitType: 'Parent',
        purpose: 'مقابلة المشرفة البيداغوجية لاستلام الشهادة المدرسية ومناقشة تقييم يانيس',
        personToVisit: 'زكية بن عيسى (المشرفة البيداغوجية)',
        checkInTime: new Date(Date.now() - 3600000 * 3),
        checkOutTime: new Date(Date.now() - 3600000 * 2),
        status: 'Departed',
        recordedBy: recepUser._id,
        date: today,
      },
      {
        visitorName: 'المفتش عبد القادر بلقاسمي',
        visitorPhone: '0555998877',
        visitorIdCard: '160088776655',
        visitType: 'Inspection Pédagogique',
        purpose: 'زيارة تفتيشية وتوجيهية لأساتذة مادة الرياضيات بالطور الثانوي',
        personToVisit: 'مدير المؤسسة والمشرف البيداغوجي',
        checkInTime: new Date(Date.now() - 3600000 * 5),
        checkOutTime: new Date(Date.now() - 3600000 * 1),
        status: 'Departed',
        recordedBy: recepUser._id,
        date: today,
      },
      {
        visitorName: 'مؤسسة القرطاسية الحديثة - السيد رابح',
        visitorPhone: '0560123456',
        visitorIdCard: '160155667788',
        visitType: 'Livraison / Matériel',
        purpose: 'تسليم طلبيات أوراق الطباعة وكتب النشاطات المدرسية للموسم الدراسي',
        personToVisit: 'المقتصد / مصلحة الوسائل العامة',
        checkInTime: new Date(Date.now() - 3600000 * 4),
        checkOutTime: new Date(Date.now() - 3600000 * 3.5),
        status: 'Departed',
        recordedBy: recepUser._id,
        date: today,
      },
      {
        visitorName: 'السيدة فاطمة الزهراء بن دحمان',
        visitorPhone: '0551334455',
        visitorIdCard: '160199887744',
        visitType: 'Inscription',
        purpose: 'إيداع ملف تسجيل جديد لتلميذ في السنة الأولى ابتدائي',
        personToVisit: 'مكتب التسجيلات والاستقبال',
        checkInTime: new Date(Date.now() - 3600000 * 1.5),
        status: 'In School',
        recordedBy: recepUser._id,
        date: today,
      },
      {
        visitorName: 'السيد رشيد تومي',
        visitorPhone: '0550330033',
        visitorIdCard: '160044556677',
        visitType: 'Parent',
        purpose: 'تسوية اشتراك المطعم المدرسي للثلاثي القادم',
        personToVisit: 'مصلحة المالية والمحاسبة',
        checkInTime: new Date(Date.now() - 86400000 - 3600000 * 4),
        checkOutTime: new Date(Date.now() - 86400000 - 3600000 * 3),
        status: 'Departed',
        recordedBy: recepUser._id,
        date: yesterday,
      },
      {
        visitorName: 'تقني اتصالات الجزائر - كمال',
        visitorPhone: '0550889900',
        visitorIdCard: '160133221100',
        visitType: 'Autre',
        purpose: 'صيانة خط الألياف البصرية وإعداد نقطة الوصول اللاسلكية للمكتبة',
        personToVisit: 'مسؤول الإعلام الآلي',
        checkInTime: new Date(Date.now() - 86400000 - 3600000 * 2),
        checkOutTime: new Date(Date.now() - 86400000 - 3600000 * 0.5),
        status: 'Departed',
        recordedBy: recepUser._id,
        date: yesterday,
      },
      {
        visitorName: 'السيدة فتيحة عمراني',
        visitorPhone: '0550440044',
        visitorIdCard: '160077889900',
        visitType: 'Parent',
        purpose: 'استفسار حول برنامج حصص الدعم المدرسي ليوم السبت',
        personToVisit: 'المشرف العام',
        checkInTime: new Date(Date.now() - 3600000 * 0.5),
        status: 'In School',
        recordedBy: recepUser._id,
        date: today,
      },
      {
        visitorName: 'طبيب الصحة المدرسية - د. بن مهيدي',
        visitorPhone: '0559443322',
        visitorIdCard: '160011223344',
        visitType: 'Inspection Pédagogique',
        purpose: 'الفحص الدوري الشامل لتلاميذ السنة الأولى ابتدائي',
        personToVisit: 'العيادة المدرسية',
        checkInTime: new Date(Date.now() - 2 * 86400000 - 3600000 * 4),
        checkOutTime: new Date(Date.now() - 2 * 86400000 - 3600000 * 1),
        status: 'Departed',
        recordedBy: recepUser._id,
        date: twoDaysAgo,
      },
      {
        visitorName: 'السيد مراد سليماني',
        visitorPhone: '0550550055',
        visitorIdCard: '160022334455',
        visitType: 'Parent',
        purpose: 'استلام الشهادة المدرسية المترجمة للتلميذ ياسين ومقابلة المشرف العام',
        personToVisit: 'مكتب الاستقبال والمشرف العام',
        checkInTime: new Date(Date.now() - 3600000 * 2),
        checkOutTime: new Date(Date.now() - 3600000 * 1),
        status: 'Departed',
        recordedBy: recepUser._id,
        date: today,
      },
      {
        visitorName: 'المفتشة حسيبة لعمري',
        visitorPhone: '0555332211',
        visitorIdCard: '160099112233',
        visitType: 'Inspection Pédagogique',
        purpose: 'متابعة بيداغوجية لمناهج الطور الابتدائي وزيارة تفقدية لقسم 1AP',
        personToVisit: 'المشرفة البيداغوجية ومديرة المؤسسة',
        checkInTime: new Date(Date.now() - 3600000 * 4),
        status: 'In School',
        recordedBy: recepUser._id,
        date: today,
      },
      {
        visitorName: 'دار الكتاب الجزائري - السيد سفيان حداد',
        visitorPhone: '0561223344',
        visitorIdCard: '160177665544',
        visitType: 'Livraison / Matériel',
        purpose: 'تسليم دفعة المراجع العلمية وروايات مسابقة تحدي القراءة العربي للمكتبة',
        personToVisit: 'أمينة المكتبة والمقتصد',
        checkInTime: new Date(Date.now() - 86400000 - 3600000 * 5),
        checkOutTime: new Date(Date.now() - 86400000 - 3600000 * 4),
        status: 'Departed',
        recordedBy: recepUser._id,
        date: yesterday,
      },
      {
        visitorName: 'تقني سونلغاز - السيد سليم',
        visitorPhone: '0550991122',
        visitorIdCard: '160144332211',
        visitType: 'Autre',
        purpose: 'المعاينة الدورية لشبكة الغاز ومحطة التدفئة المركزية المدرسية',
        personToVisit: 'مسؤول الصيانة والأمن',
        checkInTime: new Date(Date.now() - 2 * 86400000 - 3600000 * 3),
        checkOutTime: new Date(Date.now() - 2 * 86400000 - 3600000 * 1.5),
        status: 'Departed',
        recordedBy: recepUser._id,
        date: twoDaysAgo,
      },
    ]);
    console.log('[Seed] 12 Visitor Logs seeded.');

    // 24. Official Administrative Documents
    console.log('[Seed] Seeding Documents...');
    await Document.insertMany([
      {
        type: 'teacher_contract',
        fileName: 'نموذج_عقد_العمل_الخاص_بالأساتذة.pdf',
        originalName: 'Contrat_Enseignant_Ecole_Hebr_2026.pdf',
        fileUrl: '/uploads/contrat_enseignant_modele.pdf',
        uploadedBy: adminUser._id,
      },
      {
        type: 'parent_regulations',
        fileName: 'النظام_الداخلي_المصادق_عليه_لمؤسسة_حبر.pdf',
        originalName: 'Reglement_Interieur_Ecole_Hebr_2026.pdf',
        fileUrl: '/uploads/reglement_interieur_ecole_hebr.pdf',
        uploadedBy: schoolUser._id,
      },
    ]);
    console.log('[Seed] 2 Administrative Documents seeded.');

    // 25. Security & System Audit Logs
    console.log('[Seed] Seeding Audit Logs...');
    await AuditLog.insertMany([
      {
        user: adminUser._id,
        action: 'STUDENT_RECORD_ACCESS',
        targetType: 'Student',
        targetId: studentDocs[0]._id.toString(),
        reason: 'استخراج وتدقيق ملف الرقمنة الوطني للتلميذ يانيس مزيان',
        ipAddress: '192.168.1.15',
        metadata: { studentRegistration: 'REG-26-001', nationalId: '20261601001' },
      },
      {
        user: genSupUser._id,
        action: 'ABSENCE_WARNING_ISSUED',
        targetType: 'AbsenceWarning',
        targetId: studentDocs[0]._id.toString(),
        reason: 'إصدار إعذار رسمي لتجاوز 3 غيابات للتلميذ يانيس مزيان',
        ipAddress: '192.168.1.20',
        metadata: { absenceCount: 3, warningLevel: 1 },
      },
      {
        user: adminUser._id,
        action: 'CONVERSATION_AUDIT',
        targetType: 'Conversation',
        targetId: 'group_class_1AP',
        reason: 'تدقيق إداري دوري لمحادثات المجموعات المدرسية وفق المادة 18',
        ipAddress: '192.168.1.10',
        metadata: { auditedChannel: 'group_class_1AP' },
      },
      {
        user: adminUser._id,
        action: 'BACKUP_CREATE',
        targetType: 'Backup',
        reason: 'إنشاء نسخة احتياطية مشفرة بـ AES-256-CBC لقاعدة البيانات',
        ipAddress: '127.0.0.1',
        metadata: { algorithm: 'aes-256-cbc', collectionsCount: 30 },
      },
      {
        user: adminUser._id,
        action: 'BACKUP_RESTORE_TEST',
        targetType: 'Backup',
        reason: 'اختبار دوري لسلامة استعادة النسخة الاحتياطية المشفرة (المادة 65)',
        ipAddress: '127.0.0.1',
        metadata: { verifiedCollections: 30, testStatus: 'PASSED' },
      },
      {
        user: adminUser._id,
        action: 'SETTINGS_UPDATE',
        targetType: 'SchoolSetting',
        reason: 'تحديث الهوية البصرية الرسمية، ألوان الواجهة وشعار المؤسسة',
        ipAddress: '192.168.1.10',
        metadata: { primaryColor: '#F4B400', slogan: 'يا نشء أنت رجاؤنا' },
      },
      {
        user: schoolUser._id,
        action: 'ADMIN_REQUEST_PROCESSED',
        targetType: 'AdministrativeRequest',
        targetId: 'REQ-2026-0001',
        reason: 'المصادقة على إصدار شهادة مدرسية رسمية للولي سفيان مزيان',
        ipAddress: '192.168.1.12',
        metadata: { requestType: 'school_certificate', trackingNumber: 'REQ-2026-0001' },
      },
      {
        user: adminUser._id,
        action: 'LOGIN_SECURITY_LOCKOUT',
        targetType: 'User',
        targetId: 'student.yanis',
        reason: 'تنبيه أمان: محاولة تسجيل دخول فاشلة متكررة وتفعيل حماية القفل',
        ipAddress: '192.168.1.55',
        metadata: { attemptsCount: 4, actionTaken: 'Temporarily Locked' },
      },
    ]);
    console.log('[Seed] 8 Audit Logs seeded.');

    // 26. Encrypted Backup Logs
    console.log('[Seed] Seeding Backup Logs...');
    await BackupLog.insertMany([
      {
        filename: 'zitouni_backup_2026-10-27_manual.enc',
        filePath: 'C:\\Users\\PC\\Desktop\\zitouni project\\backend\\backups\\zitouni_backup_2026-10-27_manual.enc',
        sizeBytes: 154200,
        checksum: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        isEncrypted: true,
        encryptionAlgorithm: 'aes-256-cbc',
        collectionsCount: 30,
        totalDocuments: 1114,
        status: 'Success',
        triggerType: 'Manual',
        createdBy: adminUser._id,
        restoreVerified: true,
        restoreVerifiedAt: new Date(),
        restoreTestResult: { verifiedCollections: 30, integrityPassed: true },
      },
      {
        filename: 'zitouni_backup_2026-10-26_auto.enc',
        filePath: 'C:\\Users\\PC\\Desktop\\zitouni project\\backend\\backups\\zitouni_backup_2026-10-26_auto.enc',
        sizeBytes: 148500,
        checksum: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        isEncrypted: true,
        encryptionAlgorithm: 'aes-256-cbc',
        collectionsCount: 29,
        totalDocuments: 1080,
        status: 'Success',
        triggerType: 'Automated',
        createdBy: adminUser._id,
        restoreVerified: true,
        restoreVerifiedAt: new Date(Date.now() - 86400000),
        restoreTestResult: { verifiedCollections: 29, integrityPassed: true },
      },
    ]);
    console.log('[Seed] 2 Backup Logs seeded.');

    // 27. Schedules (Timetables, Weekly Canteen Food Menu, Bus Route, Exam Calendar)
    console.log('[Seed] Seeding Schedules...');
    await Schedule.insertMany([
      {
        type: 'Timetable',
        title: 'جدول التوقيت - قسم 3 علوم تجريبية (الفوج أ)',
        class: c3S._id,
        group: g3S_A._id,
        data: {
          Lundi: ['08:00 - رياضيات', '10:00 - فيزياء', '14:00 - علوم طبيعية'],
          Mardi: ['08:00 - فلسفة', '10:00 - لغة انجليزية', '14:00 - رياضيات'],
          Mercredi: ['08:00 - فيزياء', '10:00 - لغة عربية'],
          Jeudi: ['08:00 - علوم طبيعية', '10:00 - تاريخ وجغرافيا', '14:00 - لغة فرنسية'],
          Vendredi: [],
        },
        isActive: true,
      },
      {
        type: 'Timetable',
        title: 'جدول التوقيت - السنة الأولى ابتدائي (الفوج أ)',
        class: c1AP._id,
        group: g1AP_A._id,
        data: {
          Lundi: ['08:30 - لغة فرنسية', '10:30 - رياضيات', '13:30 - لغة عربية'],
          Mardi: ['08:30 - لغة عربية', '10:30 - علوم طبيعية', '13:30 - رسم'],
          Mercredi: ['08:30 - رياضيات', '10:30 - لغة فرنسية'],
          Jeudi: ['08:30 - تربية اسلامية', '10:30 - لغة عربية', '13:30 - تربية بدنية'],
          Vendredi: [],
        },
        isActive: true,
      },
      {
        type: 'Food',
        title: 'قائمة الأسبوع - المطعم المدرسي (أطباق جزائرية متوازنة وصحية)',
        data: {
          Lundi: 'عدس تقليدي بزيت الزيتون، شريحة دجاج مشوية، سلطة خضراء، برتقال طازج',
          Mardi: 'كسكس جزائري بالخضر والدجاج، تمر دقلة نور، لبن رائب',
          Mercredi: 'بوري بطاطا منزلي، لحم بقر مفروم طازج، تفاحة خضراء',
          Jeudi: 'أرز بالزعفران والبازيلاء، سمك بصلصة الليمون، ياغورت طبيعي',
          Vendredi: 'عطلة نهاية الأسبوع',
        },
        isActive: true,
      },
      {
        type: 'Transport',
        title: 'الخط 3 - النقل المدرسي (أولاد فايت المركز / حي 1200 مسكن)',
        data: {
          Ligne: 'الخط 3 - أولاد فايت المركز / حي 1200 مسكن',
          Chauffeur: 'عمي أحمد بن مبارك (0555-12-34-56)',
          Arrêts: [
            '07:15 - حي 1200 مسكن (الانطلاق)',
            '07:30 - حي 800 مسكن (المدخل الرئيسي)',
            '07:45 - أولاد فايت المركز (أمام البريد)',
            '08:00 - مؤسسة حبر وألوان (الوصول للمدرسة)',
          ],
        },
        isActive: true,
      },
      {
        type: 'Exam',
        title: 'رزنامة امتحانات البكالوريا التجريبية - دورة 2026',
        class: c3S._id,
        data: [
          { Matière: 'علوم طبيعية', Date: '2026-05-17', Heure: '08:30 - 12:30', Salle: 'قاعة المحاضرات أ' },
          { Matière: 'رياضيات', Date: '2026-05-18', Heure: '08:30 - 12:00', Salle: 'قاعة الامتحان 4' },
          { Matière: 'فيزياء', Date: '2026-05-19', Heure: '08:30 - 12:00', Salle: 'قاعة الامتحان 4' },
          { Matière: 'لغة عربية', Date: '2026-05-20', Heure: '08:30 - 11:00', Salle: 'قاعة الامتحان 2' },
        ],
        isActive: true,
      },
      {
        type: 'Exam',
        title: 'الامتحانات الفصلية - السنة الأولى ابتدائي',
        class: c1AP._id,
        data: [
          { Matière: 'لغة عربية', Date: '2026-05-24', Heure: '09:00 - 10:30', Salle: 'القسم 1AP' },
          { Matière: 'رياضيات', Date: '2026-05-25', Heure: '09:00 - 10:30', Salle: 'القسم 1AP' },
          { Matière: 'تربية اسلامية', Date: '2026-05-26', Heure: '09:00 - 10:00', Salle: 'القسم 1AP' },
        ],
        isActive: true,
      },
      {
        type: 'Timetable',
        title: 'جدول التوقيت - السنة الأولى متوسط (1AM - الفوج أ)',
        class: c1AM._id,
        group: g1AM_A._id,
        data: {
          Lundi: ['08:00 - لغة عربية', '10:00 - رياضيات', '13:30 - تاريخ وجغرافيا'],
          Mardi: ['08:00 - علوم طبيعية', '10:00 - لغة فرنسية', '13:30 - تربية إسلامية'],
          Mercredi: ['08:00 - رياضيات', '10:00 - إنجليزية'],
          Jeudi: ['08:00 - فيزياء', '10:00 - لغة عربية', '13:30 - تربية بدنية'],
          Vendredi: [],
        },
        isActive: true,
      },
      {
        type: 'Timetable',
        title: 'جدول التوقيت - السنة الرابعة متوسط (4AM - تحضير BEM)',
        class: c4AM ? c4AM._id : c1AM._id,
        data: {
          Lundi: ['08:00 - رياضيات', '10:00 - علوم طبيعية', '13:30 - لغة عربية'],
          Mardi: ['08:00 - فيزياء', '10:00 - لغة فرنسية', '13:30 - إنجليزية'],
          Mercredi: ['08:00 - لغة عربية', '10:00 - رياضيات'],
          Jeudi: ['08:00 - تاريخ وجغرافيا', '10:00 - تربية إسلامية', '13:30 - تربية مدنية'],
          Vendredi: [],
        },
        isActive: true,
      },
      {
        type: 'Transport',
        title: 'الخط 1 - النقل المدرسي (الشراقة / بوشاوي / أولاد فايت)',
        data: {
          Ligne: 'الخط 1 - الشراقة / بوشاوي / أولاد فايت',
          Chauffeur: 'عمي مصطفى قاسي (0555-88-99-00)',
          Arrêts: [
            '07:05 - محطة الحافلات الشراقة',
            '07:20 - مدخل غابة بوشاوي',
            '07:35 - إقامة بساتين أولاد فايت',
            '07:55 - مدرسة حبر (الوصول للمؤسسة)',
          ],
        },
        isActive: true,
      },
      {
        type: 'Exam',
        title: 'رزنامة الامتحان التجريبي لشهادة التعليم المتوسط (BEM Blanc)',
        class: c4AM ? c4AM._id : c1AM._id,
        data: [
          { Matière: 'لغة عربية', Date: '2026-05-10', Heure: '08:30 - 10:30', Salle: 'قاعة الامتحانات 1' },
          { Matière: 'علوم فيزيائية', Date: '2026-05-10', Heure: '11:00 - 12:30', Salle: 'قاعة الامتحانات 1' },
          { Matière: 'رياضيات', Date: '2026-05-11', Heure: '08:30 - 10:30', Salle: 'قاعة الامتحانات 1' },
          { Matière: 'علوم طبيعية', Date: '2026-05-11', Heure: '11:00 - 12:30', Salle: 'قاعة الامتحانات 1' },
        ],
        isActive: true,
      },
    ]);
    console.log('[Seed] 10 Schedules seeded.');

    // 28. Courses
    console.log('[Seed] Seeding Courses...');
    await Course.insertMany([
      {
        title: 'سند درس النهايات والدوال المشتقة لقسم العلوم',
        description: 'سند درس شامل حول حساب النهايات ودراسة الدوال المشتقة لطلاب البكالوريا.',
        subject: 'رياضيات',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        fileName: 'limites_et_derivees_3as.pdf',
        class: c3S._id,
        group: g3S_A._id,
        teacher: teacherDocs[0]._id,
      },
      {
        title: 'كراس الحساب والأرقام من 1 إلى 100',
        description: 'بطاقة تعلم مصورة لإتقان كتابة وحساب الأرقام للأطفال.',
        subject: 'رياضيات',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        fileName: 'chiffres_1_100_1ap.pdf',
        class: c1AP._id,
        group: g1AP_A._id,
        teacher: teacherDocs[0]._id,
      },
      {
        title: 'تمارين الحروف الهجائية باللغة العربية',
        description: 'كراس تمارين الكتابة والنطق للمبتدئين في اللغة العربية.',
        subject: 'لغة عربية',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        fileName: 'alphabet_arabe_debutant.pdf',
        class: c1AP._id,
        group: g1AP_A._id,
        teacher: teacherDocs[2]._id,
      },
      {
        title: 'أعمال تطبيقية: التعرية والترسب والصفائح التكتونية',
        description: 'وثيقة أعمال تطبيقية تحتوي على تعليمات رسم مقاطع التربة والجيولوجيا.',
        subject: 'علوم طبيعية',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        fileName: 'tp_geologie_3as.pdf',
        class: c3S._id,
        group: g3S_A._id,
        teacher: teacherDocs[1]._id,
      },
      {
        title: 'مراجعة شاملة في التحليل النحوي والإعراب',
        description: 'بطاقة تمارين دعم وتطبيقات حول التحليل النحوي في اللغة العربية.',
        subject: 'لغة عربية',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        fileName: 'grammaire_arabe_bac.pdf',
        class: c3S._id,
        group: g3S_B._id,
        teacher: teacherDocs[2]._id,
      },
      {
        title: 'Fiche pédagogique : La structure du récit et les temps du passé',
        description: 'Guide complet pour la rédaction d’un récit court en langue française.',
        subject: 'لغة فرنسية',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        fileName: 'structure_du_recit_4ap.pdf',
        class: c4AP._id,
        group: g4AP_A._id,
        teacher: teacherDocs[4]._id,
      },
      {
        title: 'أحكام التجويد: مخارج الحروف وصفاتها والمد الطبيعي والفرعي',
        description: 'دليل تيسير أحكام التلاوة والتجويد للطور المتوسط متضمناً أمثلة تطبيقية.',
        subject: 'تربية اسلامية',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        fileName: 'regles_tajweed_coran_2am.pdf',
        class: c2AM._id,
        group: g2AM_A._id,
        teacher: teacherDocs[2]._id,
      },
      {
        title: 'English Language Practice : Active vs Passive Voice & Phrasal Verbs',
        description: 'Interactive worksheets and grammar drills for 4AM BEM candidates.',
        subject: 'لغة إنجليزية',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        fileName: 'english_grammar_bem_4am.pdf',
        class: c1AM._id,
        group: g1AM_A._id,
        teacher: teacherDocs[5]._id,
      },
      {
        title: 'سلسلة تمارين الميكانيك: الحركة الدائرية المنتظمة والقوة الضاغطة',
        description: 'مسائل نموذجية محلولة بالتفصيل في الميكانيك الكلاسيكي لطلاب أولى ثانوي.',
        subject: 'فيزياء',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        fileName: 'mecanique_circulaire_1sci.pdf',
        class: c1Sci._id,
        group: g1Sci_A._id,
        teacher: teacherDocs[3]._id,
      },
      {
        title: 'Étude de texte d’histoire : Témoignages sur la guerre de libération nationale',
        description: 'Analyse méthodique des discours et textes mémoriels pour la classe terminale.',
        subject: 'لغة فرنسية',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        fileName: 'texte_histoire_bac_3as.pdf',
        class: c3S._id,
        group: g3S_A._id,
        teacher: teacherDocs[4]._id,
      },
      {
        title: 'البلاغة والبيان: الاستعارة المكنية والتصريحية وأثرهما في النص الأدبي',
        description: 'ملخص شافي مع نماذج إعرابية وتحليلية من الشعر العربي القديم والحديث.',
        subject: 'لغة عربية',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        fileName: 'balagha_istiara_1sci.pdf',
        class: c1Sci._id,
        group: g1Sci_B._id,
        teacher: teacherDocs[2]._id,
      },
      {
        title: 'سلسلة تمارين الأعداد النسبية والعمليات الحسابية الأربع',
        description: 'تمارين تطبيقية وتدريبات على ترتيب ومقارنة الأعداد النسبية لطلاب السنة الأولى متوسط.',
        subject: 'رياضيات',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        fileName: 'nombres_relatifs_1am.pdf',
        class: c1AM._id,
        group: g1AM_A._id,
        teacher: teacherDocs[0]._id,
      },
    ]);
    console.log('[Seed] 12 Courses seeded.');

    // 29. Timetable Entries from data/timetableEntries.json or RAN09.DBF.xlsx
    console.log('[Seed] Checking Timetable Entries for all classes and groups...');
    const localJsonPath = path.join(__dirname, 'data', 'timetableEntries.json');
    if (fs.existsSync(localJsonPath)) {
      const jsonEntries = JSON.parse(fs.readFileSync(localJsonPath, 'utf8'));
      const existingTimetableCount = await TimetableEntry.countDocuments();
      if (existingTimetableCount < jsonEntries.length) {
        console.log(`[Seed] Syncing complete timetable (${jsonEntries.length} entries for all classes & groups) to database...`);
        await TimetableEntry.deleteMany({});
        const batchSize = 500;
        for (let i = 0; i < jsonEntries.length; i += batchSize) {
          const chunk = jsonEntries.slice(i, i + batchSize);
          await TimetableEntry.insertMany(chunk);
        }
        console.log(`[Seed] ${jsonEntries.length} Timetable Entries inserted covering all classes and groups.`);
      } else {
        console.log(`[Seed] TimetableEntry already contains ${existingTimetableCount} entries. Preserved.`);
      }
    } else {
      console.log('[Seed] timetableEntries.json not found, skipping timetable import.');
    }

    console.log('[Seed] ========================================================');
    console.log('[Seed] COMPREHENSIVE SEEDING COMPLETED FOR ALL 30 TABLES/MODELS!');
    console.log('[Seed] ========================================================');

    // Print summary counts for verification
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n--- COLLECTION DOCUMENT COUNTS ---');
    const counts = {};
    for (const c of collections.sort((a, b) => a.name.localeCompare(b.name))) {
      const count = await mongoose.connection.db.collection(c.name).countDocuments();
      counts[c.name] = count;
      console.log(`${c.name.padEnd(28)} : ${count}`);
    }

    if (shouldDisconnect) {
      await mongoose.disconnect();
      console.log('[Seed] Disconnected from MongoDB. Exiting cleanly.');
      process.exit(0);
    }
    return { success: true, counts };
  } catch (error) {
    console.error('[Seed] FATAL ERROR during seeding:', error);
    if (standalone) {
      process.exit(1);
    }
    throw error;
  } finally {
    isSeeding = false;
  }
};

if (require.main === module) {
  seedDatabase(true);
}

module.exports = { seedDatabase };
