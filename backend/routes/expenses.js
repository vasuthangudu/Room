const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { auth, requireRole } = require('../middleware/auth');
const expenseController = require('../controllers/expenseController');

router.post('/', auth, upload.single('image'), expenseController.addExpense);
router.get('/recent', auth, expenseController.listRecent);
router.get('/', auth, expenseController.list);
router.put('/:id', auth, expenseController.edit);
router.delete('/:id', auth, expenseController.remove);
router.get('/admin/pending', auth, requireRole('admin'), expenseController.listPending);
router.post('/:id/approve', auth, requireRole('admin'), expenseController.approveExpense);

module.exports = router;
