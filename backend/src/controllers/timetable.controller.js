const xlsx = require('xlsx');
const TimetableEntry = require('../models/timetableEntry.model');
const Class = require('../models/class.model');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');

// Dictionaries
const SUBJECT_MAP = {
  'MATHS': { arabic: 'الرياضيات', french: 'Mathématiques' },
  'ARAB': { arabic: 'اللغة العربية', french: 'Langue Arabe' },
  'HISGE': { arabic: 'التاريخ والجغرافيا', french: 'Histoire-Géographie' },
  'PHYS': { arabic: 'العلوم الفيزيائية', french: 'Physique-Chimie' },
  'FRAN': { arabic: 'اللغة الفرنسية', french: 'Français' },
  'ANG': { arabic: 'اللغة الإنجليزية', french: 'Anglais' },
  'SCIEN': { arabic: 'علوم الطبيعة والحياة', french: 'Sciences Naturelles' },
  'ISLAM': { arabic: 'التربية الإسلامية', french: 'Éducation Islamique' },
  'PHILO': { arabic: 'الفلسفة', french: 'Philosophie' },
  'INFO': { arabic: 'الإعلام الآلي', french: 'Informatique' },
  'SPORT': { arabic: 'التربية البدنية والرياضية', french: 'Éducation Physique' },
  'GEST': { arabic: 'تسيير واقتصاد', french: 'Économie et Gestion' },
  'COMPT': { arabic: 'محاسبة ومالية', french: 'Comptabilité' },
  'DROIT': { arabic: 'القانون', french: 'Droit' },
  'GMECA': { arabic: 'هندسة ميكانيكية', french: 'Génie Mécanique' },
  'GCIVL': { arabic: 'هندسة مدنية', french: 'Génie Civil' },
  'CIVIQ': { arabic: 'التربية المدنية', french: 'Éducation Civique' },
  'ITA': { arabic: 'اللغة الإيطالية', french: 'Italien' },
  'ESP': { arabic: 'اللغة الإسبانية', french: 'Espagnol' },
  'DESIN': { arabic: 'الرسم والتربية التشكيلية', french: 'Arts Plastiques' },
};

const DIVISION_MAP = {
  // Primary Classes
  '1AP': 'السنة الأولى ابتدائي',
  '2AP': 'السنة الثانية ابتدائي',
  '3AP': 'السنة الثالثة ابتدائي',
  '4AP': 'السنة الرابعة ابتدائي',
  '5AP': 'السنة الخامسة ابتدائي',

  // Middle School Classes
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

  // Secondary School Classes
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

const DAY_MAP = {
  'Dimanche': 'الأحد',
  'Lundi': 'الإثنين',
  'Mardi': 'الثلاثاء',
  'Mercredi': 'الأربعاء',
  'Jeudi': 'الخميس',
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

// 1. Import Timetable from RAN09.DBF.xlsx or uploaded file
const importTimetableExcel = async (req, res, next) => {
  try {
    let buffer;
    if (req.file) {
      buffer = req.file.buffer;
    } else {
      const defaultPath = 'C:\\Users\\PC\\Downloads\\zitouniswaleh\\RAN09.DBF.xlsx';
      const fs = require('fs');
      if (fs.existsSync(defaultPath)) {
        buffer = fs.readFileSync(defaultPath);
      } else {
        return res.status(400).json({ message: 'Aucun fichier fourni et RAN09.DBF.xlsx introuvable.' });
      }
    }

    const previewOnly = req.query.previewOnly === 'true' || req.body.previewOnly === true;
    const replaceExisting = req.body.replaceExisting !== false; // default true
    const academicYear = req.body.academicYear || '2025-2026';

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(sheet);

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ message: 'La feuille de calcul est vide.' });
    }

    const parsedEntries = [];
    const divisionsSet = new Set();
    const teachersSet = new Set();
    const subjectsSet = new Set();
    const conflicts = [];

    // Map for conflict detection: key = `${day}_${hour}_${teacherName}`
    const teacherSlots = {};
    // Map for room conflict: key = `${day}_${hour}_${room}`
    const roomSlots = {};

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const day = (row['JOUR'] || '').trim();
      const hour = (row['HEURE'] || '').trim().toUpperCase();
      const division = (row['DIVISION'] || '').trim();
      const subjectCode = (row['MAT'] || '').trim().toUpperCase();
      const teacherName = (row['PROF'] || '').trim().toUpperCase();
      const modality = (row['MODALITE'] || 'CG').trim();
      const group = (row['GROUPE'] || '').trim();
      const regr = (row['REGR'] || '').trim();
      const room = (row['SALLE'] || '').trim();

      if (!day || !hour || !division || !subjectCode || !teacherName) {
        continue;
      }

      divisionsSet.add(division);
      teachersSet.add(teacherName);
      subjectsSet.add(subjectCode);

      const dayArabic = DAY_MAP[day] || day;
      const timeSlot = TIME_SLOT_MAP[hour] || hour;
      const divisionArabic = DIVISION_MAP[division] || division;
      const subjectName = SUBJECT_MAP[subjectCode]?.arabic || subjectCode;

      // Conflict Check: Teacher double-booked (except if regrouped)
      const teacherKey = `${day}_${hour}_${teacherName}`;
      if (teacherSlots[teacherKey]) {
        const existing = teacherSlots[teacherKey];
        const isLegitRegroup = regr && existing.regr && regr === existing.regr;
        if (!isLegitRegroup) {
          conflicts.push({
            type: 'TeacherConflict',
            teacher: teacherName,
            day,
            hour,
            division1: existing.division,
            division2: division,
            message: `L'enseignant(e) ${teacherName} est planifié(e) simultanément pour ${existing.division} et ${division} (${day} ${hour}).`,
          });
        }
      } else {
        teacherSlots[teacherKey] = { division, regr };
      }

      // Conflict Check: Room double-booked (if room specified)
      if (room) {
        const roomKey = `${day}_${hour}_${room}`;
        if (roomSlots[roomKey]) {
          const existing = roomSlots[roomKey];
          const isLegitRegroup = regr && existing.regr && regr === existing.regr;
          if (!isLegitRegroup) {
            conflicts.push({
              type: 'RoomConflict',
              room,
              day,
              hour,
              division1: existing.division,
              division2: division,
              message: `La salle ${room} est occupée par ${existing.division} et ${division} au même créneau (${day} ${hour}).`,
            });
          }
        } else {
          roomSlots[roomKey] = { division, regr };
        }
      }

      parsedEntries.push({
        academicYear,
        day,
        dayArabic,
        hour,
        timeSlot,
        division,
        divisionArabic,
        subjectCode,
        subjectName,
        teacherName,
        modality,
        group,
        regr,
        room,
      });
    }

    if (previewOnly) {
      return res.status(200).json({
        preview: true,
        totalRows: rawRows.length,
        validSlots: parsedEntries.length,
        divisionsCount: divisionsSet.size,
        divisions: Array.from(divisionsSet).map(d => ({
          code: d,
          nameArabic: DIVISION_MAP[d] || d,
        })),
        teachersCount: teachersSet.size,
        teachers: Array.from(teachersSet).sort(),
        subjectsCount: subjectsSet.size,
        subjects: Array.from(subjectsSet).map(s => ({
          code: s,
          nameArabic: SUBJECT_MAP[s]?.arabic || s,
        })),
        conflictsCount: conflicts.length,
        conflicts,
        sampleEntries: parsedEntries.slice(0, 10),
      });
    }

    // Save to Database
    if (replaceExisting) {
      await TimetableEntry.deleteMany({ academicYear });
    }

    // Auto-create or find Classes for each division
    const classMap = {};
    for (const divCode of divisionsSet) {
      const arabicName = DIVISION_MAP[divCode] || divCode;
      let cls = await Class.findOne({ name: divCode });
      if (!cls) {
        cls = await Class.create({
          name: divCode,
          level: divCode.includes('AM') ? 'middle' : 'secondary',
          description: arabicName,
        });
      }
      classMap[divCode] = cls._id;
    }

    // Attach classId to parsed entries
    for (const entry of parsedEntries) {
      if (classMap[entry.division]) {
        entry.class = classMap[entry.division];
      }
    }

    const inserted = await TimetableEntry.insertMany(parsedEntries);

    res.status(201).json({
      message: `Emploi du temps importé avec succès : ${inserted.length} séances enregistrées pour ${divisionsSet.size} classes et ${teachersSet.size} enseignants.`,
      insertedCount: inserted.length,
      divisionsCount: divisionsSet.size,
      teachersCount: teachersSet.size,
      conflictsCount: conflicts.length,
      conflicts,
    });
  } catch (error) {
    next(error);
  }
};

const ALIAS_MAP = {
  '1AM': ['1AM1'],
  '1AM1': ['1AM'],
  '2AM': ['2AM1'],
  '2AM1': ['2AM'],
  '3AM': ['3AM1', '3AM2'],
  '4AM': ['4AM1', '4AM2'],
  '1S': ['1S1', '1S2', '1 Scientifique'],
  '1 Scientifique': ['1S', '1S1', '1S2'],
  '1L': ['1 Lettres'],
  '1 Lettres': ['1L'],
  '2S': ['2SE'],
  '2SE': ['2S'],
  '2M': ['2MA'],
  '2MA': ['2M'],
  '2MT': ['2MTgm'],
  '2MTgm': ['2MT'],
  '2LV': ['2LE'],
  '2LE': ['2LV'],
  '3S': ['3SE'],
  '3SE': ['3S'],
  '3MT': ['3MTgc'],
  '3MTgc': ['3MT'],
  '3GT': ['3GE'],
  '3GE': ['3GT'],
};

// 2. Get Timetable for a specific Division (Class)
const getTimetableByDivision = async (req, res, next) => {
  try {
    const { division } = req.params;
    const { academicYear, group } = req.query;

    const trimmed = (division || '').trim();
    const query = { division: trimmed };
    if (academicYear) query.academicYear = academicYear;
    if (group && group !== 'all') {
      query.$or = [{ group }, { group: '' }, { group: null }, { group: 'الكل' }];
    }

    let entries = await TimetableEntry.find(query).sort({ day: 1, hour: 1 });

    // Fallback aliases if no entries found for direct code
    if (entries.length === 0) {
      const aliases = ALIAS_MAP[trimmed] || [];
      for (const alt of aliases) {
        const altQuery = { division: alt };
        if (academicYear) altQuery.academicYear = academicYear;
        if (group && group !== 'all') {
          altQuery.$or = [{ group }, { group: '' }, { group: null }, { group: 'الكل' }];
        }
        const found = await TimetableEntry.find(altQuery).sort({ day: 1, hour: 1 });
        if (found.length > 0) {
          entries = found;
          break;
        }
      }
    }

    res.status(200).json({
      division: trimmed,
      divisionArabic: DIVISION_MAP[trimmed] || trimmed,
      entriesCount: entries.length,
      entries,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Timetable for a specific Teacher
const getTimetableByTeacher = async (req, res, next) => {
  try {
    const { teacherName } = req.params;
    const { academicYear } = req.query;

    const query = { teacherName: new RegExp(`^${teacherName.trim()}$`, 'i') };
    if (academicYear) query.academicYear = academicYear;

    const entries = await TimetableEntry.find(query).sort({ day: 1, hour: 1 });

    res.status(200).json({
      teacherName,
      entriesCount: entries.length,
      entries,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get Timetable for a specific Room
const getTimetableByRoom = async (req, res, next) => {
  try {
    const { room } = req.params;
    const { academicYear } = req.query;

    const query = { room: room.trim() };
    if (academicYear) query.academicYear = academicYear;

    const entries = await TimetableEntry.find(query).sort({ day: 1, hour: 1 });

    res.status(200).json({
      room,
      entriesCount: entries.length,
      entries,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Get current user's timetable (Student or Teacher)
const getMyTimetable = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.role === 'student') {
      const student = await Student.findOne({ user: user.id }).populate('class').populate('group');
      if (!student || !student.class) {
        return res.status(200).json({ entries: [], message: 'Classe non encore assignée.' });
      }
      const division = student.class.name;
      let entries = await TimetableEntry.find({ division }).sort({ day: 1, hour: 1 });
      if (entries.length === 0 && ALIAS_MAP[division]) {
        for (const alt of ALIAS_MAP[division]) {
          const found = await TimetableEntry.find({ division: alt }).sort({ day: 1, hour: 1 });
          if (found.length > 0) {
            entries = found;
            break;
          }
        }
      }
      return res.status(200).json({
        role: 'student',
        division,
        divisionArabic: DIVISION_MAP[division] || division,
        group: student.group?.name || '',
        entries,
      });
    }

    if (user.role === 'teacher') {
      // Look up by teacher's last name or firstName
      const searchName = user.lastName?.toUpperCase() || '';
      const entries = await TimetableEntry.find({
        teacherName: new RegExp(searchName, 'i'),
      }).sort({ day: 1, hour: 1 });

      return res.status(200).json({
        role: 'teacher',
        teacherName: user.lastName,
        entries,
      });
    }

    res.status(400).json({ message: 'Rôle non supporté pour getMyTimetable.' });
  } catch (error) {
    next(error);
  }
};

// 6. Get child's timetable (for parent)
const getChildTimetable = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId).populate('class').populate('group');
    if (!student || !student.class) {
      return res.status(200).json({ entries: [], message: 'Classe introuvable pour cet élève.' });
    }

    const division = student.class.name;
    let entries = await TimetableEntry.find({ division }).sort({ day: 1, hour: 1 });
    if (entries.length === 0 && ALIAS_MAP[division]) {
      for (const alt of ALIAS_MAP[division]) {
        const found = await TimetableEntry.find({ division: alt }).sort({ day: 1, hour: 1 });
        if (found.length > 0) {
          entries = found;
          break;
        }
      }
    }

    res.status(200).json({
      studentId,
      division,
      divisionArabic: DIVISION_MAP[division] || division,
      group: student.group?.name || '',
      entries,
    });
  } catch (error) {
    next(error);
  }
};

// 7. Get Timetable Metadata & Filters (Divisions, Teachers, Subjects, Days, Hours, Groups)
const getTimetableMetadata = async (req, res, next) => {
  try {
    const academicYear = req.query.academicYear || '2025-2026';

    const divisions = await TimetableEntry.distinct('division', { academicYear });
    const teachers = await TimetableEntry.distinct('teacherName', { academicYear });
    const subjects = await TimetableEntry.distinct('subjectCode', { academicYear });
    const rooms = await TimetableEntry.distinct('room', { academicYear });
    const groups = await TimetableEntry.distinct('group', { academicYear });

    const formattedDivisions = divisions.sort().map(d => ({
      code: d,
      nameArabic: DIVISION_MAP[d] || d,
    }));

    const formattedSubjects = subjects.sort().map(s => ({
      code: s,
      nameArabic: SUBJECT_MAP[s]?.arabic || s,
      nameFrench: SUBJECT_MAP[s]?.french || s,
    }));

    res.status(200).json({
      academicYear,
      totalEntries: await TimetableEntry.countDocuments({ academicYear }),
      divisions: formattedDivisions,
      teachers: teachers.sort(),
      subjects: formattedSubjects,
      rooms: rooms.filter(Boolean).sort(),
      groups: groups.filter(Boolean).sort(),
      days: [
        { code: 'Dimanche', nameArabic: 'الأحد' },
        { code: 'Lundi', nameArabic: 'الإثنين' },
        { code: 'Mardi', nameArabic: 'الثلاثاء' },
        { code: 'Mercredi', nameArabic: 'الأربعاء' },
        { code: 'Jeudi', nameArabic: 'الخميس' },
      ],
      hours: [
        { code: '8H30', timeSlot: '08:30 - 09:30' },
        { code: '9H30', timeSlot: '09:30 - 10:30' },
        { code: '10H30', timeSlot: '10:30 - 11:30' },
        { code: '11H30', timeSlot: '11:30 - 12:30' },
        { code: '13H30', timeSlot: '13:30 - 14:30' },
        { code: '14H30', timeSlot: '14:30 - 15:30' },
        { code: '15H30', timeSlot: '15:30 - 16:30' },
      ],
    });
  } catch (error) {
    next(error);
  }
};

// 8. Administrative clear of timetable
const clearTimetable = async (req, res, next) => {
  try {
    const { academicYear } = req.body;
    const query = academicYear ? { academicYear } : {};
    const result = await TimetableEntry.deleteMany(query);
    res.status(200).json({
      message: `${result.deletedCount} séances d'emploi du temps supprimées.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

// 9. Create a timetable entry (Manual addition)
const createTimetableEntry = async (req, res, next) => {
  try {
    const {
      day,
      hour,
      division,
      subjectCode,
      subjectName,
      teacherName,
      room,
      group,
      modality,
      regr,
      remarks,
      academicYear = '2025-2026',
    } = req.body;

    if (!day || !hour || !division || !subjectCode || !teacherName) {
      return res.status(400).json({
        message: 'الحقول التالية إجبارية: اليوم، التوقيت، القسم، المادة، والأستاذ(ة).',
      });
    }

    const trimmedDay = (day || '').trim();
    const trimmedHour = (hour || '').trim().toUpperCase();
    const trimmedDivision = (division || '').trim();
    const trimmedSubjectCode = (subjectCode || '').trim().toUpperCase();
    const trimmedTeacherName = (teacherName || '').trim();

    const entry = new TimetableEntry({
      academicYear,
      day: trimmedDay,
      dayArabic: DAY_MAP[trimmedDay] || trimmedDay,
      hour: trimmedHour,
      timeSlot: TIME_SLOT_MAP[trimmedHour] || trimmedHour,
      division: trimmedDivision,
      divisionArabic: DIVISION_MAP[trimmedDivision] || trimmedDivision,
      subjectCode: trimmedSubjectCode,
      subjectName: subjectName || SUBJECT_MAP[trimmedSubjectCode]?.arabic || trimmedSubjectCode,
      teacherName: trimmedTeacherName,
      room: (room || '').trim(),
      group: (group || '').trim(),
      modality: (modality || 'CG').trim().toUpperCase(),
      regr: (regr || '').trim(),
      remarks: (remarks || '').trim(),
    });

    const saved = await entry.save();
    res.status(201).json({
      message: 'تم إضافة الحصة بنجاح.',
      entry: saved,
    });
  } catch (error) {
    next(error);
  }
};

// 10. Update a timetable entry (Manual edit)
const updateTimetableEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const entry = await TimetableEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ message: 'الحصة الدراسية غير موجودة.' });
    }

    const {
      day,
      hour,
      division,
      subjectCode,
      subjectName,
      teacherName,
      room,
      group,
      modality,
      regr,
      remarks,
      academicYear,
    } = req.body;

    if (day !== undefined) {
      entry.day = (day || '').trim();
      entry.dayArabic = DAY_MAP[entry.day] || entry.day;
    }
    if (hour !== undefined) {
      entry.hour = (hour || '').trim().toUpperCase();
      entry.timeSlot = TIME_SLOT_MAP[entry.hour] || entry.hour;
    }
    if (division !== undefined) {
      entry.division = (division || '').trim();
      entry.divisionArabic = DIVISION_MAP[entry.division] || entry.division;
    }
    if (subjectCode !== undefined) {
      entry.subjectCode = (subjectCode || '').trim().toUpperCase();
      entry.subjectName = subjectName || SUBJECT_MAP[entry.subjectCode]?.arabic || entry.subjectCode;
    } else if (subjectName !== undefined) {
      entry.subjectName = subjectName;
    }
    if (teacherName !== undefined) entry.teacherName = (teacherName || '').trim();
    if (room !== undefined) entry.room = (room || '').trim();
    if (group !== undefined) entry.group = (group || '').trim();
    if (modality !== undefined) entry.modality = (modality || 'CG').trim().toUpperCase();
    if (regr !== undefined) entry.regr = (regr || '').trim();
    if (remarks !== undefined) entry.remarks = (remarks || '').trim();
    if (academicYear !== undefined) entry.academicYear = (academicYear || '').trim();

    const updated = await entry.save();
    res.status(200).json({
      message: 'تم تعديل الحصة بنجاح.',
      entry: updated,
    });
  } catch (error) {
    next(error);
  }
};

// 11. Delete a timetable entry (Manual delete)
const deleteTimetableEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await TimetableEntry.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'الحصة الدراسية غير موجودة.' });
    }
    res.status(200).json({
      message: 'تم حذف الحصة الدراسية بنجاح.',
      id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  importTimetableExcel,
  getTimetableByDivision,
  getTimetableByTeacher,
  getTimetableByRoom,
  getMyTimetable,
  getChildTimetable,
  getTimetableMetadata,
  clearTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
};
