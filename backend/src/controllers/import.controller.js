const xlsx = require('xlsx');
const User = require('../models/user.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const Class = require('../models/class.model');
const Group = require('../models/group.model');
const path = require('path');
const fs = require('fs');

// Helper to sanitize strings
const cleanStr = (val) => (val !== undefined && val !== null ? String(val).trim() : '');

// Helper to parse dates (handles YYYY-MM-DD strings and Excel serial date numbers)
const parseExcelDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'number') {
    // Excel base date: 1899-12-30
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(date.getTime()) ? null : date;
  }
  const str = String(val).trim();
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

const formatDateToISO = (date) => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

// Process Excel Import of Students (School Story Template)
const importStudentsExcel = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Veuillez téléverser un fichier Excel valide (.xls ou .xlsx)' });
    }

    const previewOnly = req.body.previewOnly === 'true' || req.body.previewOnly === true;

    // Read workbook from buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });

    // 1. Process "Classes" sheet if present
    const classesCreated = [];
    const classesSheetName = workbook.SheetNames.find((s) => s.trim().toLowerCase() === 'classes');
    if (classesSheetName) {
      const classesData = xlsx.utils.sheet_to_json(workbook.Sheets[classesSheetName], { defval: '' });
      for (const row of classesData) {
        const className = cleanStr(row['اسم القسم'] || row['اسم_القسم'] || row['القسم']);
        const classCode = cleanStr(row['رمز القسم'] || row['رمز_القسم'] || row['Code'] || className);

        if (classCode || className) {
          const finalName = classCode || className;
          let level = 'middle';
          const upper = finalName.toUpperCase();
          if (upper.includes('AS') || upper.includes('S') || upper.includes('L') || upper.includes('SE') || upper.includes('MT') || upper.includes('GE')) {
            level = 'secondary';
          } else if (upper.includes('AP') || upper.includes('PRIMAIRE')) {
            level = 'primary';
          }

          if (!previewOnly) {
            let existingClass = await Class.findOne({
              $or: [{ name: finalName }, { name: className }],
            });

            if (!existingClass) {
              existingClass = await Class.create({
                name: finalName,
                description: className !== finalName ? className : `Classe ${finalName}`,
                level,
              });
              classesCreated.push(existingClass.name);
            }

            // Ensure at least one group exists
            let defaultGroup = await Group.findOne({ class: existingClass._id });
            if (!defaultGroup) {
              await Group.create({
                name: 'Groupe 1',
                class: existingClass._id,
              });
            }
          } else {
            classesCreated.push(finalName);
          }
        }
      }
    }

    // 2. Process "قائمة التلاميذ" sheet (or the first sheet by default)
    let studentsSheetName = workbook.SheetNames.find((s) =>
      s.includes('التلاميذ') || s.includes('طلاب') || s.includes('Students')
    );
    if (!studentsSheetName) {
      studentsSheetName = workbook.SheetNames[0];
    }

    const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[studentsSheetName], { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({
        message: `La feuille « ${studentsSheetName} » ne contient aucune ligne de données à importer.`,
      });
    }

    const results = {
      totalRows: rawRows.length,
      importedCount: 0,
      updatedCount: 0,
      errorsCount: 0,
      classesCreatedCount: classesCreated.length,
      errors: [],
      preview: [],
    };

    // Pre-cache classes
    const existingClassesList = await Class.find();
    const classMap = new Map();
    existingClassesList.forEach((c) => {
      classMap.set(c.name.trim().toLowerCase(), c);
    });

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 2; // header is row 1

      // Helper to find column regardless of exact spaces
      const getVal = (keys) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== '') return cleanStr(row[k]);
          const found = Object.keys(row).find((rk) => rk.replace(/\s+/g, '').includes(k.replace(/\s+/g, '')));
          if (found && row[found] !== undefined && row[found] !== '') return cleanStr(row[found]);
        }
        return '';
      };

      const nationalId = getVal(['رقم التعريف ( الرقمنة )', 'رقم التعريف', 'الرقمنة', 'NationalId', 'ID']);
      const lastNameAr = getVal(['اللقب']);
      const firstNameAr = getVal(['الاسم']);
      const lastNameFr = getVal(['اللقب بالأجنبي', 'اللقب بالفرنسية', 'Nom']);
      const firstNameFr = getVal(['الاسم بالأجنبي', 'الاسم بالفرنسية', 'Prenom']);
      const gender = getVal(['الجنس', 'Sexe']);
      const rawDob = row['تاريخ الميلاد(yyyy-mm-dd)'] || row['تاريخ الميلاد'] || row['DateNaissance'];
      const dob = parseExcelDate(rawDob);
      const placeOfBirth = getVal(['مكان الميلاد', 'LieuNaissance']);
      const academicYear = getVal(['السنة', 'السنة الدراسية']) || '2026-2027';
      const className = getVal(['القسم', 'اسم القسم', 'Classe']);
      const rawRegDate = row['تاريخ التسجيل(yyyy-mm-dd)'] || row['تاريخ التسجيل'];
      const regDate = parseExcelDate(rawRegDate) || new Date();
      const fatherNameAr = getVal(['اسم الأب']);
      const fatherNameFr = getVal(['اسم الأب بالأجنبي']);
      const fatherPhone = getVal(['هاتف الأب']).replace(/[^0-9]/g, '');
      const motherNameAr = getVal(['اسم الأم']);
      const motherNameFr = getVal(['اسم الأم بالأجنبي']);
      const motherPhone = getVal(['هاتف الأم']).replace(/[^0-9]/g, '');
      const studentPhone = getVal(['هاتف الطالب']).replace(/[^0-9]/g, '');
      const address = getVal(['العنوان', 'Adresse']);

      // Validations
      if (!nationalId && !firstNameAr && !lastNameAr && !firstNameFr && !lastNameFr) {
        // empty row, skip
        continue;
      }

      if (!nationalId) {
        results.errors.push({
          row: rowNum,
          name: `${firstNameAr || firstNameFr} ${lastNameAr || lastNameFr}`,
          error: 'رقم التعريف (الرقمنة) مفقود أو غير محدد',
        });
        results.errorsCount++;
        continue;
      }

      if (!className) {
        results.errors.push({
          row: rowNum,
          nationalId,
          name: `${firstNameAr || firstNameFr} ${lastNameAr || lastNameFr}`,
          error: 'اسم القسم غير محدد في ملف الإكسل',
        });
        results.errorsCount++;
        continue;
      }

      const formattedDob = dob ? formatDateToISO(dob) : '2015-01-01';

      if (previewOnly) {
        // Just build preview row
        const existingStudent = await Student.findOne({ nationalIdDigitization: nationalId });
        results.preview.push({
          row: rowNum,
          nationalId,
          fullNameAr: `${firstNameAr} ${lastNameAr}`.trim(),
          fullNameFr: `${firstNameFr} ${lastNameFr}`.trim(),
          gender: gender || 'ذكر',
          className,
          dob: formattedDob,
          fatherPhone,
          motherPhone,
          status: existingStudent ? 'Mise à jour (Existant)' : 'Nouveau',
        });
        continue;
      }

      // --- EXECUTE REAL IMPORT ---
      try {
        // 1. Resolve or create Class and Group
        const classKey = className.toLowerCase();
        let targetClass = classMap.get(classKey);
        if (!targetClass) {
          targetClass = await Class.findOne({ name: { $regex: new RegExp(`^${className}$`, 'i') } });
          if (!targetClass) {
            let level = 'middle';
            const upper = className.toUpperCase();
            if (upper.includes('AS') || upper.includes('S') || upper.includes('L') || upper.includes('SE')) {
              level = 'secondary';
            } else if (upper.includes('AP')) {
              level = 'primary';
            }
            targetClass = await Class.create({
              name: className,
              description: `Division ${className}`,
              level,
            });
          }
          classMap.set(classKey, targetClass);
        }

        let targetGroup = await Group.findOne({ class: targetClass._id });
        if (!targetGroup) {
          targetGroup = await Group.create({
            name: 'Groupe 1',
            class: targetClass._id,
          });
        }

        // 2. Resolve or create Parent Account
        const primaryPhone = fatherPhone || motherPhone || `055000${String(nationalId).slice(-4)}`;
        let parentUser = await User.findOne({
          $or: [{ phoneNumber: primaryPhone }, { username: `parent_${primaryPhone}` }],
        });

        let parentProfile = null;
        if (!parentUser) {
          const parentFullNameFr = (fatherNameFr || motherNameFr || 'Parent').trim();
          const parentFullNameAr = (fatherNameAr || motherNameAr || 'ولي أمر').trim();
          const parentLastName = (lastNameFr || lastNameAr || 'Zitouni').trim();

          parentUser = await User.create({
            username: `parent_${primaryPhone}`,
            email: `parent_${primaryPhone}@ecole-zitouni.dz`,
            password: primaryPhone, // Default password = phone number as required
            firstName: parentFullNameFr || parentFullNameAr,
            lastName: parentLastName,
            firstNameArabic: parentFullNameAr,
            lastNameArabic: lastNameAr,
            firstNameFrench: parentFullNameFr,
            lastNameFrench: lastNameFr,
            role: 'parent',
            phoneNumber: primaryPhone,
            isActive: true,
          });

          parentProfile = await Parent.create({
            user: parentUser._id,
            fatherNameArabic: fatherNameAr,
            fatherNameFrench: fatherNameFr,
            fatherPhone: fatherPhone,
            motherNameArabic: motherNameAr,
            motherNameFrench: motherNameFr,
            motherPhone: motherPhone,
            address: address,
            children: [],
          });
        } else {
          parentProfile = await Parent.findOne({ user: parentUser._id });
          if (parentProfile) {
            if (fatherPhone && !parentProfile.fatherPhone) parentProfile.fatherPhone = fatherPhone;
            if (motherPhone && !parentProfile.motherPhone) parentProfile.motherPhone = motherPhone;
            if (address && !parentProfile.address) parentProfile.address = address;
            await parentProfile.save();
          }
        }

        // 3. Create or update Student User & Profile
        const studentUsername = `std_${nationalId}`;
        const studentPassword = formattedDob; // Default password = Date of Birth (YYYY-MM-DD)

        let studentUser = await User.findOne({
          $or: [{ username: studentUsername }, { email: `${studentUsername}@ecole-zitouni.dz` }],
        });

        const effectiveFirstAr = firstNameAr || firstNameFr || 'تلميذ';
        const effectiveLastAr = lastNameAr || lastNameFr || 'متمدرس';
        const effectiveFirstFr = firstNameFr || firstNameAr || 'Eleve';
        const effectiveLastFr = lastNameFr || lastNameAr || 'Zitouni';

        if (!studentUser) {
          studentUser = await User.create({
            username: studentUsername,
            email: `${studentUsername}@ecole-zitouni.dz`,
            password: studentPassword,
            firstName: effectiveFirstFr,
            lastName: effectiveLastFr,
            firstNameArabic: effectiveFirstAr,
            lastNameArabic: effectiveLastAr,
            firstNameFrench: effectiveFirstFr,
            lastNameFrench: effectiveLastFr,
            role: 'student',
            phoneNumber: studentPhone || primaryPhone,
            isActive: true,
          });
        }

        let studentProfile = await Student.findOne({ nationalIdDigitization: nationalId });
        let isUpdate = false;

        if (studentProfile) {
          isUpdate = true;
          studentProfile.user = studentUser._id;
          studentProfile.firstNameArabic = effectiveFirstAr;
          studentProfile.lastNameArabic = effectiveLastAr;
          studentProfile.firstNameFrench = effectiveFirstFr;
          studentProfile.lastNameFrench = effectiveLastFr;
          studentProfile.gender = gender || studentProfile.gender;
          studentProfile.dateOfBirth = dob || studentProfile.dateOfBirth;
          studentProfile.placeOfBirth = placeOfBirth || studentProfile.placeOfBirth;
          studentProfile.class = targetClass._id;
          studentProfile.group = targetGroup._id;
          studentProfile.parent = parentProfile ? parentProfile._id : studentProfile.parent;
          studentProfile.studentPhone = studentPhone || studentProfile.studentPhone;
          studentProfile.address = address || studentProfile.address;
          await studentProfile.save();
          results.updatedCount++;
        } else {
          studentProfile = await Student.create({
            user: studentUser._id,
            nationalIdDigitization: nationalId,
            registrationNumber: nationalId,
            firstNameArabic: effectiveFirstAr,
            lastNameArabic: effectiveLastAr,
            firstNameFrench: effectiveFirstFr,
            lastNameFrench: effectiveLastFr,
            gender: gender || 'ذكر',
            dateOfBirth: dob || new Date('2015-01-01'),
            placeOfBirth,
            academicYear,
            registrationDate: regDate,
            registrationStatus: 'accepted',
            class: targetClass._id,
            group: targetGroup._id,
            parent: parentProfile ? parentProfile._id : null,
            studentPhone,
            address,
          });
          results.importedCount++;
        }

        // Link student to parent's children array if not already linked
        if (parentProfile && !parentProfile.children.some((cid) => cid.toString() === studentProfile._id.toString())) {
          parentProfile.children.push(studentProfile._id);
          await parentProfile.save();
        }
      } catch (err) {
        results.errors.push({
          row: rowNum,
          nationalId,
          name: `${firstNameAr || firstNameFr} ${lastNameAr || lastNameFr}`,
          error: err.message,
        });
        results.errorsCount++;
      }
    }

    res.status(200).json({
      success: true,
      previewOnly,
      summary: results,
      message: previewOnly
        ? `Prévisualisation terminée : ${results.preview.length} élèves analysés.`
        : `Importation terminée : ${results.importedCount} élèves créés, ${results.updatedCount} mis à jour, ${results.errorsCount} erreurs.`,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/import/students-template
const downloadStudentTemplate = (req, res, next) => {
  try {
    const templatePath = 'C:\\Users\\PC\\Downloads\\zitouniswaleh\\ملف_استيراد_الطلاب_سكول_ستوري_xlsx_3.xls';
    if (fs.existsSync(templatePath)) {
      return res.download(templatePath, 'modele_import_eleves_school_story.xls');
    }
    return res.status(404).json({ message: 'Fichier modèle introuvable' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  importStudentsExcel,
  downloadStudentTemplate,
};
