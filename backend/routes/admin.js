const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Monthly = require('../models/Monthly');
const Settlement = require('../models/Settlement');

// Get pending user approvals
router.get('/pending-approvals', auth, requireRole('admin'), async (req, res) => {
  const users = await User.find({ approved: false });
  return res.json({ users });
});

// Approve user registration
router.post('/approve-user/:id', auth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: 'Not found' });
  user.approved = true;
  await user.save();
  return res.json({ ok: true });
});

// Get room members
router.get('/room-members/:roomCode', auth, requireRole('admin'), async (req, res) => {
  const { roomCode } = req.params;
  const users = await User.find({ roomCode, approved: true }).select('-passwordHash');
  return res.json({ users });
});

// Get room expenses
router.get('/room-expenses/:roomCode', auth, requireRole('admin'), async (req, res) => {
  const { roomCode } = req.params;
  const { month, year } = req.query;
  const users = await User.find({ roomCode });
  const userIds = users.map(u => u._id);
  const q = { user: { $in: userIds } };
  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    q.date = { $gte: start, $lte: end };
  }
  const expenses = await Expense.find(q).populate('user', 'name phone').sort({ date: -1 });
  return res.json({ expenses });
});

// Get monthly record
router.get('/monthly/:roomCode', auth, requireRole('admin'), async (req, res) => {
  const { roomCode } = req.params;
  const { month, year } = req.query;
  if (!month || !year) return res.status(400).json({ message: 'month and year required' });
  const rec = await Monthly.findOne({ roomCode, month, year });
  return res.json({ record: rec });
});

// Create/update monthly record
router.post('/monthly', auth, requireRole('admin'), async (req, res) => {
  const { roomCode, month, year, rent, electricity, water, internet, maid, others, total: overrideTotal } = req.body;
  let total = Number(rent || 0) + Number(electricity || 0) + Number(water || 0) + Number(internet || 0) + Number(maid || 0) + Number(others || 0);
  if (overrideTotal !== undefined && overrideTotal !== null && overrideTotal !== '') {
    const num = Number(overrideTotal);
    if (!isNaN(num)) total = num;
  }
  let rec = await Monthly.findOne({ roomCode, month, year });
  if (rec) {
    rec.rent = rent;
    rec.electricity = electricity;
    rec.water = water;
    rec.internet = internet;
    rec.maid = maid;
    rec.others = others;
    rec.total = total;
    await rec.save();
  } else {
    rec = await Monthly.create({ roomCode, month, year, rent, electricity, water, internet, maid, others, total });
  }
  return res.json({ record: rec });
});

// Lock month
router.post('/monthly/:id/lock', auth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const rec = await Monthly.findById(id);
  if (!rec) return res.status(404).json({ message: 'Not found' });
  rec.locked = true;
  await rec.save();
  return res.json({ ok: true });
});

// Get calculations for room (balances/settlement)
router.get('/calculations/:roomCode', auth, requireRole('admin'), async (req, res) => {
  const { roomCode } = req.params;
  const { month, year } = req.query;
  const users = await User.find({ roomCode, approved: true });
  const userIds = users.map(u => u._id);
  
  const q = { user: { $in: userIds }, approved: true };
  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    q.date = { $gte: start, $lte: end };
  }
  const expenses = await Expense.find(q);
  
  const monthly = await Monthly.findOne({ roomCode, month, year });
  const totalFixed = monthly?.total || 0;

  // compute total of all expenses in this period
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingTotal = totalFixed - totalExpenses;
  
  // Calculate per-user balances
  const userBalances = {};
  users.forEach(u => {
    userBalances[u._id] = {
      user: { _id: u._id, name: u.name, phone: u.phone },
      userExpenses: 0,
      userShare: 0,
      balance: 0
    };
  });
  
  expenses.forEach(e => {
    if (userBalances[e.user]) {
      userBalances[e.user].userExpenses += e.amount;
    }
  });
  
  // Calculate fixed share per user
  const perUserShare = totalFixed / Math.max(users.length, 1);
  Object.keys(userBalances).forEach(uid => {
    userBalances[uid].userShare = perUserShare;
    userBalances[uid].balance = userBalances[uid].userExpenses - perUserShare;
  });
  
  return res.json({ userBalances: Object.values(userBalances), totalFixed, totalExpenses, remainingTotal, monthlyRecord: monthly });
});

// Create settlement
router.post('/settlement', auth, requireRole('admin'), async (req, res) => {
  const { from, to, amount } = req.body;
  const settlement = await Settlement.create({ from, to, amount, confirmed: false });
  return res.json({ settlement });
});

// Get settlements
router.get('/settlements/:roomCode', auth, requireRole('admin'), async (req, res) => {
  const { roomCode } = req.params;
  const users = await User.find({ roomCode });
  const userIds = users.map(u => u._id);
  const settlements = await Settlement.find({ from: { $in: userIds }, to: { $in: userIds } }).populate('from to', 'name phone');
  return res.json({ settlements });
});

// Confirm settlement
router.post('/settlement/:id/confirm', auth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const settlement = await Settlement.findById(id);
  if (!settlement) return res.status(404).json({ message: 'Not found' });
  settlement.confirmed = true;
  await settlement.save();
  return res.json({ ok: true });
});

module.exports = router;
