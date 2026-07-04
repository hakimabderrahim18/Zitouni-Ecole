const Course = require('../models/course.model');
const Attendance = require('../models/attendance.model');
const Announcement = require('../models/announcement.model');
const Student = require('../models/student.model');
const Teacher = require('../models/teacher.model');
const cloudinaryService = require('../services/cloudinary.service');
const { notifyForCourse } = require('../services/notification.service');

// Upload Course materials
const uploadCourse = async (req, res, next) => {
  const { title, description, subject, classId, groupId } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Cloudinary upload
    const uploadResult = await cloudinaryService.uploadBuffer(req.file.buffer, 'zitouni_courses');

    const course = await Course.create({
      title,
      description,
      subject,
      fileUrl: uploadResult.secure_url,
      fileName: req.file.originalname,
      class: classId,
      group: groupId || null,
      teacher: teacher._id,
    });

    // Trigger notification
    notifyForCourse(course);

    res.status(201).json({ message: 'Course uploaded successfully', course });
  } catch (error) {
    next(error);
  }
};

// Delete course material
const deleteCourse = async (req, res, next) => {
  const { courseId } = req.params;

  try {
    const teacher = await Teacher.findOne({ user: req.user.id });
    const course = await Course.findOneAndDelete({ _id: courseId, teacher: teacher._id });

    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized' });
    }

    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Manage attendance log sheets
const markAttendance = async (req, res, next) => {
  const { classId, groupId, date, records } = req.body; // records: [{ studentId, status, remarks }]

  try {
    const savedRecords = [];

    for (const record of records) {
      const attendance = await Attendance.findOneAndUpdate(
        { student: record.studentId, date: new Date(date) },
        {
          class: classId,
          group: groupId,
          status: record.status,
          remarks: record.remarks || '',
          recordedBy: req.user.id,
        },
        { new: true, upsert: true }
      );
      savedRecords.push(attendance);
    }

    res.status(200).json({ message: 'Attendance marked successfully', savedRecords });
  } catch (error) {
    next(error);
  }
};

// Broadcast local Announcement
const postAnnouncement = async (req, res, next) => {
  const { title, content, classId, groupId } = req.body;

  try {
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    const announcement = await Announcement.create({
      title,
      content,
      publisher: req.user.id,
      publisherRole: 'teacher',
      isGlobal: false,
      targetClass: classId,
      targetGroup: groupId || null,
    });

    res.status(201).json({ message: 'Announcement published successfully', announcement });
  } catch (error) {
    next(error);
  }
};

// Get pupils assigned to teacher's rooms
const getAssignedStudents = async (req, res, next) => {
  const { classId, groupId } = req.params;

  try {
    const students = await Student.find({ class: classId, group: groupId })
      .populate('user', 'firstName lastName email phoneNumber profilePic')
      .populate('class group');

    res.status(200).json(students);
  } catch (error) {
    next(error);
  }
};

// Get teacher's uploaded courses
const getCourses = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    const courses = await Course.find({ teacher: teacher._id })
      .populate('class group')
      .sort({ createdAt: -1 });

    res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
};

// Get list of past attendance sheets recorded for the teacher's assigned classes/groups
const getAttendanceHistory = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    const history = await Attendance.aggregate([
      { 
        $match: { 
          class: { $in: teacher.classes },
          group: { $in: teacher.groups }
        } 
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            class: "$class",
            group: "$group"
          },
          presentCount: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
          absentCount: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
          lateCount: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
          excusedCount: { $sum: { $cond: [{ $eq: ["$status", "Excused"] }, 1, 0] } },
          totalCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: '_id.class',
          foreignField: '_id',
          as: 'classDetail'
        }
      },
      {
        $lookup: {
          from: 'groups',
          localField: '_id.group',
          foreignField: '_id',
          as: 'groupDetail'
        }
      },
      {
        $unwind: { path: '$classDetail', preserveNullAndEmptyArrays: true }
      },
      {
        $unwind: { path: '$groupDetail', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 0,
          date: '$_id.date',
          classId: '$_id.class',
          groupId: '$_id.group',
          className: '$classDetail.name',
          groupName: '$groupDetail.name',
          presentCount: 1,
          absentCount: 1,
          lateCount: 1,
          excusedCount: 1,
          totalCount: 1
        }
      },
      { $sort: { date: -1 } }
    ]);

    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

// Get raw attendance records for a specific class, group and date
const getAttendanceRecords = async (req, res, next) => {
  const { classId, groupId, date } = req.query;

  try {
    if (!classId || !groupId || !date) {
      return res.status(400).json({ message: 'Missing classId, groupId or date query parameter' });
    }

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      class: classId,
      group: groupId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate({
      path: 'student',
      populate: { path: 'user', select: 'firstName lastName email profilePic' }
    });

    res.status(200).json(attendance);
  } catch (error) {
    next(error);
  }
};

// Bulk import class attendance sheets via Excel
const importAttendanceExcel = async (req, res, next) => {
  const { classId, groupId, date } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }
    if (!classId || !groupId || !date) {
      return res.status(400).json({ message: 'Missing classId, groupId or date parameters in request body' });
    }

    const excelService = require('../services/excel.service');
    const rows = excelService.parseExcel(req.file.buffer);

    const savedRecords = [];
    const dateObj = new Date(date);

    for (const row of rows) {
      let registrationNumber = row.registrationNumber || row['N° Inscription'] || row['Ins. N°'];
      let status = row.status || row['Statut'];
      const remarks = row.remarks || row['Remarques'] || '';

      if (registrationNumber !== undefined && registrationNumber !== null) {
        registrationNumber = String(registrationNumber).trim();
      }

      if (!registrationNumber || !status) continue;

      status = status.trim().toLowerCase();
      let mappedStatus = 'Present';
      if (status.includes('ab') || status.includes('غائ')) {
        mappedStatus = 'Absent';
      } else if (status.includes('ret') || status.includes('تاخ') || status.includes('lat')) {
        mappedStatus = 'Late';
      } else if (status.includes('exc') || status.includes('معذ') || status.includes('mue')) {
        mappedStatus = 'Excused';
      }

      const student = await Student.findOne({ registrationNumber });
      if (!student) continue;

      const attendance = await Attendance.findOneAndUpdate(
        { student: student._id, date: dateObj },
        {
          class: classId,
          group: groupId,
          status: mappedStatus,
          remarks: remarks,
          recordedBy: req.user.id,
        },
        { new: true, upsert: true }
      );
      savedRecords.push(attendance);
    }

    res.status(200).json({ message: `Imported ${savedRecords.length} attendance records successfully.`, savedRecords });
  } catch (error) {
    next(error);
  }
};

// Download the work contract (عقد عمل) published by the administration
const downloadContract = async (req, res, next) => {
  try {
    const AdminDocument = require('../models/document.model');
    const path = require('path');
    const fs = require('fs');

    const doc = await AdminDocument.findOne({ type: 'teacher_contract' });
    if (!doc) {
      return res.status(404).json({ message: 'No work contract has been published yet.' });
    }

    const filePath = path.join(__dirname, '../../uploads/documents', doc.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Contract file is missing.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contrat-de-travail.pdf"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadCourse,
  deleteCourse,
  markAttendance,
  postAnnouncement,
  getAssignedStudents,
  getCourses,
  getAttendanceHistory,
  getAttendanceRecords,
  importAttendanceExcel,
  downloadContract,
};

