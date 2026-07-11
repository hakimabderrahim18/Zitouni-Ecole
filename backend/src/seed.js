const mongoose = require('mongoose');
const User = require('./models/user.model');
const Teacher = require('./models/teacher.model');
const Student = require('./models/student.model');
const Parent = require('./models/parent.model');
const Class = require('./models/class.model');
const Group = require('./models/group.model');
const Payment = require('./models/payment.model');
const Announcement = require('./models/announcement.model');
const Message = require('./models/message.model');
const Schedule = require('./models/schedule.model');
const Course = require('./models/course.model');
const Attendance = require('./models/attendance.model');
const Notification = require('./models/notification.model');
const Module = require('./models/module.model');
const Supervisor = require('./models/supervisor.model');
const Receptionist = require('./models/receptionist.model');
const { FinanceTransaction, FinancialProduct, SalaryDeduction, Payroll } = require('./models/finance.model');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zitouni_school');
    console.log('MongoDB Connected for Seed Level 2...');

    // Clear previous data
    await User.deleteMany({});
    await Teacher.deleteMany({});
    await Student.deleteMany({});
    await Parent.deleteMany({});
    await Class.deleteMany({});
    await Group.deleteMany({});
    await Payment.deleteMany({});
    await Announcement.deleteMany({});
    await Message.deleteMany({});
    await Schedule.deleteMany({});
    await Course.deleteMany({});
    await Attendance.deleteMany({});
    await Notification.deleteMany({});
    await Module.deleteMany({});
    await Supervisor.deleteMany({});
    await Receptionist.deleteMany({});
    await FinanceTransaction.deleteMany({});
    await FinancialProduct.deleteMany({});
    await SalaryDeduction.deleteMany({});
    await Payroll.deleteMany({});
    console.log('Database cleared.');

    // 0. Seed fixed school modules (subjects)
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
    await Module.insertMany(moduleNames.map((name) => ({ name })));
    console.log(`${moduleNames.length} school modules seeded.`);

    // 1. Create all classes across the 3 educational cycles, each with 2 groups
    const cycleClasses = [
      // Cycle Primaire
      { name: '1AP', level: 'primary', description: 'السنة الأولى ابتدائي' },
      { name: '2AP', level: 'primary', description: 'السنة الثانية ابتدائي' },
      { name: '3AP', level: 'primary', description: 'السنة الثالثة ابتدائي' },
      { name: '4AP', level: 'primary', description: 'السنة الرابعة ابتدائي' },
      { name: '5AP', level: 'primary', description: 'السنة الخامسة ابتدائي' },
      // Cycle Moyen (CEM)
      { name: '1AM', level: 'middle', description: 'السنة الأولى متوسط' },
      { name: '2AM', level: 'middle', description: 'السنة الثانية متوسط' },
      { name: '3AM', level: 'middle', description: 'السنة الثالثة متوسط' },
      // Cycle Secondaire (Lycée)
      { name: '1 Scientifique', level: 'secondary', description: 'أولى ثانوي علمي' },
      { name: '1 Lettres', level: 'secondary', description: 'أولى ثانوي أدبي' },
      { name: '2LP', level: 'secondary', description: 'ثانية لغات أجنبية' },
      { name: '2LV', level: 'secondary', description: 'ثانية آداب وفلسفة' },
      { name: '2S', level: 'secondary', description: 'ثانية علوم تجريبية' },
      { name: '2M', level: 'secondary', description: 'ثانية رياضيات' },
      { name: '2MT', level: 'secondary', description: 'ثانية تقني رياضي' },
      { name: '2GT', level: 'secondary', description: 'ثانية تسيير واقتصاد' },
      { name: '3LP', level: 'secondary', description: 'ثالثة لغات أجنبية' },
      { name: '3LE', level: 'secondary', description: 'ثالثة آداب وفلسفة' },
      { name: '3S', level: 'secondary', description: 'ثالثة علوم تجريبية' },
      { name: '3M', level: 'secondary', description: 'ثالثة رياضيات' },
      { name: '3MT', level: 'secondary', description: 'ثالثة تقني رياضي' },
      { name: '3GT', level: 'secondary', description: 'ثالثة تسيير واقتصاد' },
    ];

    const classDocs = [];
    const groupDocs = [];
    for (const cls of cycleClasses) {
      const created = await Class.create(cls);
      classDocs.push(created);
      // Each class contains exactly two groups
      const gA = await Group.create({ name: 'الفوج أ', class: created._id, capacity: 30 });
      const gB = await Group.create({ name: 'الفوج ب', class: created._id, capacity: 30 });
      groupDocs.push(gA, gB);
    }

    console.log(`${classDocs.length} classes created with ${groupDocs.length} groups (2 per class).`);

    // Named references used throughout the rest of the seed
    const findClass = (name) => classDocs.find((c) => c.name === name);
    const groupsOf = (classId) => groupDocs.filter((g) => g.class.toString() === classId.toString());

    const c1 = findClass('1AP');
    const c2 = findClass('4AP');
    const c3 = findClass('3S');

    const [g1, g2] = groupsOf(c1._id);
    const [g3] = groupsOf(c2._id);
    const [g4, g5] = groupsOf(c3._id);

    // 3. Create 3 Teachers (password = phone number automatically)
    const tUser1 = await User.create({
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
    const tProf1 = await Teacher.create({ user: tUser1._id, subjects: ['رياضيات'], classes: [c1._id, c3._id], groups: [g1._id, g4._id] });

    const tUser2 = await User.create({
      username: 'teacher.science',
      email: 'teacher.science@ecole-zitouni.dz',
      password: '0550222222',
      firstName: 'نادية',
      lastName: 'صالحي',
      role: 'teacher',
      phoneNumber: '0550222222',
      baseSalary: 65000,
      salaryDeductionPerAbsence: 2500,
    });
    const tProf2 = await Teacher.create({ user: tUser2._id, subjects: ['علوم طبيعية'], classes: [c1._id, c2._id], groups: [g2._id, g3._id] });

    const tUser3 = await User.create({
      username: 'teacher.arabe',
      email: 'teacher.arabe@ecole-zitouni.dz',
      password: '0550333333',
      firstName: 'عبد الحميد',
      lastName: 'حداد',
      role: 'teacher',
      phoneNumber: '0550333333',
      baseSalary: 65000,
      salaryDeductionPerAbsence: 2500,
    });
    const tProf3 = await Teacher.create({ user: tUser3._id, subjects: ['لغة عربية', 'تاريخ وجغرافيا'], classes: [c1._id, c2._id, c3._id], groups: [g1._id, g3._id, g5._id] });

    // Link teachers to groups
    g1.teachers.push(tProf1._id, tProf3._id); await g1.save();
    g2.teachers.push(tProf2._id); await g2.save();
    g3.teachers.push(tProf2._id, tProf3._id); await g3.save();
    g4.teachers.push(tProf1._id); await g4.save();
    g5.teachers.push(tProf3._id); await g5.save();

    // 4. Create 5 Parents (password = phone number)
    const parentAccounts = [
      { username: 'parent.meziane', email: 'parent.meziane@ecole-zitouni.dz', firstName: 'سفيان', lastName: 'مزيان', profession: 'مهندس', address: 'أولاد فايت', phone: '0550110011' },
      { username: 'parent.belaid', email: 'parent.belaid@ecole-zitouni.dz', firstName: 'سارة', lastName: 'بلعيد', profession: 'طبيبة', address: 'أولاد فايت', phone: '0550220022' },
      { username: 'parent.toumi', email: 'parent.toumi@ecole-zitouni.dz', firstName: 'رشيد', lastName: 'تومي', profession: 'محامي', address: 'أولاد فايت', phone: '0550330033' },
      { username: 'parent.amrani', email: 'parent.amrani@ecole-zitouni.dz', firstName: 'فتيحة', lastName: 'عمراني', profession: 'أستاذة', address: 'أولاد فايت', phone: '0550440044' },
      { username: 'parent.slimani', email: 'parent.slimani@ecole-zitouni.dz', firstName: 'مراد', lastName: 'سليماني', profession: 'تاجر', address: 'أولاد فايت', phone: '0550550055' }
    ];

    const parents = [];
    for (const p of parentAccounts) {
      const u = await User.create({ username: p.username, email: p.email, password: p.phone, firstName: p.firstName, lastName: p.lastName, role: 'parent', phoneNumber: p.phone });
      const prof = await Parent.create({ user: u._id, profession: p.profession, address: p.address });
      parents.push(prof);
    }

    // 5. Create 10 Students (Linked to parents and classrooms)
    const studentData = [
      { username: 'student.yanis', email: 'student.yanis@ecole-zitouni.dz', firstName: 'يانيس', lastName: 'مزيان', reg: 'REG-26-001', parent: parents[0], class: c1, group: g1 },
      { username: 'student.leila', email: 'student.leila@ecole-zitouni.dz', firstName: 'ليلى', lastName: 'مزيان', reg: 'REG-26-002', parent: parents[0], class: c2, group: g3 },
      
      { username: 'student.meriem', email: 'student.meriem@ecole-zitouni.dz', firstName: 'مريم', lastName: 'بلعيد', reg: 'REG-26-003', parent: parents[1], class: c1, group: g1 },
      { username: 'student.amin', email: 'student.amin@ecole-zitouni.dz', firstName: 'أمين', lastName: 'بلعيد', reg: 'REG-26-004', parent: parents[1], class: c3, group: g4 },

      { username: 'student.samir', email: 'student.samir@ecole-zitouni.dz', firstName: 'سمير', lastName: 'تومي', reg: 'REG-26-005', parent: parents[2], class: c1, group: g2 },
      { username: 'student.lynda', email: 'student.lynda@ecole-zitouni.dz', firstName: 'ليندة', lastName: 'تومي', reg: 'REG-26-006', parent: parents[2], class: c3, group: g5 },

      { username: 'student.riad', email: 'student.riad@ecole-zitouni.dz', firstName: 'رياض', lastName: 'عمراني', reg: 'REG-26-007', parent: parents[3], class: c2, group: g3 },
      { username: 'student.feriel', email: 'student.feriel@ecole-zitouni.dz', firstName: 'فريال', lastName: 'عمراني', reg: 'REG-26-008', parent: parents[3], class: c3, group: g4 },

      { username: 'student.anis', email: 'student.anis@ecole-zitouni.dz', firstName: 'أنيس', lastName: 'سليماني', reg: 'REG-26-009', parent: parents[4], class: c1, group: g2 },
      { username: 'student.kenza', email: 'student.kenza@ecole-zitouni.dz', firstName: 'كنزة', lastName: 'سليماني', reg: 'REG-26-010', parent: parents[4], class: c2, group: g3 }
    ];

    const students = [];
    for (const s of studentData) {
      const dob = s.dob ? new Date(s.dob) : new Date('2014-03-20');
      // Student password must be their date of birth (YYYY-MM-DD)
      const dobPassword = dob.toISOString().split('T')[0];
      const u = await User.create({ username: s.username, email: s.email, password: dobPassword, firstName: s.firstName, lastName: s.lastName, role: 'student' });
      const prof = await Student.create({
        user: u._id,
        registrationNumber: s.reg,
        class: s.class._id,
        group: s.group._id,
        parent: s.parent._id,
        dateOfBirth: dob
      });
      // Link child to Parent
      s.parent.children.push(prof._id);
      await s.parent.save();
      students.push(prof);
    }

    console.log('10 Students and parent associations established.');

    // 6. Create standard Platform Admins
    const admin = await User.create({ username: 'admin', email: 'admin@ecole-zitouni.dz', password: 'Admin123!', firstName: 'مالك', lastName: 'زيتوني', role: 'admin' });
    const school = await User.create({ username: 'school', email: 'school@ecole-zitouni.dz', password: 'School123!', firstName: 'أمال', lastName: 'بن علي', role: 'school' });

    // 6.5. Create New Roles (Superviseur Général, Superviseur Pédagogique, Réceptionniste)
    const genSupUser = await User.create({
      username: 'superviseur.gen',
      email: 'superviseur.gen@ecole-zitouni.dz',
      password: '0550112233',
      firstName: 'عمر',
      lastName: 'القايد',
      role: 'general_supervisor',
      phoneNumber: '0550112233',
      baseSalary: 85000,
      salaryDeductionPerAbsence: 3000,
    });
    await Supervisor.create({ user: genSupUser._id, supervisorType: 'general_supervisor' });

    const pedSupUser = await User.create({
      username: 'superviseur.ped',
      email: 'superviseur.ped@ecole-zitouni.dz',
      password: '0550445566',
      firstName: 'زكية',
      lastName: 'بن عيسى',
      role: 'pedagogical_supervisor',
      phoneNumber: '0550445566',
      baseSalary: 75000,
      salaryDeductionPerAbsence: 2800,
    });
    await Supervisor.create({
      user: pedSupUser._id,
      supervisorType: 'pedagogical_supervisor',
      assignedClasses: [c1._id, c2._id, c3._id],
      assignedTeachers: [tProf1._id, tProf2._id, tProf3._id],
    });

    const recepUser = await User.create({
      username: 'receptionniste',
      email: 'receptionniste@ecole-zitouni.dz',
      password: '0550778899',
      firstName: 'كريم',
      lastName: 'منصور',
      role: 'receptionist',
      phoneNumber: '0550778899',
      baseSalary: 55000,
      salaryDeductionPerAbsence: 2000,
    });
    await Receptionist.create({ user: recepUser._id });

    // 6.6. Seed Financial Products and sample transactions
    const productsList = [
      { name: 'فصل دراسي أول (الابتدائي)', price: 45000, category: 'Tuition' },
      { name: 'فصل دراسي أول (المتوسط)', price: 55000, category: 'Tuition' },
      { name: 'فصل دراسي أول (الثانوي)', price: 65000, category: 'Tuition' },
      { name: 'اشتراك المطعم المدرسي (شهري)', price: 8000, category: 'Canteen' },
      { name: 'حقيبة الكتب والقرطاسية المدرسية', price: 6500, category: 'Books' },
      { name: 'الزي المدرسي الرياضي والرسمي', price: 4500, category: 'Uniform' },
    ];
    await FinancialProduct.insertMany(productsList);

    await FinanceTransaction.insertMany([
      { title: 'تحصيل أقساط دراسية - أيلول', amount: 450000, type: 'INCOME', category: 'Tuition / Inscriptions', recordedBy: admin._id },
      { title: 'اشتراكات المطعم المدرسي', amount: 80000, type: 'INCOME', category: 'Cantine', recordedBy: school._id },
      { title: 'فاتورة الكهرباء والغاز', amount: 32000, type: 'EXPENSE', category: 'Factures (Électricité, Internet, Eau)', recordedBy: admin._id },
      { title: 'صيانة حواسيب قاعة الإعلام الآلي', amount: 45000, type: 'EXPENSE', category: 'Maintenance', recordedBy: school._id },
    ]);

    const currentMonthStr = new Date().toISOString().slice(0, 7);
    await Payroll.create({
      user: tUser1._id,
      month: currentMonthStr,
      baseSalary: 65000,
      totalAbsenceDays: 0,
      totalDeductions: 0,
      bonuses: 5000,
      netSalary: 70000,
      status: 'Paid',
      paidAt: new Date(),
    });

    console.log('New Roles (Supervisors, Receptionist) and Finance data seeded successfully.');

    // 7. Seed Payments Invoice logs (varied types, statuses & methods)
    const paymentPlans = [
      { type: 'Tuition', amount: 15000 },
      { type: 'Transport', amount: 4000 },
      { type: 'Food', amount: 3500 },
      { type: 'Activity', amount: 2000 },
    ];
    const paymentMethods = ['Cash', 'Card', 'Bank Transfer', 'Mock'];
    const paymentStatuses = ['Paid', 'Paid', 'Pending', 'Failed'];

    for (const stud of students) {
      for (const plan of paymentPlans) {
        const status = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
        await Payment.create({
          parent: stud.parent,
          student: stud._id,
          amount: plan.amount,
          type: plan.type,
          status,
          paidAt: status === 'Paid' ? new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000) : undefined,
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          transactionId: `TXN_${Math.random().toString(36).substring(2, 9).toUpperCase()}`
        });
      }
    }

    console.log('Payment invoices (tuition, transport, food, activity) seeded.');

    // 8. Seed Announcements / news feed posts with likes & comments
    const posts = [
      {
        title: 'حفل نهاية السنة الدراسية بأولاد فايت !',
        content: 'أعزاءنا الأولياء والتلاميذ، ننظم الحفل السنوي يوم الخميس ابتداءً من الساعة الثانية زوالاً. تنتظر تلاميذنا العديد من الأنشطة الممتعة !',
        publisher: school._id,
        publisherRole: 'school',
        isGlobal: true
      },
      {
        title: 'واجب في الرياضيات مطلوب - قسم العلوم',
        content: 'على تلاميذ الفوج أ إنجاز تمرين الهندسة وتسليمه قبل صباح يوم الاثنين.',
        publisher: tUser1._id,
        publisherRole: 'teacher',
        isGlobal: false,
        targetClass: c3._id,
        targetGroup: g4._id
      },
      {
        title: 'خرجة تربوية إلى حديقة التجارب بالحامة',
        content: 'زيارة موجهة مبرمجة لتلاميذ السنة الأولى ابتدائي يوم الثلاثاء. يرجى إعادة استمارة الترخيص موقّعة.',
        publisher: school._id,
        publisherRole: 'school',
        isGlobal: false,
        targetClass: c1._id
      }
    ];

    for (const p of posts) {
      const ann = await Announcement.create(p);

      // Add nested likes from multiple random users
      ann.likes.push(tUser1._id, parents[0].user, admin._id);
      
      // Add multiple comments
      ann.comments.push(
        { user: tUser1._id, userName: 'كمال دحماني', content: 'مبادرة رائعة لتلاميذنا الصغار !' },
        { user: admin._id, userName: 'مالك زيتوني', content: 'تمت المصادقة على المخطط اللوجستي.' },
        { user: parents[0].user, userName: 'سفيان مزيان', content: 'ابناي يانيس وليلى متشوقان للمشاركة !' }
      );
      await ann.save();
    }

    console.log('News posts, likes, and comments seeded.');

    // 9. Seed Messaging (Chat) Logs
    const chats = [
      // 1. Admin <-> School Staff
      {
        sender: admin._id,
        receiver: school._id,
        content: "مرحباً أمال، هل أنهيتِ قائمة التلاميذ لحفل يوم الخميس ؟",
        createdAt: new Date(Date.now() - 3600000 * 24)
      },
      {
        sender: school._id,
        receiver: admin._id,
        content: "مرحباً مالك. نعم، القائمة جاهزة وقد أرسلتُ الدعوات للأولياء مساء أمس. هناك حوالي 85 تسجيلاً حتى الآن.",
        createdAt: new Date(Date.now() - 3600000 * 23)
      },
      {
        sender: admin._id,
        receiver: school._id,
        content: "ممتاز، شكراً. لا تنسي طلب المرطبات وحجز نظام الصوت.",
        createdAt: new Date(Date.now() - 3600000 * 22)
      },

      // 2. School Staff <-> Teacher Kamel (Math)
      {
        sender: school._id,
        receiver: tUser1._id,
        content: "مرحباً كمال، يرجى المصادقة على علامات الامتحانات في البوابة الإدارية قبل هذا المساء.",
        createdAt: new Date(Date.now() - 3600000 * 10)
      },
      {
        sender: tUser1._id,
        receiver: school._id,
        content: "مرحباً أمال، تم الأمر. أنا بصدد إدخال آخر علامات تلاميذ القسم النهائي.",
        createdAt: new Date(Date.now() - 3600000 * 9)
      },

      // 3. Teacher Kamel (Math) <-> Parent Sofiane Meziane (parents[0])
      {
        sender: tUser1._id,
        receiver: parents[0].user,
        content: "مرحباً سيد مزيان، أردت إعلامكم بأن يانيس حقق تقدماً ممتازاً في الرياضيات هذا الأسبوع. يشارك بفعالية في القسم !",
        createdAt: new Date(Date.now() - 3600000 * 5)
      },
      {
        sender: parents[0].user,
        receiver: tUser1._id,
        content: "مرحباً سيد دحماني، شكراً جزيلاً على هذا التقييم الإيجابي ! نشجعه كل يوم في البيت.",
        createdAt: new Date(Date.now() - 3600000 * 4)
      },
      {
        sender: tUser1._id,
        receiver: parents[0].user,
        content: "من دواعي سروري وجوده في القسم. هل يمكنكم التأكد من إتمامه لواجب الهندسة ليوم الاثنين القادم ؟",
        createdAt: new Date(Date.now() - 3600000 * 3)
      },
      {
        sender: parents[0].user,
        receiver: tUser1._id,
        content: "نعم بالتأكيد. سننجزه معاً نهاية الأسبوع. عطلة سعيدة !",
        createdAt: new Date(Date.now() - 3600000 * 2)
      },

      // 4. Teacher Kamel (Math) <-> Parent Sarah Belaid (parents[1])
      {
        sender: tUser1._id,
        receiver: parents[1].user,
        content: "مرحباً سيدة بلعيد، لاحظت أن أمين يواجه بعض الصعوبات في درس التكامل. هل تعتقدين أنه بحاجة إلى تمارين دعم ؟",
        createdAt: new Date(Date.now() - 3600000 * 8)
      },
      {
        sender: parents[1].user,
        receiver: tUser1._id,
        content: "مرحباً سيد دحماني، شكراً على التنبيه. نعم بالفعل يقضي وقتاً طويلاً في ذلك. أرجو أن تعطيه تمارين إضافية.",
        createdAt: new Date(Date.now() - 3600000 * 7)
      },
      {
        sender: tUser1._id,
        receiver: parents[1].user,
        content: "حسناً، سأعطيه بطاقة تمارين موجهة غداً بعد الحصة. طاب يومكم.",
        createdAt: new Date(Date.now() - 3600000 * 6)
      },

      // 5. Teacher Nadia (Science) <-> Parent Sofiane Meziane (parents[0])
      {
        sender: tUser2._id,
        receiver: parents[0].user,
        content: "مرحباً سيد مزيان، أتواصل معكم بخصوص ليلى. لقد نسيت كتاب العلوم اليوم للمرة الثانية على التوالي.",
        createdAt: new Date(Date.now() - 3600000 * 12)
      },
      {
        sender: parents[0].user,
        receiver: tUser2._id,
        content: "المعذرة سيدة صالحي. سأحرص على أن تُحضّر حقيبتها جيداً هذا المساء. شكراً لإعلامي.",
        createdAt: new Date(Date.now() - 3600000 * 11)
      },

      // 6. Teacher Nadia (Science) <-> Parent Rachid Toumi (parents[2])
      {
        sender: tUser2._id,
        receiver: parents[2].user,
        content: "مرحباً سيد تومي، قدّم سمير عرضاً شفوياً ممتازاً حول التنوع البيولوجي اليوم. تهانينا له !",
        createdAt: new Date(Date.now() - 3600000 * 15)
      },
      {
        sender: parents[2].user,
        receiver: tUser2._id,
        content: "مرحباً سيدة صالحي. خبر رائع ! لقد اجتهد كثيراً في تحضير شرائحه. شكراً على تشجيعكم.",
        createdAt: new Date(Date.now() - 3600000 * 14)
      },

      // 7. Teacher Abdelhamid (Arabic) <-> Parent Fatiha Amrani (parents[3])
      {
        sender: tUser3._id,
        receiver: parents[3].user,
        content: "مرحباً سيدة عمراني، كان رياض شارد الذهن قليلاً اليوم أثناء القراءة باللغة العربية. هل كل شيء على ما يرام ؟",
        createdAt: new Date(Date.now() - 3600000 * 18)
      },
      {
        sender: parents[3].user,
        receiver: tUser3._id,
        content: "مرحباً سيد حداد. لم ينم جيداً البارحة. سأتحدث معه وأحرص على أن يكون أكثر انتباهاً غداً.",
        createdAt: new Date(Date.now() - 3600000 * 17)
      },

      // 8. Teacher Abdelhamid (Arabic) <-> Parent Mourad Slimani (parents[4])
      {
        sender: tUser3._id,
        receiver: parents[4].user,
        content: "مرحباً سيد سليماني، تعابير كنزة باللغة العربية مميزة. تمتلك أسلوباً رائعاً في الكتابة.",
        createdAt: new Date(Date.now() - 3600000 * 20)
      },
      {
        sender: parents[4].user,
        receiver: tUser3._id,
        content: "مرحباً سيد حداد، شكراً جزيلاً ! تقرأ الكثير من الكتب في البيت مما يساعدها كثيراً. سأبلغها تهانيكم.",
        createdAt: new Date(Date.now() - 3600000 * 19)
      },

      // 9. Admin <-> Parent Sofiane Meziane (parents[0])
      {
        sender: admin._id,
        receiver: parents[0].user,
        content: "مرحباً سيد مزيان، لقد استلمنا دفعتكم الخاصة بمصاريف الفصل الثالث لليلى ويانيس. شكراً.",
        createdAt: new Date(Date.now() - 3600000 * 16)
      },
      {
        sender: parents[0].user,
        receiver: admin._id,
        content: "مرحباً سيد زيتوني، ممتاز. هل سيكون وصل الدفع متاحاً في فضاء ولي الأمر الخاص بي ؟",
        createdAt: new Date(Date.now() - 3600000 * 15)
      },
      {
        sender: admin._id,
        receiver: parents[0].user,
        content: "نعم بالتأكيد. يمكنكم تحميله بصيغة PDF من خانة الفواتير.",
        createdAt: new Date(Date.now() - 3600000 * 14)
      },

      // 10. School Staff <-> Parent Sarah Belaid (parents[1])
      {
        sender: school._id,
        receiver: parents[1].user,
        content: "مرحباً سيدة بلعيد، تنقص البطاقة الطبية وترخيص الخروج الموقّع لمريم من أجل الخرجة إلى حديقة التجارب.",
        createdAt: new Date(Date.now() - 3600000 * 5)
      },
      {
        sender: parents[1].user,
        receiver: school._id,
        content: "مرحباً أمال، أعتذر. سأملؤها هذا المساء وأعطيها لمريم لتسلّمها لكم صباح الغد دون تأخير.",
        createdAt: new Date(Date.now() - 3600000 * 4)
      },

      // 11. Teacher Kamel (Math) <-> Student Yanis Meziane (students[0])
      {
        sender: students[0].user,
        receiver: tUser1._id,
        content: "مرحباً أستاذ، لدي سؤال حول التمرين 4 في الصفحة 45. لا أفهم كيف أبدأ البرهان.",
        createdAt: new Date(Date.now() - 3600000 * 2)
      },
      {
        sender: tUser1._id,
        receiver: students[0].user,
        content: "مرحباً يانيس. عليك أولاً إثبات أن المثلث ABC قائم باستعمال مبرهنة فيثاغورس، ثم تطبيق العلاقة المثلثية.",
        createdAt: new Date(Date.now() - 3600000 * 1.5)
      },
      {
        sender: students[0].user,
        receiver: tUser1._id,
        content: "آه فهمت الآن ! سأجرب بهذه الطريقة. شكراً جزيلاً !",
        createdAt: new Date(Date.now() - 3600000 * 1)
      },

      // 12. Teacher Nadia (Science) <-> Student Amin Belaid (students[3])
      {
        sender: tUser2._id,
        receiver: students[3].user,
        content: "مرحباً أمين، هل أنهيت تقرير الأعمال التطبيقية في الجيولوجيا للأسبوع الماضي ؟",
        createdAt: new Date(Date.now() - 3600000 * 3)
      },
      {
        sender: students[3].user,
        receiver: tUser2._id,
        content: "مرحباً سيدتي، نعم كاد ينتهي. أنا بصدد رسم مخططات المقاطع الصخرية. سأسلمه لكم صباح الغد.",
        createdAt: new Date(Date.now() - 3600000 * 2)
      }
    ];

    await Message.insertMany(chats);
    console.log('Chat messages seeded successfully.');

    // 10. Seed Schedules
    const timetableData = {
      "Lundi": ["08:00 - رياضيات", "10:00 - فيزياء", "14:00 - علوم طبيعية"],
      "Mardi": ["08:00 - فلسفة", "10:00 - لغة انجليزية", "14:00 - رياضيات"],
      "Mercredi": ["08:00 - فيزياء", "10:00 - لغة عربية"],
      "Jeudi": ["08:00 - علوم طبيعية", "10:00 - تاريخ وجغرافيا", "14:00 - لغة فرنسية"],
      "Vendredi": []
    };
    await Schedule.create({
      type: 'Timetable',
      title: 'جدول التوقيت - قسم العلوم (الفوج أ)',
      class: c3._id,
      group: g4._id,
      data: timetableData,
      isActive: true
    });

    const primaryTimetableData = {
      "Lundi": ["08:30 - لغة فرنسية", "10:30 - رياضيات", "13:30 - لغة عربية"],
      "Mardi": ["08:30 - لغة عربية", "10:30 - علوم طبيعية", "13:30 - رسم"],
      "Mercredi": ["08:30 - رياضيات", "10:30 - لغة فرنسية"],
      "Jeudi": ["08:30 - تربية اسلامية", "10:30 - لغة عربية", "13:30 - تربية بدنية"],
      "Vendredi": []
    };
    await Schedule.create({
      type: 'Timetable',
      title: 'جدول التوقيت - السنة الأولى ابتدائي (الفوج أ)',
      class: c1._id,
      group: g1._id,
      data: primaryTimetableData,
      isActive: true
    });

    const foodData = {
      "Lundi": "عدس تقليدي، شريحة دجاج مشوية، سلطة خضراء، برتقال",
      "Mardi": "كسكس جزائري بالخضر والدجاج، تمر، لبن",
      "Mercredi": "بوري بطاطا منزلي، لحم بقر مفروم، لبن رائب",
      "Jeudi": "أرز بالزعفران والبازيلاء، سمك بصلصة الحامض، تفاحة",
      "Vendredi": "غير مضمون"
    };
    await Schedule.create({
      type: 'Food',
      title: 'قائمة الأسبوع - المطعم المدرسي',
      data: foodData,
      isActive: true
    });

    const transportData = {
      "Ligne": "الخط 3 - أولاد فايت المركز / حي 1200 مسكن",
      "Chauffeur": "عمي أحمد (0555-12-34-56)",
      "Arrêts": [
        "07:15 - حي 1200 مسكن (الانطلاق)",
        "07:30 - حي 800 مسكن (المدخل)",
        "07:45 - أولاد فايت المركز (البريد)",
        "08:00 - مدرسة الزيتوني (الوصول)"
      ]
    };
    await Schedule.create({
      type: 'Transport',
      title: 'الخط 3 - النقل المدرسي',
      data: transportData,
      isActive: true
    });

    const examData = [
      { "Matière": "رياضيات", "Date": "2026-06-15", "Heure": "08:30 - 11:30", "Salle": "قاعة المحاضرات أ" },
      { "Matière": "فيزياء", "Date": "2026-06-16", "Heure": "09:00 - 12:00", "Salle": "قاعة الامتحان 4" },
      { "Matière": "علوم طبيعية", "Date": "2026-06-17", "Heure": "08:30 - 10:30", "Salle": "قاعة الامتحان 4" }
    ];
    await Schedule.create({
      type: 'Exam',
      title: 'امتحانات تجريبية - دورة جوان 2026',
      class: c3._id,
      data: examData,
      isActive: true
    });

    const primaryExamData = [
      { "Matière": "لغة فرنسية", "Date": "2026-06-22", "Heure": "09:00 - 10:30", "Salle": "القسم 1" },
      { "Matière": "رياضيات", "Date": "2026-06-23", "Heure": "09:00 - 10:30", "Salle": "القسم 1" },
      { "Matière": "لغة عربية", "Date": "2026-06-24", "Heure": "09:00 - 10:30", "Salle": "القسم 1" }
    ];
    await Schedule.create({
      type: 'Exam',
      title: 'الامتحانات النهائية - السنة الأولى ابتدائي',
      class: c1._id,
      data: primaryExamData,
      isActive: true
    });
    console.log('Schedules seeded successfully.');

    const coursesToSeed = [
      {
        title: "مدخل إلى المشتقات والنهايات",
        description: "سند درس كامل حول حساب النهايات ودراسة الدوال المشتقة لقسم العلوم.",
        subject: "رياضيات",
        fileUrl: "https://res.cloudinary.com/demo/image/upload/v1570975139/sample.pdf",
        fileName: "limites_et_derivees.pdf",
        class: c3._id,
        group: g4._id,
        teacher: tProf1._id
      },
      {
        title: "الحساب الأساسي: الأرقام من 1 إلى 100",
        description: "بطاقة تعلم مصورة لإتقان كتابة وحساب الأرقام من 1 إلى 100.",
        subject: "رياضيات",
        fileUrl: "https://res.cloudinary.com/demo/image/upload/v1570975139/sample.pdf",
        fileName: "chiffres_1_100.pdf",
        class: c1._id,
        group: g1._id,
        teacher: tProf1._id
      },
      {
        title: "مدخل: تعلم الحروف العربية",
        description: "كراس تمارين الكتابة والنطق للمبتدئين في اللغة العربية.",
        subject: "لغة عربية",
        fileUrl: "https://res.cloudinary.com/demo/image/upload/v1570975139/sample.pdf",
        fileName: "alphabet_arabe_debutant.pdf",
        class: c1._id,
        group: g1._id,
        teacher: tProf3._id
      },
      {
        title: "أعمال تطبيقية في الجيولوجيا: التعرية والترسب",
        description: "وثيقة أعمال تطبيقية تحتوي على تعليمات رسم مقاطع التربة.",
        subject: "علوم طبيعية",
        fileUrl: "https://res.cloudinary.com/demo/image/upload/v1570975139/sample.pdf",
        fileName: "tp_geologie_erosion.pdf",
        class: c1._id,
        group: g2._id,
        teacher: tProf2._id
      },
      {
        title: "قواعد: التحليل النحوي للجملة",
        description: "بطاقة تمارين دعم حول التحليل النحوي في اللغة العربية.",
        subject: "لغة عربية",
        fileUrl: "https://res.cloudinary.com/demo/image/upload/v1570975139/sample.pdf",
        fileName: "grammaire_arabe_bac.pdf",
        class: c3._id,
        group: g5._id,
        teacher: tProf3._id
      }
    ];
    await Course.insertMany(coursesToSeed);
    console.log('Courses seeded successfully.');

    // 12. Seed Attendance
    const attendanceEntries = [];
    const dates = [
      new Date(),
      new Date(Date.now() - 3600000 * 24),
      new Date(Date.now() - 3600000 * 24 * 2)
    ];

    const statuses = ['Present', 'Present', 'Present', 'Present', 'Present', 'Late', 'Absent', 'Excused'];

    for (const stud of students) {
      for (const date of dates) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        attendanceEntries.push({
          student: stud._id,
          class: stud.class,
          group: stud.group,
          date: date,
          status: status,
          remarks: status === 'Late' ? 'وصل متأخراً بـ 10 دقائق' : status === 'Absent' ? 'غياب غير مبرر' : '',
          recordedBy: admin._id
        });
      }
    }
    await Attendance.insertMany(attendanceEntries);
    console.log('Attendance records seeded successfully based on student profiles.');

    // 13. Seed Initial Notifications
    console.log('Seeding initial notifications...');
    const initialNotifications = [
      // 1. Yanis Meziane (Student)
      {
        recipient: students[0].user, 
        title: "درس جديد متاح",
        content: "تم نشر درس جديد في اللغة العربية من طرف عبد الحميد حداد.",
        type: "course",
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 2)
      },
      {
        recipient: students[0].user, 
        title: "رسالة جديدة",
        content: "أرسل لك الأستاذ دحماني (رياضيات) رسالة.",
        type: "message",
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 1.5)
      },
      // 2. ولي الأمر
      {
        recipient: parents[0].user, 
        title: "تحديث جدول التوقيت",
        content: "تم تحديث جدول توقيت ابنكم يانيس مزيان من طرف الإدارة.",
        type: "schedule",
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 3)
      },
      {
        recipient: parents[0].user, 
        title: "إعلان عام جديد",
        content: "نشرت المدرسة إعلاناً: حفل نهاية السنة الدراسية بأولاد فايت !",
        type: "post",
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 4)
      },
      // 3. إدارة المدرسة
      {
        recipient: school._id,
        title: "رسالة جديدة واردة",
        content: "أرسلت لكم السيدة بلعيد (ولية مريم) رسالة بخصوص حديقة التجارب.",
        type: "message",
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 1)
      },
      {
        recipient: school._id,
        title: "درس جديد منشور",
        content: "نشر كمال دحماني وثيقة limites_et_derivees.pdf لقسم العلوم.",
        type: "course",
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 6)
      },
      // 4. الأستاذ كمال دحماني
      {
        recipient: tUser1._id,
        title: "رسالة من تلميذ",
        content: "أرسل لك يانيس مزيان سؤالاً حول التمرين 4 في الصفحة 45.",
        type: "message",
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 0.5)
      },
      {
        recipient: tUser1._id,
        title: "إعلان إداري",
        content: "تم نشر إعلان داخلي جديد: التحضير لمجالس الأقسام.",
        type: "post",
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 8)
      },
      // 5. ولية الأمر سارة بلعيد
      {
        recipient: parents[1].user,
        title: "صعوبات مبلّغ عنها",
        content: "أرسل لكم الأستاذ دحماني رسالة بخصوص صعوبات يواجهها أمين في التكامل.",
        type: "message",
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 5)
      },
      {
        recipient: parents[1].user,
        title: "وثيقة درس منشورة",
        content: "تم نشر سند درس جديد في العلوم الطبيعية لأمين بلعيد.",
        type: "course",
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 7)
      }
    ];
    await Notification.insertMany(initialNotifications);
    console.log('Initial notifications seeded successfully.');

    console.log('Advanced Seeding completed successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
