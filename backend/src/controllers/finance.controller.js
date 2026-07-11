const { FinanceTransaction, FinancialProduct, SalaryDeduction, Payroll } = require('../models/finance.model');
const User = require('../models/user.model');
const StaffAttendance = require('../models/staffAttendance.model');

// 1. Overview
const getFinanceOverview = async (req, res, next) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    const allTransactions = await FinanceTransaction.find().sort({ date: -1 });

    let totalIncome = 0;
    let totalExpense = 0;
    allTransactions.forEach((t) => {
      if (t.type === 'INCOME') totalIncome += t.amount;
      if (t.type === 'EXPENSE') totalExpense += t.amount;
    });

    const products = await FinancialProduct.find({ isActive: true });

    // Get staff members eligible for salary
    const staffMembers = await User.find({
      role: { $in: ['teacher', 'general_supervisor', 'pedagogical_supervisor', 'receptionist'] },
    }).select('firstName lastName role email phoneNumber username profilePic baseSalary salaryDeductionPerAbsence');

    // Get current month payrolls
    const currentPayrolls = await Payroll.find({ month: currentMonth }).populate(
      'user',
      'firstName lastName role username phoneNumber profilePic baseSalary'
    );

    res.status(200).json({
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      recentTransactions: allTransactions.slice(0, 15),
      products,
      staffMembers,
      currentPayrolls,
      currentMonth,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Transactions (Entrées / Sorties)
const getTransactions = async (req, res, next) => {
  const { type, category } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = category;

  try {
    const transactions = await FinanceTransaction.find(filter)
      .populate('recordedBy', 'firstName lastName role')
      .sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    next(error);
  }
};

const createTransaction = async (req, res, next) => {
  const { title, amount, type, category, date, description } = req.body;

  try {
    if (!title || !amount || !type || !category) {
      return res.status(400).json({ message: 'Titre, montant, type et catégorie requis' });
    }

    const transaction = await FinanceTransaction.create({
      title,
      amount: Number(amount),
      type,
      category,
      date: date ? new Date(date) : new Date(),
      description: description || '',
      recordedBy: req.user.id,
    });

    await transaction.populate('recordedBy', 'firstName lastName role');
    res.status(201).json({ message: 'Transaction financière enregistrée', transaction });
  } catch (error) {
    next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await FinanceTransaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction introuvable' });
    }
    res.status(200).json({ message: 'Transaction supprimée avec succès' });
  } catch (error) {
    next(error);
  }
};

// 3. Financial Products
const getProducts = async (req, res, next) => {
  try {
    const products = await FinancialProduct.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  const { name, price, category, description } = req.body;

  try {
    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Nom et prix requis pour le produit' });
    }

    const product = await FinancialProduct.create({
      name,
      price: Number(price),
      category: category || 'Tuition',
      description: description || '',
    });

    res.status(201).json({ message: 'Produit financier créé avec succès', product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  const { name, price, category, description, isActive } = req.body;

  try {
    const product = await FinancialProduct.findById(id);
    if (!product) return res.status(404).json({ message: 'Produit introuvable' });

    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = Number(price);
    if (category !== undefined) product.category = category;
    if (description !== undefined) product.description = description;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();
    res.status(200).json({ message: 'Produit mis à jour', product });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await FinancialProduct.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Produit supprimé' });
  } catch (error) {
    next(error);
  }
};

// 4. Staff Salary Configuration (Only admin/school can modify base salaries and deduction rules)
const updateStaffSalaryConfig = async (req, res, next) => {
  const { userId, baseSalary, salaryDeductionPerAbsence } = req.body;

  try {
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Employé introuvable' });
    }

    if (baseSalary !== undefined) targetUser.baseSalary = Number(baseSalary);
    if (salaryDeductionPerAbsence !== undefined) {
      targetUser.salaryDeductionPerAbsence = Number(salaryDeductionPerAbsence);
    }

    await targetUser.save();

    res.status(200).json({
      message: 'Configuration salariale mise à jour avec succès',
      user: {
        id: targetUser._id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: targetUser.role,
        baseSalary: targetUser.baseSalary,
        salaryDeductionPerAbsence: targetUser.salaryDeductionPerAbsence,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 5. Generate / Recalculate Monthly Payroll
const generateOrGetMonthlyPayroll = async (req, res, next) => {
  const { month } = req.query; // '2026-07'
  const targetMonth = month || new Date().toISOString().slice(0, 7);

  try {
    const staffMembers = await User.find({
      role: { $in: ['teacher', 'general_supervisor', 'pedagogical_supervisor', 'receptionist'] },
    });

    const payrolls = [];

    for (const staff of staffMembers) {
      // Find all salary deductions for this staff member in target month
      const deductions = await SalaryDeduction.find({
        user: staff._id,
        month: targetMonth,
      });

      let totalAbsenceDays = 0;
      let totalDeductions = 0;

      deductions.forEach((d) => {
        if (d.deductedAutomatically) totalAbsenceDays += 1;
        totalDeductions += d.amount;
      });

      const baseSalary = staff.baseSalary || 0;
      let payroll = await Payroll.findOne({ user: staff._id, month: targetMonth });

      if (payroll) {
        if (payroll.status !== 'Paid') {
          payroll.baseSalary = baseSalary;
          payroll.totalAbsenceDays = totalAbsenceDays;
          payroll.totalDeductions = totalDeductions;
          payroll.netSalary = Math.max(0, baseSalary - totalDeductions + (payroll.bonuses || 0));
          await payroll.save();
        }
      } else {
        payroll = await Payroll.create({
          user: staff._id,
          month: targetMonth,
          baseSalary,
          totalAbsenceDays,
          totalDeductions,
          bonuses: 0,
          netSalary: Math.max(0, baseSalary - totalDeductions),
          status: 'Pending',
        });
      }

      await payroll.populate('user', 'firstName lastName role username phoneNumber profilePic baseSalary');
      payrolls.push(payroll);
    }

    res.status(200).json({ month: targetMonth, payrolls });
  } catch (error) {
    next(error);
  }
};

// 6. Pay Salary
const paySalary = async (req, res, next) => {
  const { id } = req.params;

  try {
    const payroll = await Payroll.findById(id).populate(
      'user',
      'firstName lastName role username phoneNumber profilePic baseSalary'
    );
    if (!payroll) return res.status(404).json({ message: 'Fiche de paie introuvable' });

    payroll.status = 'Paid';
    payroll.paidAt = new Date();
    await payroll.save();

    // Also record as a Financial Expense automatically
    await FinanceTransaction.create({
      title: `Paiement Salaire ${payroll.month} - ${payroll.user.firstName} ${payroll.user.lastName}`,
      amount: payroll.netSalary,
      type: 'EXPENSE',
      category: 'Salaires',
      description: `Salaire Net du mois ${payroll.month} après ${payroll.totalDeductions} DZD de retenues (Absences: ${payroll.totalAbsenceDays} jours)`,
      recordedBy: req.user.id,
    });

    res.status(200).json({ message: 'Salaire marqué comme Payé et dépense enregistrée', payroll });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFinanceOverview,
  getTransactions,
  createTransaction,
  deleteTransaction,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStaffSalaryConfig,
  generateOrGetMonthlyPayroll,
  paySalary,
};
