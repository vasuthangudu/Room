const Expense = require('../models/Expense');
const User = require('../models/User');
const { io } = require('../server');

exports.addExpense = async (req, res) => {
  try {
    const { amount, category, notes, date } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;
    // include roomCode for easier queries later
    const user = await User.findById(req.user._id);
    const expense = await Expense.create({
      user: req.user._id,
      roomCode: user?.roomCode,
      amount,
      category,
      notes,
      date: date || Date.now(),
      image,
      approved: false
    });
    // emit realtime update to roomCode
    if (user && user.roomCode) io.to(user.roomCode).emit('expenseAdded', expense);
    return res.json({ ok: true, expense });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.listRecent = async (req, res) => {
  // return latest 5 expenses visible to the user: admins get all, others get room expenses
  let query;
  if (req.user.role === 'admin') {
    query = {};
  } else {
    query = { roomCode: req.user.roomCode };
  }
  const expenses = await Expense.find(query).populate('user', 'name phone').sort({ date: -1 }).limit(5);
  return res.json({ expenses });
};

exports.list = async (req, res) => {
  const { start, end, category, roomCode } = req.query;
  let q = {};
  if (req.user.role === 'admin') {
    // admins can optionally filter by roomCode; otherwise see everything
    if (roomCode) q.roomCode = roomCode;
  } else {
    // non-admins see all expenses in their room only
    q.roomCode = req.user.roomCode;
  }
  if (category) q.category = category;
  if (start || end) {
    q.date = {};
    if (start) q.date.$gte = new Date(start);
    if (end) q.date.$lte = new Date(end);
  }
  const items = await Expense.find(q).populate('user', 'name phone').sort({ date: -1 });
  return res.json({ items });
};

exports.edit = async (req, res) => {
  const { id } = req.params;
  const expense = await Expense.findById(id);
  if (!expense) return res.status(404).json({ message: 'Not found' });
  const sameDay = (d1, d2) => new Date(d1).toDateString() === new Date(d2).toDateString();
  if (!sameDay(expense.date, new Date())) return res.status(403).json({ message: 'Edit allowed only same day' });
  Object.assign(expense, req.body);
  await expense.save();
  return res.json({ expense });
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  const expense = await Expense.findById(id);
  if (!expense) return res.status(404).json({ message: 'Not found' });
  const sameDay = (d1, d2) => new Date(d1).toDateString() === new Date(d2).toDateString();
  if (!sameDay(expense.date, new Date())) return res.status(403).json({ message: 'Delete allowed only same day' });
  await Expense.findByIdAndDelete(id);
  return res.json({ ok: true });
};

// Approve/reject expense
exports.approveExpense = async (req, res) => {
  const { id } = req.params;
  const { approved, comment } = req.body;
  const expense = await Expense.findById(id);
  if (!expense) return res.status(404).json({ message: 'Not found' });
  expense.approved = approved;
  expense.approverComment = comment;
  await expense.save();
  const user = await User.findById(expense.user);
  if (user && user.roomCode) io.to(user.roomCode).emit('expenseApproved', { expense, approved });
  return res.json({ ok: true, expense });
};

// Get pending expenses for admin
exports.listPending = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const expenses = await Expense.find({ approved: false }).populate('user', 'name phone roomCode').sort({ createdAt: -1 });
  return res.json({ expenses });
};

