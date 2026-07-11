const mongoose = require('mongoose');

// 1. Finance Transaction (Entrées / Sorties)
const financeTransactionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['INCOME', 'EXPENSE'], // Entrée ou Sortie
      required: true,
    },
    category: {
      type: String,
      enum: ['Tuition / Inscriptions', 'Cantine', 'Livres & Matériel', 'Activités / Clubs', 'Salaires', 'Maintenance', 'Factures (Électricité, Internet, Eau)', 'Équipements', 'Autre'],
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

financeTransactionSchema.index({ type: 1, date: -1 });

const FinanceTransaction = mongoose.model('FinanceTransaction', financeTransactionSchema);

// 2. Financial Product (Produits et services financiers)
const financialProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ['Tuition', 'Canteen', 'Books', 'Uniform', 'Club', 'Transport', 'Other'],
      default: 'Tuition',
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const FinancialProduct = mongoose.model('FinancialProduct', financialProductSchema);

// 3. Salary Deduction (Déductions / Retenues sur salaire - ex: Absences)
const salaryDeductionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    attendanceRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffAttendance',
    },
    deductedAutomatically: {
      type: Boolean,
      default: true,
    },
    month: {
      type: String, // e.g., '2026-07'
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

salaryDeductionSchema.index({ user: 1, month: 1 });

const SalaryDeduction = mongoose.model('SalaryDeduction', salaryDeductionSchema);

// 4. Payroll (Fiches de paie mensuelles)
const payrollSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: String, // '2026-07'
      required: true,
    },
    baseSalary: {
      type: Number,
      required: true,
    },
    totalAbsenceDays: {
      type: Number,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
    },
    bonuses: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid'],
      default: 'Pending',
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

payrollSchema.index({ user: 1, month: 1 }, { unique: true });

const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = {
  FinanceTransaction,
  FinancialProduct,
  SalaryDeduction,
  Payroll,
};
