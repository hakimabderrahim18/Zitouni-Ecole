const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Determine available font for Arabic / Latin rendering
const getFontPath = () => {
  const winArial = 'C:\\Windows\\Fonts\\arial.ttf';
  if (fs.existsSync(winArial)) return winArial;
  return null;
};

const getBoldFontPath = () => {
  const winArialBold = 'C:\\Windows\\Fonts\\arialbd.ttf';
  if (fs.existsSync(winArialBold)) return winArialBold;
  return null;
};

/**
 * Generates an Individual Assessment Report Card PDF
 */
const generateIndividualReportCardPDF = (assessment, studentRecord, schoolSettings = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks = [];

      const fontRegular = getFontPath();
      const fontBold = getBoldFontPath();
      if (fontRegular) doc.registerFont('CustomRegular', fontRegular);
      if (fontBold) doc.registerFont('CustomBold', fontBold);

      const fName = (bold = false) => {
        if (bold && fontBold) return 'CustomBold';
        if (fontRegular) return 'CustomRegular';
        return bold ? 'Helvetica-Bold' : 'Helvetica';
      };

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // School Official Header
      const schoolNameAr = schoolSettings.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة';
      const schoolNameFr = schoolSettings.schoolNameFrench || 'Groupe scolaire Encre & Pastel';
      const appName = schoolSettings.schoolNameArabic || 'مدرسة حبر';
      const location = schoolSettings.location || 'أولاد فايت - الجزائر غرب';
      const phone = schoolSettings.contactPhone || '0554075701';

      // Top decorative bar
      doc.rect(40, 40, 515, 6).fill('#7B1E3A');

      // School Identity
      doc.y = 55;
      doc
        .font(fName(true))
        .fontSize(14)
        .fillColor('#7B1E3A')
        .text(schoolNameAr, { align: 'center' });

      doc
        .font(fName(false))
        .fontSize(10)
        .fillColor('#64748b')
        .text(`${appName} | ${schoolNameFr}`, { align: 'center' })
        .text(`${location} - هاتف: ${phone}`, { align: 'center' });

      doc.moveDown(0.8);
      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.8);

      // Title Box
      const titleBoxY = doc.y;
      doc.rect(40, titleBoxY, 515, 34).fill('#f8fafc').strokeColor('#cbd5e1').stroke();
      doc
        .font(fName(true))
        .fontSize(13)
        .fillColor('#1e293b')
        .text('كشف نقاط تقييم رسمي / BULLETIN DE NOTES', 40, titleBoxY + 8, { align: 'center', width: 515 });

      doc.y = titleBoxY + 45;

      // Metadata Info Grid
      const student = studentRecord.student || {};
      const studentUser = student.user || studentRecord.studentUser || {};
      const studentName = `${studentUser.firstNameArabic || studentUser.firstName || ''} ${studentUser.lastNameArabic || studentUser.lastName || ''}`.trim() || `${student.firstNameArabic || ''} ${student.lastNameArabic || ''}`.trim() || 'تلميذ';
      const studentNameFr = `${studentUser.firstNameFrench || studentUser.firstName || ''} ${studentUser.lastNameFrench || studentUser.lastName || ''}`.trim();
      const regNo = student.registrationNumber || student.nationalIdDigitization || 'غير محدد';
      const className = assessment.class?.name || 'القسم';
      const cycleName = assessment.cycle === 'primary' ? 'الطور الابتدائي' : assessment.cycle === 'middle' ? 'الطور المتوسط' : assessment.cycle === 'secondary' ? 'الطور الثانوي' : assessment.cycle || '';
      const subject = assessment.subject || '';
      const teacherName = assessment.teacherUser ? `${assessment.teacherUser.firstName || ''} ${assessment.teacherUser.lastName || ''}`.trim() : 'الأستاذ';
      const assessType = assessment.assessmentType || 'الفرض الأول';
      const assessDate = assessment.assessmentDate ? new Date(assessment.assessmentDate).toLocaleDateString('fr-DZ') : new Date().toLocaleDateString('fr-DZ');

      const infoBoxY = doc.y;
      doc.rect(40, infoBoxY, 515, 90).fill('#ffffff').strokeColor('#e2e8f0').stroke();

      doc.font(fName(true)).fontSize(10).fillColor('#334155');
      doc.text(`التلميذ: ${studentName} (${studentNameFr})`, 50, infoBoxY + 10, { width: 240 });
      doc.text(`رقم التسجيل: ${regNo}`, 310, infoBoxY + 10, { width: 230 });

      doc.font(fName(false)).fontSize(9.5).fillColor('#475569');
      doc.text(`القسم: ${className} (${cycleName})`, 50, infoBoxY + 32, { width: 240 });
      doc.text(`السنة الدراسية: ${assessment.academicYear || '2026-2027'}`, 310, infoBoxY + 32, { width: 230 });

      doc.text(`المادة: ${subject}`, 50, infoBoxY + 54, { width: 240 });
      doc.text(`الأستاذ المكلّف: ${teacherName}`, 310, infoBoxY + 54, { width: 230 });

      doc.text(`نوع التقييم: ${assessType}`, 50, infoBoxY + 74, { width: 240 });
      doc.text(`تاريخ الإجراء: ${assessDate}`, 310, infoBoxY + 74, { width: 230 });

      doc.y = infoBoxY + 105;

      // Score Highlight Card
      const scoreCardY = doc.y;
      const isAbsent = studentRecord.isAbsent;
      const grade = studentRecord.grade != null ? Number(studentRecord.grade).toFixed(2) : '--';
      const isPass = !isAbsent && studentRecord.grade >= 10;

      doc.rect(40, scoreCardY, 515, 65).fill(isAbsent ? '#fef2f2' : isPass ? '#f0fdf4' : '#fffbeb').strokeColor(isAbsent ? '#fca5a5' : isPass ? '#86efac' : '#fde68a').stroke();

      doc
        .font(fName(true))
        .fontSize(11)
        .fillColor('#1e293b')
        .text('العلامة المحصل عليها / Note Obtenue', 55, scoreCardY + 12);

      const scoreText = isAbsent ? 'غائب / Absent' : `${grade} / ${assessment.maxGrade || 20}`;
      doc
        .font(fName(true))
        .fontSize(22)
        .fillColor(isAbsent ? '#dc2626' : isPass ? '#15803d' : '#d97706')
        .text(scoreText, 55, scoreCardY + 30);

      // Status pill / evaluation level
      let mention = 'مستوى متوسط';
      if (isAbsent) mention = 'غياب مبرر/غير مبرر';
      else if (studentRecord.grade >= 16) mention = 'ممتاز / Très Bien';
      else if (studentRecord.grade >= 14) mention = 'جيد جداً / Bien';
      else if (studentRecord.grade >= 12) mention = 'جيد / Assez Bien';
      else if (studentRecord.grade >= 10) mention = 'مقبول / Passable';
      else mention = 'دون المتوسط / Insuffisant';

      doc
        .font(fName(true))
        .fontSize(11)
        .fillColor('#475569')
        .text(`التقدير العام: ${mention}`, 300, scoreCardY + 36, { align: 'right', width: 240 });

      doc.y = scoreCardY + 80;

      // Individual & Class Remarks Section
      const remarkBoxY = doc.y;
      doc.rect(40, remarkBoxY, 515, 110).fill('#ffffff').strokeColor('#cbd5e1').stroke();

      doc.font(fName(true)).fontSize(10.5).fillColor('#7B1E3A').text('ملاحظات الأستاذ والتقييم التربوي:', 55, remarkBoxY + 10);

      doc.font(fName(true)).fontSize(9.5).fillColor('#1e293b').text('• الملاحظة الفردية للتلميذ:', 55, remarkBoxY + 30);
      doc.font(fName(false)).fontSize(9.5).fillColor('#334155').text(studentRecord.individualRemark || 'لا توجد ملاحظة مدونة.', 70, remarkBoxY + 46, { width: 460 });

      doc.font(fName(true)).fontSize(9.5).fillColor('#1e293b').text('• الملاحظة العامة للقسم (بخصوص هذا الفرض):', 55, remarkBoxY + 68);
      doc.font(fName(false)).fontSize(9.5).fillColor('#334155').text(assessment.classRemark || 'لا توجد ملاحظة عامة مدونة للقسم.', 70, remarkBoxY + 84, { width: 460 });

      doc.y = remarkBoxY + 125;

      // Class Statistics Reference Box
      const presentRecords = (assessment.records || []).filter((r) => !r.isAbsent && r.grade != null);
      let avg = '--';
      let maxScore = '--';
      let minScore = '--';
      if (presentRecords.length > 0) {
        const grades = presentRecords.map((r) => r.grade);
        avg = (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2);
        maxScore = Math.max(...grades).toFixed(2);
        minScore = Math.min(...grades).toFixed(2);
      }

      const statsY = doc.y;
      doc.rect(40, statsY, 515, 45).fill('#f1f5f9').strokeColor('#cbd5e1').stroke();
      doc.font(fName(true)).fontSize(9.5).fillColor('#334155');
      doc.text(`معدل القسم في هذا الفرض: ${avg} / 20`, 55, statsY + 16);
      doc.text(`أعلى علامة في القسم: ${maxScore}`, 240, statsY + 16);
      doc.text(`أدنى علامة في القسم: ${minScore}`, 400, statsY + 16);

      // Signatures & Stamp area
      const sigY = statsY + 70;
      doc.font(fName(true)).fontSize(10).fillColor('#1e293b');
      doc.text('تأشيرة وتوقيع الأستاذ(ة):', 70, sigY);
      doc.text('ختم وتأشيرة إدارة المؤسسة:', 360, sigY);

      doc.rect(55, sigY + 20, 160, 50).strokeColor('#cbd5e1').stroke();
      doc.rect(345, sigY + 20, 160, 50).strokeColor('#cbd5e1').stroke();

      // Footer note
      doc
        .font(fName(false))
        .fontSize(8)
        .fillColor('#94a3b8')
        .text('وثيقة رسمية صادرة عبر منصة مدرسة حبر - مؤسسة حبر وألوان | Ouled Fayet, Algiers', 40, 780, {
          align: 'center',
          width: 515,
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generates a Collective Class Assessment Report Card PDF
 */
const generateCollectiveReportCardPDF = (assessment, schoolSettings = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'portrait' });
      const chunks = [];

      const fontRegular = getFontPath();
      const fontBold = getBoldFontPath();
      if (fontRegular) doc.registerFont('CustomRegular', fontRegular);
      if (fontBold) doc.registerFont('CustomBold', fontBold);

      const fName = (bold = false) => {
        if (bold && fontBold) return 'CustomBold';
        if (fontRegular) return 'CustomRegular';
        return bold ? 'Helvetica-Bold' : 'Helvetica';
      };

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const schoolNameAr = schoolSettings.institutionName || 'مؤسسة التربية والتعليم حبر وألوان الخاصة';
      const className = assessment.class?.name || 'القسم';
      const subject = assessment.subject || '';
      const teacherName = assessment.teacherUser ? `${assessment.teacherUser.firstName || ''} ${assessment.teacherUser.lastName || ''}`.trim() : 'الأستاذ';
      const assessType = assessment.assessmentType || 'الفرض';
      const assessDate = assessment.assessmentDate ? new Date(assessment.assessmentDate).toLocaleDateString('fr-DZ') : '';

      // Header Banner
      doc.rect(30, 25, 535, 5).fill('#7B1E3A');
      doc.y = 35;
      doc.font(fName(true)).fontSize(12).fillColor('#7B1E3A').text(schoolNameAr, { align: 'center' });
      doc.font(fName(true)).fontSize(13).fillColor('#0f172a').text(`كشف نقاط جماعي - ${assessType}`, { align: 'center' });

      // Subheader Grid
      const subY = doc.y + 4;
      doc.rect(30, subY, 535, 26).fill('#f8fafc').strokeColor('#cbd5e1').stroke();
      doc.font(fName(true)).fontSize(9).fillColor('#334155');
      doc.text(`القسم: ${className}`, 40, subY + 8);
      doc.text(`المادة: ${subject}`, 150, subY + 8);
      doc.text(`الأستاذ: ${teacherName}`, 270, subY + 8);
      doc.text(`التاريخ: ${assessDate}`, 430, subY + 8);

      // Student Table Header
      let tableY = subY + 34;
      doc.rect(30, tableY, 535, 20).fill('#1e293b');
      doc.font(fName(true)).fontSize(8.5).fillColor('#ffffff');
      doc.text('الرقم', 35, tableY + 6, { width: 30, align: 'center' });
      doc.text('اسم ولقب التلميذ', 70, tableY + 6, { width: 170 });
      doc.text('رقم التسجيل', 245, tableY + 6, { width: 85 });
      doc.text('العلامة / 20', 335, tableY + 6, { width: 65, align: 'center' });
      doc.text('الملاحظة الفردية', 405, tableY + 6, { width: 155 });

      tableY += 20;

      const records = assessment.records || [];
      const rowHeight = 18;

      records.forEach((rec, idx) => {
        // Page break handling
        if (tableY > 740) {
          doc.addPage();
          tableY = 35;
          // Re-draw table header
          doc.rect(30, tableY, 535, 20).fill('#1e293b');
          doc.font(fName(true)).fontSize(8.5).fillColor('#ffffff');
          doc.text('الرقم', 35, tableY + 6, { width: 30, align: 'center' });
          doc.text('اسم ولقب التلميذ', 70, tableY + 6, { width: 170 });
          doc.text('رقم التسجيل', 245, tableY + 6, { width: 85 });
          doc.text('العلامة / 20', 335, tableY + 6, { width: 65, align: 'center' });
          doc.text('الملاحظة الفردية', 405, tableY + 6, { width: 155 });
          tableY += 20;
        }

        const isEven = idx % 2 === 0;
        doc.rect(30, tableY, 535, rowHeight).fill(isEven ? '#ffffff' : '#f8fafc').strokeColor('#e2e8f0').stroke();

        const st = rec.student || {};
        const u = st.user || rec.studentUser || {};
        const name = `${u.firstNameArabic || u.firstName || ''} ${u.lastNameArabic || u.lastName || ''}`.trim() || `${st.firstNameArabic || ''} ${st.lastNameArabic || ''}`.trim() || `تلميذ ${idx + 1}`;
        const regNo = st.registrationNumber || st.nationalIdDigitization || '-';

        let gradeStr = '--';
        if (rec.isAbsent) gradeStr = 'غائب';
        else if (rec.grade != null) gradeStr = Number(rec.grade).toFixed(2);

        doc.font(fName(false)).fontSize(8).fillColor('#334155');
        doc.text(String(idx + 1).padStart(2, '0'), 35, tableY + 5, { width: 30, align: 'center' });
        doc.font(fName(true)).text(name, 70, tableY + 5, { width: 170 });
        doc.font(fName(false)).text(regNo, 245, tableY + 5, { width: 85 });

        // Grade with colored emphasis
        if (rec.isAbsent) {
          doc.font(fName(true)).fillColor('#dc2626').text(gradeStr, 335, tableY + 5, { width: 65, align: 'center' });
        } else if (rec.grade >= 10) {
          doc.font(fName(true)).fillColor('#15803d').text(gradeStr, 335, tableY + 5, { width: 65, align: 'center' });
        } else {
          doc.font(fName(true)).fillColor('#b45309').text(gradeStr, 335, tableY + 5, { width: 65, align: 'center' });
        }

        doc.font(fName(false)).fillColor('#475569').text(rec.individualRemark || '-', 405, tableY + 5, { width: 155 });

        tableY += rowHeight;
      });

      // Bottom Section: Class General Remark + Summary Stats
      if (tableY > 670) {
        doc.addPage();
        tableY = 40;
      } else {
        tableY += 10;
      }

      // Class Remark Box
      doc.rect(30, tableY, 535, 34).fill('#f1f5f9').strokeColor('#cbd5e1').stroke();
      doc.font(fName(true)).fontSize(8.5).fillColor('#7B1E3A').text('الملاحظة العامة للقسم:', 40, tableY + 6);
      doc.font(fName(false)).fontSize(8.5).fillColor('#1e293b').text(assessment.classRemark || 'لا توجد ملاحظة عامة مدونة للقسم.', 40, tableY + 18, { width: 515 });

      tableY += 40;

      // Stats calculations
      const presentRecords = records.filter((r) => !r.isAbsent && r.grade != null);
      let avg = '--', maxScore = '--', minScore = '--', passCount = 0, failCount = 0, passRate = '0%';
      if (presentRecords.length > 0) {
        const grades = presentRecords.map((r) => r.grade);
        avg = (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2);
        maxScore = Math.max(...grades).toFixed(2);
        minScore = Math.min(...grades).toFixed(2);
        passCount = grades.filter((g) => g >= 10).length;
        failCount = grades.length - passCount;
        passRate = `${((passCount / grades.length) * 100).toFixed(1)}%`;
      }

      doc.rect(30, tableY, 535, 30).fill('#f8fafc').strokeColor('#cbd5e1').stroke();
      doc.font(fName(true)).fontSize(8.5).fillColor('#1e293b');
      doc.text(`المعدل العام: ${avg} / 20`, 40, tableY + 10);
      doc.text(`أعلى علامة: ${maxScore}`, 150, tableY + 10);
      doc.text(`أدنى علامة: ${minScore}`, 240, tableY + 10);
      doc.text(`عدد المحققين للمعدل: ${passCount} / ${presentRecords.length} (${passRate})`, 330, tableY + 10);

      tableY += 40;

      // Signature row
      doc.font(fName(true)).fontSize(9).fillColor('#334155');
      doc.text('توقيع الأستاذ(ة):', 60, tableY);
      doc.text('تأشيرة مدير المؤسسة:', 400, tableY);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateIndividualReportCardPDF,
  generateCollectiveReportCardPDF,
};
