import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useSchoolStore } from '../store/useSchoolStore';
import SchoolLogo from '../components/SchoolLogo';
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
import SchoolImageCarousel from '../components/SchoolImageCarousel';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const { settings, fetchSettings } = useSchoolStore();

  useEffect(() => {
    fetchSettings();
  }, []);

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
    <div className="theme-prestige min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden mesh-gradient font-sans relative w-full max-w-full">
      {/* Dynamic Background Glow Orbs — strictly clipped within viewport */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            x: [0, 20, 0],
            y: [0, -15, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="glow-orb w-72 sm:w-[500px] h-72 sm:h-[500px] bg-brand-200/50 top-[-5%] start-[-5%]" 
        />

        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -20, 0],
            y: [0, 20, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="glow-orb w-64 sm:w-[420px] h-64 sm:h-[420px] bg-brand-400/30 top-[20%] end-[-5%]"
        />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-luxury-border w-full max-w-full">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-lg sm:text-2xl font-extrabold flex items-center gap-2 sm:gap-2.5 group min-w-0">
            <SchoolLogo size={32} className="shrink-0" />
            <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent font-black truncate">
              {settings?.schoolNameArabic || 'مدرسة حبر'}
            </span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-500 font-extrabold text-xs tracking-wider shrink-0">
              {settings?.academicYear ? `السنة الدراسية ${settings.academicYear}` : 'السنة الدراسية 2026/2027'}
            </span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold">
            <a href="#vision" className="text-slate-400 hover:text-brand-500 transition-colors">رؤيتنا</a>
            <a href="#features" className="text-slate-400 hover:text-brand-500 transition-colors">ميزاتنا</a>
            <a href="#levels" className="text-slate-400 hover:text-brand-500 transition-colors">الأطوار</a>
            <a href="#stats" className="text-slate-400 hover:text-brand-500 transition-colors">الإحصائيات</a>
            <a href="#testimonials" className="text-slate-400 hover:text-brand-500 transition-colors">آراء الأولياء</a>
            <a href="#contact" className="text-slate-400 hover:text-brand-500 transition-colors">اتصل بنا</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              to="/login"
              className="px-3.5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-brand-500 hover:bg-brand-400 font-bold text-white transition-all hover:shadow-[0_4px_15px_rgba(123,30,58,0.25)] text-xs sm:text-sm whitespace-nowrap"
            >
              فضاء المستخدمين
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Split screen with premium 3D illustration */}
      <section id="hero" className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 md:pt-40 md:pb-28 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 overflow-hidden">

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
            منصة إلكترونية متكاملة تهدف إلى تعزيز التواصل الإداري والتربوي بين الإدارة، المعلمين، الأولياء والتلاميذ في مدرسة حبر (مؤسسة حبر وألوان الخاصة). تتبع لحظي للمستوى الأكاديمي، كراس الدروس والواجبات، جدول التوقيت، والمتابعة اليومية للغيابات والأنشطة بكل أمان.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 pt-2"
          >
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-full bg-gradient-to-l from-brand-500 to-brand-400 hover:from-brand-400 hover:to-brand-300 font-bold text-white flex items-center justify-center gap-2 group transition-all hover:shadow-[0_8px_30px_rgba(123,30,58,0.30)] text-sm"
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

        {/* Right Side: School Facility Image Carousel (Customizable) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="w-full lg:w-1/2 relative z-10"
        >
          <SchoolImageCarousel height="h-[380px] sm:h-[460px] lg:h-[500px]" />
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
      <section id="vision" className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-luxury-border/30 relative overflow-hidden">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6">القيم والرؤية التربوية</h2>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed">
            نؤمن في مؤسسة التربية والتعليم حبر وألوان الخاصة (مدرسة حبر) بأن التعليم ليس مجرد تلقين، بل هو بناء متكامل يعتمد على الابتكار، التوجيه السليم وشعارنا الدائم « يا نشء أنت رجاؤنا ».
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {valuesList.map((val, idx) => {
            const Icon = val.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className="p-5 sm:p-6 rounded-2xl glass-panel border border-luxury-border hover:border-brand-500/30 hover:shadow-[0_10px_35px_rgba(201,162,77,0.12)] transition-all flex flex-col gap-4 text-right bg-white/60"
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
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-luxury-border/30 overflow-hidden">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6">ميزات المنصة الذكية</h2>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed">
            مجموعة متكاملة من الخدمات الرقمية المصممة بعناية لتوفير الوقت والجهد وتجعل تجربة التمدرس أكثر فاعلية ووضوحاً.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuresList.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -6, borderColor: "rgba(201, 162, 77, 0.45)", boxShadow: "0 10px 30px rgba(123,30,58,0.06)" }}
                className={`p-6 sm:p-8 rounded-2xl glass-panel border hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all flex flex-col gap-5 text-right bg-white/60`}
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
      <section id="levels" className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-luxury-border/30 overflow-hidden">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6">أطوار التعليم لدينا</h2>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed">
            نغطي كافة المراحل التعليمية من الطفولة المبكرة وحتى التحضير الجامعي ببرامج معتمدة ومؤطرين ذوي خبرة واسعة.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {levelsList.map((lvl, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              whileHover={{ y: -8 }}
              className="p-6 sm:p-8 rounded-2xl glass-panel border border-luxury-border hover:border-brand-500/20 flex flex-col justify-between text-right relative overflow-hidden group bg-white/40"
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
                <span className="text-[10px] text-slate-500">{settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة'}</span>
                <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs group-hover:bg-brand-500 group-hover:text-white transition-colors">←</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-14 sm:py-20 bg-slate-900/40 border-y border-luxury-border px-4 sm:px-6 text-slate-100 bg-white/40 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-600 block mb-2 font-mono">1,200+</span>
            <span className="text-slate-400 text-xs md:text-sm font-bold">تلميذ مسجل بالمنصة</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-600 block mb-2 font-mono">80+</span>
            <span className="text-slate-400 text-xs md:text-sm font-bold">أستاذ وإداري مؤهل</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-600 block mb-2 font-mono">99.2%</span>
            <span className="text-slate-400 text-xs md:text-sm font-bold">نسبة النجاح الباهر</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-600 block mb-2 font-mono">15+</span>
            <span className="text-slate-400 text-xs md:text-sm font-bold">سنة من التميز التربوي</span>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-luxury-border/30 overflow-hidden">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6">آراء أولياء الأمور</h2>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed">
            نسعد ونعتز دائماً بشهادات أولياء الأمور والأساتذة حول مدى مساهمة المنصة في تحسين التجربة التعليمية في المؤسسة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonialList.map((test, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ scale: 1.01 }}
              className="p-6 sm:p-8 rounded-2xl glass-panel border border-luxury-border flex flex-col justify-between text-right relative overflow-hidden bg-white/40"
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
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto border-t border-luxury-border/30 overflow-hidden">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-center mb-12 sm:mb-16">الأسئلة الشائعة</h2>

        <div className="space-y-4">
          {faqList.map((faq, idx) => (
            <div key={idx} className="rounded-xl glass-panel border border-luxury-border overflow-hidden bg-white/40">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-6 text-right flex justify-between items-center hover:bg-slate-900/5 transition-all gap-3"
              >
                <span className="font-bold text-sm sm:text-base md:text-lg text-slate-100 leading-snug">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-4 sm:p-6 border-t border-luxury-border/50 text-slate-455 text-xs sm:text-sm leading-relaxed font-semibold">
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
      <section id="contact" className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-luxury-border/30 overflow-hidden">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6">اتصل بنا</h2>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed">
            يسعدنا تواصلكم معنا للاستفسار أو زيارة مقر المؤسسة بأولاد فايت.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-right">
          <motion.div 
            whileHover={{ y: -4 }}
            className="p-5 sm:p-6 rounded-2xl glass-panel border border-luxury-border flex items-start gap-4 text-slate-100 bg-white/40"
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
            className="p-5 sm:p-6 rounded-2xl glass-panel border border-luxury-border flex items-start gap-4 text-slate-100 bg-white/40"
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
            className="p-5 sm:p-6 rounded-2xl glass-panel border border-luxury-border flex items-start gap-4 text-slate-100 bg-white/40"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200/30 flex items-center justify-center text-brand-600 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-100">البريد الإلكتروني</h4>
              <p className="text-slate-455 text-xs font-semibold leading-relaxed select-all">contact@ecole-hebr.dz</p>
              <p className="text-slate-455 text-xs font-semibold leading-relaxed select-all">support@ecole-hebr.dz</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-luxury-border py-8 sm:py-12 px-4 sm:px-6 text-center text-slate-500 text-xs bg-white/20 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
          <span>© 2026 {settings?.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة'}. جميع الحقوق محفوظة.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-350">الشروط والأحكام</a>
            <a href="#" className="hover:text-slate-350">سياسة الخصوصية</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
