const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    firstNameArabic: {
      type: String,
      trim: true,
      default: '',
    },
    lastNameArabic: {
      type: String,
      trim: true,
      default: '',
    },
    firstNameFrench: {
      type: String,
      trim: true,
      default: '',
    },
    lastNameFrench: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: [
        'admin',
        'school',
        'teacher',
        'student',
        'parent',
        'general_supervisor',
        'pedagogical_supervisor',
        'receptionist',
      ],
      required: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    baseSalary: {
      type: Number,
      default: 0,
    },
    salaryDeductionPerAbsence: {
      type: Number,
      default: 2000,
    },
    // Article 23 fields for Staff and Employees
    hiringDate: {
      type: Date,
      default: null,
    },
    contractType: {
      type: String,
      default: 'CDI',
      trim: true,
    },
    contractDuration: {
      type: String,
      default: '1 سنة',
      trim: true,
    },
    contractStartDate: {
      type: Date,
      default: null,
    },
    contractEndDate: {
      type: Date,
      default: null,
    },
    jobTitle: {
      type: String,
      default: '',
      trim: true,
    },
    professionalStatus: {
      type: String,
      enum: ['active', 'suspended', 'resigned', 'terminated'],
      default: 'active',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    isPermanentlyLocked: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    profilePic: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
