const mongoose = require('mongoose');

const supervisorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    supervisorType: {
      type: String,
      enum: ['general_supervisor', 'pedagogical_supervisor'],
      required: true,
    },
    // Classes assigned to a pedagogical supervisor by the general supervisor
    assignedClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
    // Teachers assigned to a pedagogical supervisor
    assignedTeachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
      },
    ],
    officeLocation: {
      type: String,
      default: 'Bureau principal',
    },
  },
  {
    timestamps: true,
  }
);

supervisorSchema.index({ user: 1 });
supervisorSchema.index({ supervisorType: 1 });

module.exports = mongoose.model('Supervisor', supervisorSchema);
