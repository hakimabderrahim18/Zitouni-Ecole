const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/finance.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.use(protect);
// Only platform responsible (admin and school) can access finance endpoints
router.use(authorize('admin', 'school'));

router.get('/overview', getFinanceOverview);

router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
router.delete('/transactions/:id', deleteTransaction);

router.get('/products', getProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.put('/salary-config', updateStaffSalaryConfig);
router.get('/payroll', generateOrGetMonthlyPayroll);
router.put('/payroll/:id/pay', paySalary);

module.exports = router;
