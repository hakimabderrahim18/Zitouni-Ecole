import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, 
  MessageSquare, 
  BookOpen, 
  CreditCard, 
  ChevronDown, 
  Users, 
  ArrowLeft, 
  CheckCircle, 
  Award, 
  Compass, 
  Phone, 
  Mail, 
  MapPin, 
  Quote, 
  Calendar,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import ThreeDScene from '../components/ThreeDScene';
import ThemeToggle from '../components/ThemeToggle';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const valuesList = [
    {
      icon: Award,
      title: "التميز الأكاديمي",
      desc: "نسعى لتقديم مناهج تعليمية حديثة تواكب التطور وترسخ الفهم العميق لدى تلاميذنا.",
      color: "from-brand-400 to-brand-500"
    },
    {
      icon: Compass,
      title: "التوجيه التربوي",
      desc: "مرافقة نفسية وتربوية دائمة للتلاميذ لبناء شخصية متوازنة قادرة على الإبداع والنجاح.",
      color: "from-brand-300 to-brand-500"
    },
    {
      icon: Shield,
      title: "الرعاية والبيئة الآمنة",
      desc: "نهيئ محيطاً دراسياً محفزاً، آمناً وصحياً يضمن راحة أبنائكم البدنية والفكرية.",
      color: "from-brand-500 to-brand-600"
    },
    {
      icon: GraduationCap,
      title: "التعليم التفاعلي",
      desc: "دمج تقنيات الرقمنة والذكاء الاصطناعي لجعل الحصة الدراسية تجربة حية وممتعة.",
      color: "from-brand-400 to-brand-600"
    }
  ];

  const featuresList = [
    {
      icon: MessageSquare,
      title: "المحادثة الفورية المباشرة",
      desc: "تواصل مباشر وآمن بين الأولياء، الأساتذة، وإدارة المدرسة لطرح الاستفسارات وتبادل الملاحظات اليومية.",
      bg: "bg-brand-50 border-brand-200/60"
    },
    {
      icon: BookOpen,
      title: "متابعة الواجبات والدروس",
      desc: "إمكانية تصفح المقررات الدراسية، تحميل الملفات التعليمية والاطلاع على الواجبات المنزلية بكل سهولة.",
      bg: "bg-brand-50 border-brand-200/60"
    },
    {
      icon: CreditCard,
      title: "المدفوعات الإلكترونية الآمنة",
      desc: "تسديد مستحقات التمدرس، النقل المدرسي والإطعام بنقرة واحدة ودون الحاجة للتنقل إلى الإدارة.",
      bg: "bg-brand-50 border-brand-200/60"
    },
    {
      icon: Calendar,
      title: "جدول الحصص الذكي",
      desc: "تحديثات لحظية ومستمرة لجدول التوقيت اليومي والأسبوعي وتنبيهات فورية عند أي تغيير مفاجئ.",
      bg: "bg-brand-50 border-brand-200/60"
    },
    {
      icon: Users,
      title: "فضاء الأولياء المتكامل",
      desc: "حساب موحد لولي الأمر يتيح له الإشراف ومتابعة مسار جميع أبنائه المتمدرسين في المدرسة في آن واحد.",
      bg: "bg-brand-50 border-brand-200/60"
    },
    {
      icon: CheckCircle,
      title: "الغيابات والتقييم اللحظي",
      desc: "إشعار فوري للأولياء في حال غياب أو تأخر التلميذ، مع إتاحة دفتر علامات رقمي متكامل لمتابعة النتائج.",
      bg: "bg-brand-50 border-brand-200/60"
    }
  ];

  const levelsList = [
    {
      name: "الطور الابتدائي",
      age: "من 6 إلى 11 سنة",
      desc: "التركيز على تنمية المهارات الأساسية في اللغات والرياضيات، وغرس القيم الأخلاقية عبر مناهج تفاعلية مميزة.",
      badge: "الابتدائي"
    },
    {
      name: "الطور المتوسط",
      age: "من 12 إلى 15 سنة",
      desc: "توسيع المعارف العلمية والأدبية، وتعزيز روح البحث والتفكير النقدي لتوجيه التلميذ نحو تخصصات مناسبة.",
      badge: "المتوسط"
    },
    {
      name: "الطور الثانوي",
      age: "من 16 إلى 18 سنة",
      desc: "مرافقة أكاديمية صارمة وتأطير نوعي لتحضير التلاميذ لاجتياز شهادة البكالوريا بتفوق والالتحاق بأرقى الجامعات.",
      badge: "الثانوي"
    }
  ];

  const testimonialList = [
    {
      quote: "المنصة سهلت عليّ متابعة دروس أبنائي وصار تواصلي مع الأساتذة يومياً وفورياً بفضل المحادثات المباشرة.",
      name: "السيد سفيان مزيان",
      role: "ولي أمر التلميذ يانيس",
      avatar: "SM"
    },
    {
      quote: "فضاء الأساتذة ذكي ومنظم جداً، يمكنني من تسجيل الغيابات ورفع الواجبات وتلقي أسئلة التلاميذ في ثوانٍ معدودة.",
      name: "الأستاذ كمال دحماني",
      role: "أستاذ مادة الرياضيات",
      avatar: "KD"
    },
    {
      quote: "نقلة نوعية في التسيير المدرسي بأولاد فايت، الفوترة الرقمية والشفافية تمنحنا ثقة كاملة كأولياء أمور.",
      name: "السيدة فريدة بلقاسم",
      role: "ولي أمر التلميذة مريم",
      avatar: "FB"
    }
  ];

  const faqList = [
    {
      q: "كيف يمكنني الحصول على حساب لولوج المنصة؟",
      a: "تتولى إدارة المدرسة إنشاء وتفعيل حسابات المستخدمين (الأولياء، التلاميذ، والأساتذة) وتزويدهم ببيانات الدخول الشخصية فور استكمال عملية التسجيل الإداري."
    },
    {
      q: "هل تعمل منصة المحادثات الفورية في عطلة نهاية الأسبوع؟",
      a: "نعم، المنصة والمحادثات متوفرة على مدار الساعة طيلة أيام الأسبوع لتمكين الأولياء من ترك رسائلهم وتلقي الإجابات فور التحاق الطاقم المعني."
    },
    {
      q: "هل يمكنني دفع الأقساط الشهرية عن طريق المنصة؟",
      a: "نعم، تدعم المنصة الدفع الإلكتروني الآمن لجميع الرسوم المدرسية كأقساط التمدرس، النقل المدرسي، وخدمات الإطعام مع إصدار فوري لوصل الدفع."
    },
    {
      q: "هل يمكنني متابعة أكثر من طفل بحساب واحد؟",
      a: "بالتأكيد، تم تصميم فضاء الأولياء ليربط الوالد بجميع أبنائه المسجلين بالمؤسسة، حيث يمكن التنقل بين ملفات الأبناء بضغطة زر واحدة."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden mesh-gradient font-cairo">
      {/* Dynamic Background Glow Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.15, 1],
          x: [0, 30, 0],
          y: [0, -20, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="glow-orb w-[500px] h-[500px] bg-brand-200/50 top-[-10%] start-[-10%]" 
      />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -25, 0],
          y: [0, 25, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="glow-orb w-[420px] h-[420px] bg-brand-400/30 top-[20%] end-[-8%]"
      />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-luxury-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-2xl font-extrabold bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-brand-400/20">ز</span>
            <span>مدرسة الزيتوني</span>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-500 font-extrabold text-xs tracking-wider">السنة الدراسية 2025/2026</span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold">
            <a href="#vision" className="text-slate-400 hover:text-brand-500 transition-colors">رؤيتنا</a>
            <a href="#features" className="text-slate-400 hover:text-brand-500 transition-colors">ميزاتنا</a>
            <a href="#levels" className="text-slate-400 hover:text-brand-500 transition-colors">الأطوار</a>
            <a href="#stats" className="text-slate-400 hover:text-brand-500 transition-colors">الإحصائيات</a>
            <a href="#testimonials" className="text-slate-400 hover:text-brand-500 transition-colors">آراء الأولياء</a>
            <a href="#contact" className="text-slate-400 hover:text-brand-500 transition-colors">اتصل بنا</a>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <ThemeToggle />
            <Link
              to="/login"
              className="px-6 py-2.5 rounded-full bg-brand-500 hover:bg-brand-400 font-bold text-white transition-all hover:shadow-[0_4px_15px_rgba(197,106,61,0.3)] text-xs md:text-sm"
            >
              فضاء المستخدمين
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Split screen with premium 3D illustration */}
      <section id="hero" className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10">

        {/* Left Side: Marketing Context */}
        <div className="w-full lg:w-1/2 text-right space-y-6 z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-300 text-xs font-bold backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
            </span>
            <span>منارة العلم والتميز بأولاد فايت</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.2] text-slate-100 font-display"
          >
            الريادة التعليمية بأسلوب <br />
            <span className="bg-gradient-to-l from-brand-300 via-brand-400 to-brand-500 bg-clip-text text-transparent">رقمي وتفاعلي مبتكر</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base md:text-lg text-slate-400 leading-relaxed font-medium max-w-xl"
          >
            منصة إلكترونية متكاملة تهدف إلى تعزيز العلاقة بين الإدارة، المعلمين، الأولياء والتلاميذ في مدرسة الزيتوني. تتبع لحظي للمستوى الأكاديمي، جدول التوقيت، الدفع الإلكتروني، والغيابات بكل شفافية وأمان.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 pt-2"
          >
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-full bg-gradient-to-l from-brand-500 to-brand-400 hover:from-brand-400 hover:to-brand-300 font-bold text-white flex items-center justify-center gap-2 group transition-all hover:shadow-[0_8px_30px_rgba(197,106,61,0.35)] text-sm"
            >
              <span>دخول فضاء المنصة</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </button>
            <a
              href="#features"
              className="px-8 py-4 rounded-full glass-panel border border-luxury-border font-bold text-slate-200 hover:border-brand-500/40 hover:text-brand-300 transition-all flex items-center justify-center text-sm"
            >
              اكتشف خدماتنا
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4"
          >
            <div className="flex items-center gap-2 text-slate-450">
              <CheckCircle className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-bold">+1200 تلميذ نشط</span>
            </div>
            <div className="flex items-center gap-2 text-slate-450">
              <Shield className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-bold">بيانات محمية ومشفّرة</span>
            </div>
            <div className="flex items-center gap-2 text-slate-450">
              <Award className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-bold">99.2% نجاح</span>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Interactive 3D Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
          className="w-full lg:w-1/2 h-[420px] md:h-[560px] relative z-0"
        >
          {/* Layered ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] bg-brand-500/15 filter blur-[110px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-[180px] h-[180px] bg-brand-300/10 filter blur-[80px] rounded-full pointer-events-none" />

          {/* Decorative rotating dashed ring framing the scene */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full border border-dashed border-brand-500/20 pointer-events-none"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] md:w-[300px] md:h-[300px] rounded-full border border-brand-400/10 pointer-events-none"
          />

          <ThreeDScene type="landing" />

          {/* Floating glass info badges - academic dark glass */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="absolute top-6 start-0 hidden sm:flex items-center gap-2.5 px-4 py-3 rounded-2xl glass-panel border border-brand-500/20 shadow-xl shadow-brand-950/30"
          >
            <span className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </span>
            <div className="text-right leading-tight">
              <p className="text-slate-100 font-bold text-xs">حضور لحظي</p>
              <p className="text-slate-450 text-[10px] font-semibold">إشعار فوري للأولياء</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="absolute bottom-8 end-0 hidden sm:flex items-center gap-2.5 px-4 py-3 rounded-2xl glass-panel border border-brand-500/20 shadow-xl shadow-brand-950/30"
          >
            <span className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </span>
            <div className="text-right leading-tight">
              <p className="text-slate-100 font-bold text-xs">دفع آمن</p>
              <p className="text-slate-450 text-[10px] font-semibold">مدفوعات مشفّرة 100%</p>
            </div>
          </motion.div>

          {/* Floating academic metric chip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1 }}
            className="absolute top-1/2 -translate-y-1/2 end-2 hidden md:flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl glass-panel border border-brand-500/20 shadow-xl shadow-brand-950/30"
          >
            <GraduationCap className="w-5 h-5 text-brand-300" />
            <p className="text-brand-300 font-extrabold text-sm leading-none">3</p>
            <p className="text-slate-450 text-[9px] font-semibold">أطوار تعليمية</p>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.a
          href="#vision"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-1.5 text-slate-500 hover:text-brand-300 transition-colors"
        >
          <span className="text-[10px] font-bold tracking-wide">استكشف المزيد</span>
          <motion.span
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.span>
        </motion.a>
      </section>

      {/* Vision & Values Section */}
      <section id="vision" className="py-24 px-6 max-w-7xl mx-auto border-t border-luxury-border/30 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">القيم والرؤية التربوية</h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            نؤمن في مدرسة الزيتوني الخاصة بأن التعليم ليس مجرد تلقين، بل هو بناء متكامل يعتمد على الابتكار، التوجيه السليم والرعاية المستمرة للتلميذ.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {valuesList.map((val, idx) => {
            const Icon = val.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className="p-6 rounded-2xl glass-panel border border-luxury-border hover:border-brand-500/30 hover:shadow-[0_10px_35px_rgba(197,106,61,0.06)] transition-all flex flex-col gap-4 text-right bg-white/60"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${val.color} text-white flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">{val.title}</h3>
                <p className="text-slate-450 text-xs leading-relaxed font-medium">{val.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-luxury-border/30">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">ميزات المنصة الذكية</h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            مجموعة متكاملة من الخدمات الرقمية المصممة بعناية لتوفير الوقت والجهد وتجعل تجربة التمدرس أكثر فاعلية ووضوحاً.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresList.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -6, borderColor: "rgba(197, 106, 61, 0.4)", boxShadow: "0 10px 30px rgba(197,106,61,0.05)" }}
                className={`p-8 rounded-2xl glass-panel border hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all flex flex-col gap-5 text-right bg-white/60`}
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200/30 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-brand-600" />
                </div>
                <div className="space-y-2.5">
                  <h3 className="text-lg font-extrabold text-slate-100">{feat.title}</h3>
                  <p className="text-slate-450 leading-relaxed text-xs font-semibold">{feat.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Educational Levels Section */}
      <section id="levels" className="py-24 px-6 max-w-7xl mx-auto border-t border-luxury-border/30">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">أطوار التعليم لدينا</h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            نغطي كافة المراحل التعليمية من الطفولة المبكرة وحتى التحضير الجامعي ببرامج معتمدة ومؤطرين ذوي خبرة واسعة.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {levelsList.map((lvl, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              whileHover={{ y: -8 }}
              className="p-8 rounded-2xl glass-panel border border-luxury-border hover:border-brand-500/20 flex flex-col justify-between text-right relative overflow-hidden group bg-white/40"
            >
              <div className="absolute top-0 end-0 bg-brand-500 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-bl-xl shadow-sm">
                {lvl.badge}
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-100 pt-2">{lvl.name}</h3>
                <span className="block text-brand-600 text-xs font-bold font-mono bg-brand-50 w-fit px-2.5 py-1 rounded-lg border border-brand-200/20">{lvl.age}</span>
                <p className="text-slate-455 leading-relaxed text-xs pt-2 font-medium">{lvl.desc}</p>
              </div>
              
              <div className="mt-8 border-t border-luxury-border/20 pt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">مدرسة الزيتوني الخاصة</span>
                <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs group-hover:bg-brand-500 group-hover:text-white transition-colors">←</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-slate-900/40 border-y border-luxury-border px-6 text-slate-100 bg-white/40">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-4xl md:text-5xl font-extrabold text-brand-600 block mb-2 font-mono">1,200+</span>
            <span className="text-slate-400 text-xs md:text-sm font-bold">تلميذ مسجل بالمنصة</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="text-4xl md:text-5xl font-extrabold text-brand-600 block mb-2 font-mono">80+</span>
            <span className="text-slate-400 text-xs md:text-sm font-bold">أستاذ وإداري مؤهل</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="text-4xl md:text-5xl font-extrabold text-brand-600 block mb-2 font-mono">99.2%</span>
            <span className="text-slate-400 text-xs md:text-sm font-bold">نسبة النجاح الباهر</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <span className="text-4xl md:text-5xl font-extrabold text-brand-600 block mb-2 font-mono">15+</span>
            <span className="text-slate-400 text-xs md:text-sm font-bold">سنة من التميز التربوي</span>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6 max-w-7xl mx-auto border-t border-luxury-border/30">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">آراء أولياء الأمور</h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            نسعد ونعتز دائماً بشهادات أولياء الأمور والأساتذة حول مدى مساهمة المنصة في تحسين التجربة التعليمية في المؤسسة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonialList.map((test, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ scale: 1.01 }}
              className="p-8 rounded-2xl glass-panel border border-luxury-border flex flex-col justify-between text-right relative overflow-hidden bg-white/40"
            >
              <Quote className="w-8 h-8 text-brand-200/50 absolute top-4 end-4 rtl-flip" />
              <p className="text-slate-455 leading-relaxed text-xs italic relative z-10 font-medium pt-2">
                " {test.quote} "
              </p>
              
              <div className="mt-8 border-t border-luxury-border/10 pt-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-50 border border-brand-200/30 flex items-center justify-center font-bold text-brand-650 text-xs shadow-sm">
                  {test.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-xs">{test.name}</h4>
                  <span className="block text-[9px] text-slate-500">{test.role}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-24 px-6 max-w-4xl mx-auto border-t border-luxury-border/30">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">الأسئلة الشائعة</h2>

        <div className="space-y-4">
          {faqList.map((faq, idx) => (
            <div key={idx} className="rounded-xl glass-panel border border-luxury-border overflow-hidden bg-white/40">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-6 text-right flex justify-between items-center hover:bg-slate-900/5 transition-all"
              >
                <span className="font-bold text-base md:text-lg text-slate-100">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-6 border-t border-luxury-border/50 text-slate-455 text-xs md:text-sm leading-relaxed font-semibold">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 max-w-7xl mx-auto border-t border-luxury-border/30">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">اتصل بنا</h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            يسعدنا تواصلكم معنا للاستفسار أو زيارة مقر المؤسسة بأولاد فايت.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
          <motion.div 
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl glass-panel border border-luxury-border flex items-start gap-4 text-slate-100 bg-white/40"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200/30 flex items-center justify-center text-brand-600 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-100">مقر المؤسسة</h4>
              <p className="text-slate-455 text-xs font-semibold leading-relaxed">حي 11 ديسمبر، أولاد فايت، الجزائر العاصمة، الجزائر</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl glass-panel border border-luxury-border flex items-start gap-4 text-slate-100 bg-white/40"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200/30 flex items-center justify-center text-brand-600 shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-100">الهاتف والفاكس</h4>
              <p className="text-slate-455 text-xs font-semibold leading-relaxed font-mono">021 55 44 33</p>
              <p className="text-slate-455 text-xs font-semibold leading-relaxed font-mono">0550 11 22 33</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl glass-panel border border-luxury-border flex items-start gap-4 text-slate-100 bg-white/40"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200/30 flex items-center justify-center text-brand-600 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-100">البريد الإلكتروني</h4>
              <p className="text-slate-455 text-xs font-semibold leading-relaxed select-all">contact@ecole-zitouni.dz</p>
              <p className="text-slate-455 text-xs font-semibold leading-relaxed select-all">support@ecole-zitouni.dz</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-luxury-border py-12 px-6 text-center text-slate-500 text-xs bg-white/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span>© 2026 مدرسة الزيتوني الخاصة. جميع الحقوق محفوظة.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-350">الشروط والأحكام</a>
            <a href="#" className="hover:text-slate-350">سياسة الخصوصية</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
