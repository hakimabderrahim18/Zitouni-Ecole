const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DAY_MAP = {
  Dimanche: 'الأحد',
  Lundi: 'الإثنين',
  Mardi: 'الثلاثاء',
  Mercredi: 'الأربعاء',
  Jeudi: 'الخميس',
};

const TIME_SLOT_MAP = {
  '8H30': '08:30 - 09:30',
  '9H30': '09:30 - 10:30',
  '10H30': '10:30 - 11:30',
  '11H30': '11:30 - 12:30',
  '13H30': '13:30 - 14:30',
  '14H30': '14:30 - 15:30',
  '15H30': '15:30 - 16:30',
};

const SUBJECT_MAP = {
  MATHS: 'الرياضيات',
  ARAB: 'اللغة العربية',
  HISGE: 'التاريخ والجغرافيا',
  PHYS: 'العلوم الفيزيائية والتكنولوجيا',
  FRAN: 'اللغة الفرنسية',
  ANG: 'اللغة الإنجليزية',
  SCIEN: 'علوم الطبيعة والحياة',
  ISLAM: 'التربية الإسلامية',
  CIVIQ: 'التربية المدنية',
  PHILO: 'الفلسفة',
  INFO: 'الإعلام الآلي',
  SPORT: 'التربية البدنية والرياضية',
  GEST: 'تسيير واقتصاد',
  COMPT: 'محاسبة ومالية',
  DROIT: 'القانون',
  GMECA: 'هندسة ميكانيكية',
  GCIVL: 'هندسة مدنية',
  ITA: 'اللغة الإيطالية',
  ESP: 'اللغة الإسبانية',
  DESIN: 'الرسم والتربية التشكيلية',
};

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

// Weekly Primary Schedule Template (for 1AP through 5AP)
const PRIMARY_SCHEDULE_TEMPLATE = [
  // Sunday
  { day: 'Dimanche', hour: '8H30', subject: 'ARAB', teacher: 'نادية صالحي', modality: 'CG', roomSuffix: '01' },
  { day: 'Dimanche', hour: '9H30', subject: 'MATHS', teacher: 'كمال دحماني', modality: 'CG', roomSuffix: '01' },
  { day: 'Dimanche', hour: '10H30', subject: 'ISLAM', teacher: 'نادية صالحي', modality: 'CG', roomSuffix: '01' },
  { day: 'Dimanche', hour: '11H30', subject: 'CIVIQ', teacher: 'نادية صالحي', modality: 'CG', roomSuffix: '01' },
  { day: 'Dimanche', hour: '13H30', subject: 'SCIEN', teacher: 'صورايا بن طيب', modality: 'TP', roomSuffix: 'مخبر العلوم', splitGroups: true, subB: 'DESIN', teacherB: 'يوسف مزاوي', roomB: 'قاعة الفنون' },
  { day: 'Dimanche', hour: '14H30', subject: 'DESIN', teacher: 'يوسف مزاوي', modality: 'TP', roomSuffix: 'قاعة الفنون', splitGroups: true, subB: 'SCIEN', teacherB: 'صورايا بن طيب', roomB: 'مخبر العلوم' },

  // Monday
  { day: 'Lundi', hour: '8H30', subject: 'MATHS', teacher: 'كمال دحماني', modality: 'CG', roomSuffix: '01' },
  { day: 'Lundi', hour: '9H30', subject: 'ARAB', teacher: 'نادية صالحي', modality: 'CG', roomSuffix: '01' },
  { day: 'Lundi', hour: '10H30', subject: 'FRAN', teacher: 'فاروق بلقاسم', modality: 'CG', roomSuffix: '01' },
  { day: 'Lundi', hour: '11H30', subject: 'FRAN', teacher: 'فاروق بلقاسم', modality: 'CG', roomSuffix: '01' },
  { day: 'Lundi', hour: '13H30', subject: 'SPORT', teacher: 'عبد الحميد حداد', modality: 'CG', roomSuffix: 'الملعب الرياضي' },
  { day: 'Lundi', hour: '14H30', subject: 'INFO', teacher: 'رضا بن عيسى', modality: 'TP', roomSuffix: 'مخبر الإعلام الآلي', splitGroups: true, subB: 'ARAB', teacherB: 'نادية صالحي', roomB: '01' },

  // Tuesday
  { day: 'Mardi', hour: '8H30', subject: 'ARAB', teacher: 'نادية صالحي', modality: 'CG', roomSuffix: '01' },
  { day: 'Mardi', hour: '9H30', subject: 'MATHS', teacher: 'كمال دحماني', modality: 'CG', roomSuffix: '01' },
  { day: 'Mardi', hour: '10H30', subject: 'HISGE', teacher: 'نادية صالحي', modality: 'CG', roomSuffix: '01' },
  { day: 'Mardi', hour: '11H30', subject: 'ISLAM', teacher: 'نادية صالحي', modality: 'CG', roomSuffix: '01' },
  { day: 'Mardi', hour: '13H30', subject: 'MATHS', teacher: 'كمال دحماني', modality: 'TD', roomSuffix: '01', splitGroups: true, subB: 'ARAB', teacherB: 'نادية صالحي', roomB: '02' },
  { day: 'Mardi', hour: '14H30', subject: 'ARAB', teacher: 'نادية صالحي', modality: 'TD', roomSuffix: '01', splitGroups: true, subB: 'MATHS', teacherB: 'كمال دحماني', roomB: '02' },

  // Wednesday
  { day: 'Mercredi', hour: '8H30', subject: 'ARAB', teacher: 'نادية صالحي', modality: 'CG', roomSuffix: '01' },
  { day: 'Mercredi', hour: '9H30', subject: 'FRAN', teacher: 'فاروق بلقاسم', modality: 'CG', roomSuffix: '01' },
  { day: 'Mercredi', hour: '10H30', subject: 'MATHS', teacher: 'كمال دحماني', modality: 'CG', roomSuffix: '01' },
  { day: 'Mercredi', hour: '11H30', subject: 'SCIEN', teacher: 'صورايا بن طيب', modality: 'CG', roomSuffix: 'مخبر العلوم' },
  { day: 'Mercredi', hour: '13H30', subject: 'ANG', teacher: 'عمر القايد', modality: 'CG', roomSuffix: '01' },
  { day: 'Mercredi', hour: '14H30', subject: 'DESIN', teacher: 'يوسف مزاوي', modality: 'CG', roomSuffix: 'قاعة الموسيقى' },

  // Thursday
  { day: 'Jeudi', hour: '8H30', subject: 'MATHS', teacher: 'كمال دحماني', modality: 'CG', roomSuffix: '01' },
  { day: 'Jeudi', hour: '9H30', subject: 'ARAB', teacher: 'نادية صالحي', modality: 'CG', roomSuffix: '01' },
  { day: 'Jeudi', hour: '10H30', subject: 'HISGE', teacher: 'نادية صالحي', modality: 'CG', roomSuffix: '01' },
  { day: 'Jeudi', hour: '11H30', subject: 'SPORT', teacher: 'عبد الحميد حداد', modality: 'CG', roomSuffix: 'الملعب الرياضي' },
  { day: 'Jeudi', hour: '13H30', subject: 'INFO', teacher: 'رضا بن عيسى', modality: 'TP', roomSuffix: 'مخبر الإعلام الآلي', splitGroups: true, subB: 'ARAB', teacherB: 'نادية صالحي', roomB: 'قاعة المطالعة' },
  { day: 'Jeudi', hour: '14H30', subject: 'ARAB', teacher: 'نادية صالحي', modality: 'TD', roomSuffix: 'قاعة المطالعة', splitGroups: true, subB: 'INFO', teacherB: 'رضا بن عيسى', roomB: 'مخبر الإعلام الآلي' },
];

// Weekly Middle School Schedule Template (for 1AM through 4AM)
const MIDDLE_SCHEDULE_TEMPLATE = [
  // Sunday
  { day: 'Dimanche', hour: '8H30', subject: 'MATHS', teacher: 'MAAROUF', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Dimanche', hour: '9H30', subject: 'ARAB', teacher: 'AZIRA', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Dimanche', hour: '10H30', subject: 'SCIEN', teacher: 'BENTAIEB', modality: 'CG', roomSuffix: 'مخبر العلوم' },
  { day: 'Dimanche', hour: '11H30', subject: 'ISLAM', teacher: 'AZIRA', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Dimanche', hour: '13H30', subject: 'PHYS', teacher: 'BOUZID', modality: 'TP', roomSuffix: 'مخبر الفيزياء', splitGroups: true, subB: 'SCIEN', teacherB: 'BENTAIEB', roomB: 'مخبر العلوم' },
  { day: 'Dimanche', hour: '14H30', subject: 'SCIEN', teacher: 'BENTAIEB', modality: 'TP', roomSuffix: 'مخبر العلوم', splitGroups: true, subB: 'PHYS', teacherB: 'BOUZID', roomB: 'مخبر الفيزياء' },

  // Monday
  { day: 'Lundi', hour: '8H30', subject: 'FRAN', teacher: 'BELKACEM', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Lundi', hour: '9H30', subject: 'MATHS', teacher: 'MAAROUF', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Lundi', hour: '10H30', subject: 'ANG', teacher: 'EL KAID', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Lundi', hour: '11H30', subject: 'HISGE', teacher: 'AZIRA', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Lundi', hour: '13H30', subject: 'SPORT', teacher: 'HADDAD', modality: 'CG', roomSuffix: 'الملعب الرياضي' },
  { day: 'Lundi', hour: '14H30', subject: 'INFO', teacher: 'رضا بن عيسى', modality: 'TP', roomSuffix: 'مخبر الإعلام الآلي', splitGroups: true, subB: 'MATHS', teacherB: 'MAAROUF', roomB: 'قاعة 06' },

  // Tuesday
  { day: 'Mardi', hour: '8H30', subject: 'ARAB', teacher: 'AZIRA', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Mardi', hour: '9H30', subject: 'PHYS', teacher: 'BOUZID', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Mardi', hour: '10H30', subject: 'CIVIQ', teacher: 'AZIRA', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Mardi', hour: '11H30', subject: 'FRAN', teacher: 'BELKACEM', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Mardi', hour: '13H30', subject: 'MATHS', teacher: 'MAAROUF', modality: 'TD', roomSuffix: 'قاعة 06', splitGroups: true, subB: 'ARAB', teacherB: 'AZIRA', roomB: 'قاعة 07' },
  { day: 'Mardi', hour: '14H30', subject: 'ARAB', teacher: 'AZIRA', modality: 'TD', roomSuffix: 'قاعة 06', splitGroups: true, subB: 'MATHS', teacherB: 'MAAROUF', roomB: 'قاعة 07' },

  // Wednesday
  { day: 'Mercredi', hour: '8H30', subject: 'MATHS', teacher: 'MAAROUF', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Mercredi', hour: '9H30', subject: 'FRAN', teacher: 'BELKACEM', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Mercredi', hour: '10H30', subject: 'ANG', teacher: 'EL KAID', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Mercredi', hour: '11H30', subject: 'SCIEN', teacher: 'BENTAIEB', modality: 'CG', roomSuffix: 'مخبر العلوم' },
  { day: 'Mercredi', hour: '13H30', subject: 'DESIN', teacher: 'MEZAOUI', modality: 'CG', roomSuffix: 'قاعة الفنون' },
  { day: 'Mercredi', hour: '14H30', subject: 'ISLAM', teacher: 'AZIRA', modality: 'CG', roomSuffix: 'قاعة 06' },

  // Thursday
  { day: 'Jeudi', hour: '8H30', subject: 'ARAB', teacher: 'AZIRA', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Jeudi', hour: '9H30', subject: 'PHYS', teacher: 'BOUZID', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Jeudi', hour: '10H30', subject: 'HISGE', teacher: 'AZIRA', modality: 'CG', roomSuffix: 'قاعة 06' },
  { day: 'Jeudi', hour: '11H30', subject: 'SPORT', teacher: 'HADDAD', modality: 'CG', roomSuffix: 'الملعب الرياضي' },
  { day: 'Jeudi', hour: '13H30', subject: 'INFO', teacher: 'رضا بن عيسى', modality: 'TP', roomSuffix: 'مخبر الإعلام الآلي', splitGroups: true, subB: 'FRAN', teacherB: 'BELKACEM', roomB: 'قاعة 06' },
  { day: 'Jeudi', hour: '14H30', subject: 'FRAN', teacher: 'BELKACEM', modality: 'TD', roomSuffix: 'قاعة 06', splitGroups: true, subB: 'INFO', teacherB: 'رضا بن عيسى', roomB: 'مخبر الإعلام الآلي' },
];

// Weekly Secondary Schedule Template (for 1S, 2S, 3S, 1L, etc.)
const SECONDARY_SCHEDULE_TEMPLATE = [
  // Sunday
  { day: 'Dimanche', hour: '8H30', subject: 'MATHS', teacher: 'MAAROUF', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Dimanche', hour: '9H30', subject: 'PHYS', teacher: 'BOUZID', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Dimanche', hour: '10H30', subject: 'SCIEN', teacher: 'BENTAIEB', modality: 'CG', roomSuffix: 'مخبر العلوم' },
  { day: 'Dimanche', hour: '11H30', subject: 'ARAB', teacher: 'AZIRA', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Dimanche', hour: '13H30', subject: 'PHYS', teacher: 'BOUZID', modality: 'TP', roomSuffix: 'مخبر الفيزياء', splitGroups: true, subB: 'SCIEN', teacherB: 'BENTAIEB', roomB: 'مخبر العلوم' },
  { day: 'Dimanche', hour: '14H30', subject: 'SCIEN', teacher: 'BENTAIEB', modality: 'TP', roomSuffix: 'مخبر العلوم', splitGroups: true, subB: 'PHYS', teacherB: 'BOUZID', roomB: 'مخبر الفيزياء' },

  // Monday
  { day: 'Lundi', hour: '8H30', subject: 'FRAN', teacher: 'BELKACEM', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Lundi', hour: '9H30', subject: 'ANG', teacher: 'EL KAID', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Lundi', hour: '10H30', subject: 'MATHS', teacher: 'MAAROUF', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Lundi', hour: '11H30', subject: 'ISLAM', teacher: 'AZIRA', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Lundi', hour: '13H30', subject: 'SPORT', teacher: 'HADDAD', modality: 'CG', roomSuffix: 'الملعب الرياضي' },
  { day: 'Lundi', hour: '14H30', subject: 'INFO', teacher: 'رضا بن عيسى', modality: 'TP', roomSuffix: 'مخبر الإعلام الآلي', splitGroups: true, subB: 'MATHS', teacherB: 'MAAROUF', roomB: 'قاعة 12' },

  // Tuesday
  { day: 'Mardi', hour: '8H30', subject: 'MATHS', teacher: 'MAAROUF', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Mardi', hour: '9H30', subject: 'PHYS', teacher: 'BOUZID', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Mardi', hour: '10H30', subject: 'PHILO', teacher: 'AZIRA', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Mardi', hour: '11H30', subject: 'HISGE', teacher: 'AZIRA', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Mardi', hour: '13H30', subject: 'MATHS', teacher: 'MAAROUF', modality: 'TD', roomSuffix: 'قاعة 12', splitGroups: true, subB: 'PHYS', teacherB: 'BOUZID', roomB: 'قاعة 13' },
  { day: 'Mardi', hour: '14H30', subject: 'PHYS', teacher: 'BOUZID', modality: 'TD', roomSuffix: 'قاعة 12', splitGroups: true, subB: 'MATHS', teacherB: 'MAAROUF', roomB: 'قاعة 13' },

  // Wednesday
  { day: 'Mercredi', hour: '8H30', subject: 'SCIEN', teacher: 'BENTAIEB', modality: 'CG', roomSuffix: 'مخبر العلوم' },
  { day: 'Mercredi', hour: '9H30', subject: 'MATHS', teacher: 'MAAROUF', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Mercredi', hour: '10H30', subject: 'FRAN', teacher: 'BELKACEM', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Mercredi', hour: '11H30', subject: 'ANG', teacher: 'EL KAID', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Mercredi', hour: '13H30', subject: 'ARAB', teacher: 'AZIRA', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Mercredi', hour: '14H30', subject: 'HISGE', teacher: 'AZIRA', modality: 'CG', roomSuffix: 'قاعة 12' },

  // Thursday
  { day: 'Jeudi', hour: '8H30', subject: 'PHYS', teacher: 'BOUZID', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Jeudi', hour: '9H30', subject: 'MATHS', teacher: 'MAAROUF', modality: 'CG', roomSuffix: 'قاعة 12' },
  { day: 'Jeudi', hour: '10H30', subject: 'SCIEN', teacher: 'BENTAIEB', modality: 'CG', roomSuffix: 'مخبر العلوم' },
  { day: 'Jeudi', hour: '11H30', subject: 'SPORT', teacher: 'HADDAD', modality: 'CG', roomSuffix: 'الملعب الرياضي' },
  { day: 'Jeudi', hour: '13H30', subject: 'INFO', teacher: 'رضا بن عيسى', modality: 'TP', roomSuffix: 'مخبر الإعلام الآلي', splitGroups: true, subB: 'ARAB', teacherB: 'AZIRA', roomB: 'قاعة 12' },
  { day: 'Jeudi', hour: '14H30', subject: 'ARAB', teacher: 'AZIRA', modality: 'TD', roomSuffix: 'قاعة 12', splitGroups: true, subB: 'INFO', teacherB: 'رضا بن عيسى', roomB: 'مخبر الإعلام الآلي' },
];

function generateClassEntries(divisionCode, template, roomName, classId = null) {
  const entries = [];
  const divisionArabic = DIVISION_MAP[divisionCode] || divisionCode;

  for (const slot of template) {
    if (slot.splitGroups) {
      // Entry for الفوج أ
      entries.push({
        academicYear: '2025-2026',
        day: slot.day,
        dayArabic: DAY_MAP[slot.day] || slot.day,
        hour: slot.hour,
        timeSlot: TIME_SLOT_MAP[slot.hour] || slot.hour,
        division: divisionCode,
        divisionArabic,
        class: classId,
        subjectCode: slot.subject,
        subjectName: SUBJECT_MAP[slot.subject] || slot.subject,
        teacherName: slot.teacher,
        room: slot.roomSuffix || roomName,
        group: 'الفوج أ',
        modality: slot.modality || 'TP',
        regr: '',
        remarks: 'حصة تطبيقية / فوج أ',
      });

      // Entry for الفوج ب
      entries.push({
        academicYear: '2025-2026',
        day: slot.day,
        dayArabic: DAY_MAP[slot.day] || slot.day,
        hour: slot.hour,
        timeSlot: TIME_SLOT_MAP[slot.hour] || slot.hour,
        division: divisionCode,
        divisionArabic,
        class: classId,
        subjectCode: slot.subB || slot.subject,
        subjectName: SUBJECT_MAP[slot.subB || slot.subject] || slot.subB || slot.subject,
        teacherName: slot.teacherB || slot.teacher,
        room: slot.roomB || roomName,
        group: 'الفوج ب',
        modality: slot.modality || 'TP',
        regr: '',
        remarks: 'حصة تطبيقية / فوج ب',
      });
    } else {
      // General session applies to both groups: create entry for الفوج أ and الفوج ب and general
      entries.push({
        academicYear: '2025-2026',
        day: slot.day,
        dayArabic: DAY_MAP[slot.day] || slot.day,
        hour: slot.hour,
        timeSlot: TIME_SLOT_MAP[slot.hour] || slot.hour,
        division: divisionCode,
        divisionArabic,
        class: classId,
        subjectCode: slot.subject,
        subjectName: SUBJECT_MAP[slot.subject] || slot.subject,
        teacherName: slot.teacher,
        room: slot.roomSuffix || roomName,
        group: 'الفوج أ',
        modality: slot.modality || 'CG',
        regr: '',
        remarks: 'حصة موحدة - الفوج أ',
      });

      entries.push({
        academicYear: '2025-2026',
        day: slot.day,
        dayArabic: DAY_MAP[slot.day] || slot.day,
        hour: slot.hour,
        timeSlot: TIME_SLOT_MAP[slot.hour] || slot.hour,
        division: divisionCode,
        divisionArabic,
        class: classId,
        subjectCode: slot.subject,
        subjectName: SUBJECT_MAP[slot.subject] || slot.subject,
        teacherName: slot.teacher,
        room: slot.roomSuffix || roomName,
        group: 'الفوج ب',
        modality: slot.modality || 'CG',
        regr: '',
        remarks: 'حصة موحدة - الفوج ب',
      });
    }
  }

  return entries;
}

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/zitouni_school';
  console.log('[TimetableSeeder] Connecting to MongoDB:', uri);
  await mongoose.connect(uri);

  const Class = mongoose.model('Class', new mongoose.Schema({ name: String, level: String, description: String }));
  const classesInDb = await Class.find().lean();
  console.log(`[TimetableSeeder] Found ${classesInDb.length} classes in database.`);
  const classMap = {};
  classesInDb.forEach(c => {
    classMap[c.name] = c._id;
  });

  // Load existing 708 entries from data/timetableEntries.json if exists
  const jsonPath = path.join(__dirname, '..', 'data', 'timetableEntries.json');
  let originalEntries = [];
  if (fs.existsSync(jsonPath)) {
    originalEntries = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`[TimetableSeeder] Loaded ${originalEntries.length} base entries from timetableEntries.json.`);
  }

  // Enrich original entries: attach classId and normalize groups
  const enrichedOriginal = originalEntries.map((e, idx) => {
    const clone = { ...e };
    if (!clone.class && classMap[clone.division]) {
      clone.class = classMap[clone.division];
    }
    if (!clone.group || clone.group === '--') {
      // Alternate group for TP/TD, else tag with الفوج أ
      clone.group = (idx % 2 === 0) ? 'الفوج أ' : 'الفوج ب';
    }
    return clone;
  });

  const allGeneratedEntries = [...enrichedOriginal];

  // 1. Primary Classes (1AP through 5AP)
  const primaryClasses = [
    { code: '1AP', room: 'قاعة 01 (سنة أولى ابتدائي)' },
    { code: '2AP', room: 'قاعة 02 (سنة ثانية ابتدائي)' },
    { code: '3AP', room: 'قاعة 03 (سنة ثالثة ابتدائي)' },
    { code: '4AP', room: 'قاعة 04 (سنة رابعة ابتدائي)' },
    { code: '5AP', room: 'قاعة 05 (سنة خامسة ابتدائي)' },
  ];

  for (const pc of primaryClasses) {
    const classId = classMap[pc.code] || null;
    const entries = generateClassEntries(pc.code, PRIMARY_SCHEDULE_TEMPLATE, pc.room, classId);
    console.log(`[TimetableSeeder] Generated ${entries.length} entries for Primary ${pc.code} (${pc.room}).`);
    allGeneratedEntries.push(...entries);
  }

  // 2. Middle School Classes (1AM, 2AM, 3AM, 4AM)
  const middleClasses = [
    { code: '1AM', room: 'قاعة 06 (1 متوسط)' },
    { code: '2AM', room: 'قاعة 07 (2 متوسط)' },
    { code: '3AM', room: 'قاعة 08 (3 متوسط)' },
    { code: '4AM', room: 'قاعة 09 (4 متوسط)' },
  ];

  for (const mc of middleClasses) {
    const classId = classMap[mc.code] || null;
    const entries = generateClassEntries(mc.code, MIDDLE_SCHEDULE_TEMPLATE, mc.room, classId);
    console.log(`[TimetableSeeder] Generated ${entries.length} entries for Middle ${mc.code}.`);
    allGeneratedEntries.push(...entries);
  }

  // 3. Secondary School Classes (1S, 1 Scientifique, 1L, 1 Lettres, 2S, 2M, 2MT, 2GT, 2LP, 2LV, 3S, 3M, 3MT, 3GT, 3LP)
  const secondaryClasses = [
    { code: '1S', room: 'قاعة 10 (1 ثانوي علمي)' },
    { code: '1 Scientifique', room: 'قاعة 10 (1 ثانوي علمي)' },
    { code: '1L', room: 'قاعة 11 (1 ثانوي أدبي)' },
    { code: '1 Lettres', room: 'قاعة 11 (1 ثانوي أدبي)' },
    { code: '2S', room: 'قاعة 12 (2 ثانوي علوم)' },
    { code: '2M', room: 'قاعة 13 (2 ثانوي رياضيات)' },
    { code: '2MT', room: 'مخبر الهندسة (2 ثانوي تقني)' },
    { code: '2GT', room: 'قاعة 14 (2 ثانوي تسيير)' },
    { code: '2LP', room: 'قاعة 15 (2 ثانوي آداب)' },
    { code: '2LV', room: 'قاعة 15 (2 ثانوي لغات)' },
    { code: '3S', room: 'قاعة 16 (3 ثانوي علوم بكالوريا)' },
    { code: '3M', room: 'قاعة 17 (3 ثانوي رياضيات بكالوريا)' },
    { code: '3MT', room: 'مخبر الهندسة (3 ثانوي تقني بكالوريا)' },
    { code: '3GT', room: 'قاعة 18 (3 ثانوي تسيير بكالوريا)' },
    { code: '3LP', room: 'قاعة 19 (3 ثانوي آداب بكالوريا)' },
  ];

  for (const sc of secondaryClasses) {
    const classId = classMap[sc.code] || null;
    const entries = generateClassEntries(sc.code, SECONDARY_SCHEDULE_TEMPLATE, sc.room, classId);
    console.log(`[TimetableSeeder] Generated ${entries.length} entries for Secondary ${sc.code}.`);
    allGeneratedEntries.push(...entries);
  }

  console.log(`[TimetableSeeder] Total entries generated: ${allGeneratedEntries.length}`);

  // Save to backend/src/data/timetableEntries.json
  fs.writeFileSync(jsonPath, JSON.stringify(allGeneratedEntries, null, 2), 'utf8');
  console.log(`[TimetableSeeder] Successfully wrote ${allGeneratedEntries.length} entries to ${jsonPath}.`);

  // Update MongoDB database
  const TimetableEntry = mongoose.model('TimetableEntry', new mongoose.Schema({}, { strict: false }), 'timetableentries');
  console.log('[TimetableSeeder] Purging old TimetableEntry collection...');
  await TimetableEntry.deleteMany({});
  console.log('[TimetableSeeder] Inserting new enriched timetable entries into MongoDB...');
  
  // Insert in batches of 500
  const batchSize = 500;
  for (let i = 0; i < allGeneratedEntries.length; i += batchSize) {
    const chunk = allGeneratedEntries.slice(i, i + batchSize);
    await TimetableEntry.insertMany(chunk);
    console.log(`[TimetableSeeder] Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allGeneratedEntries.length / batchSize)}`);
  }

  const finalCount = await TimetableEntry.countDocuments();
  console.log(`[TimetableSeeder] Verified in DB: ${finalCount} TimetableEntry documents present.`);

  // Test queries for Yanis Meziane (1AP) and other classes
  const yanisEntries = await TimetableEntry.find({ division: '1AP' });
  console.log(`[TimetableSeeder] Query division='1AP' returned ${yanisEntries.length} entries.`);
  const groupAEntries = await TimetableEntry.find({ division: '1AP', group: 'الفوج أ' });
  console.log(`[TimetableSeeder] Query division='1AP', group='الفوج أ' returned ${groupAEntries.length} entries.`);
  const groupBEntries = await TimetableEntry.find({ division: '1AP', group: 'الفوج ب' });
  console.log(`[TimetableSeeder] Query division='1AP', group='الفوج ب' returned ${groupBEntries.length} entries.`);

  await mongoose.disconnect();
  console.log('[TimetableSeeder] DONE successfully!');
}

run().catch(err => {
  console.error('[TimetableSeeder] Fatal error:', err);
  process.exit(1);
});
