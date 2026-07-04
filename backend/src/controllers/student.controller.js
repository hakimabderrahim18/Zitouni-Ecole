const Course = require('../models/course.model');
const Announcement = require('../models/announcement.model');
const Student = require('../models/student.model');
const Schedule = require('../models/schedule.model');

// Retrieve courses relevant to student
const getCourses = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const courses = await Course.find({
      class: student.class,
      $or: [{ group: student.group }, { group: null }],
    }).populate({
      path: 'teacher',
      populate: { path: 'user', select: 'firstName lastName profilePic' },
    });

    res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
};

// Retrieve student announcements feed
const getAnnouncements = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const announcements = await Announcement.find({
      $or: [
        { isGlobal: true },
        { targetClass: student.class, targetGroup: student.group },
        { targetClass: student.class, targetGroup: null },
      ],
    }).populate('publisher', 'firstName lastName profilePic');

    res.status(200).json(announcements);
  } catch (error) {
    next(error);
  }
};

// Get Schedules (class timetable, exam, transport, food menus)
const getSchedules = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const schedules = await Schedule.find({
      $or: [
        { class: student.class, group: student.group },
        { class: student.class, group: null },
        { class: null, group: null }, // global schedules (e.g. food programs)
      ],
      isActive: true,
    });

    res.status(200).json(schedules);
  } catch (error) {
    next(error);
  }
};

// Get student attendance history
const getAttendance = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const Attendance = require('../models/attendance.model');
    const attendance = await Attendance.find({ student: student._id })
      .populate('recordedBy', 'firstName lastName role')
      .populate('class', 'name')
      .populate('group', 'name')
      .sort({ date: -1 });

    res.status(200).json(attendance);
  } catch (error) {
    next(error);
  }
};

module.exports = { getCourses, getAnnouncements, getSchedules, getAttendance };
