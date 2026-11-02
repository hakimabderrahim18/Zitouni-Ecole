const mongoose = require('mongoose');

const lessonNotebookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true, // e.g. "الرياضيات", "اللغة العربية", "العلوم الفيزيائية"
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    teacherUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teacherName: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    period: {
      type: String,
      default: '08:30 - 09:30',
    },
    summary: {
      type: String,
      required: true,
      trim: true, // Course summary, axes, pedagogical objectives
    },
    homework: {
      hasHomework: {
        type: Boolean,
        default: false,
      },
      title: {
        type: String,
        default: '',
      },
      description: {
        type: String,
        default: '',
      },
      dueDate: {
        type: Date,
      },
      // Track which students marked their homework as completed
      completedBy: [
        {
          student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
          },
          completedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        fileType: { type: String, default: 'application/pdf' },
        size: { type: Number, default: 0 },
      },
    ],
    pedagogicalLinks: [
      {
        title: { type: String, default: '' },
        url: { type: String, required: true },
      },
    ],
    // Official Inspection Visa by Pedagogical Supervisor or Director (Cahier de texte officiel)
    administrativeVisa: {
      isVisaed: {
        type: Boolean,
        default: false,
      },
      visaedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      visaedByName: {
        type: String,
        default: '',
      },
      visaedAt: {
        type: Date,
      },
      remarks: {
        type: String,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

lessonNotebookSchema.index({ class: 1, date: -1 });
lessonNotebookSchema.index({ teacherUser: 1, date: -1 });
lessonNotebookSchema.index({ subject: 1 });

module.exports = mongoose.model('LessonNotebook', lessonNotebookSchema);
