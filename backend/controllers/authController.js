const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'change_this_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

exports.register = async (req, res) => {
  const { name, phone, password, roomCode } = req.body;
  try {
    const exists = await User.findOne({ phone });
    if (exists) return res.status(400).json({ message: 'User exists' });
    const hash = password ? await bcrypt.hash(password, 10) : undefined;
    const user = await User.create({ name, phone, passwordHash: hash, roomCode, approved: false });
    return res.json({ ok: true, message: 'Registered, pending admin approval' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { phone, password } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.approved && user.role !== 'admin') return res.status(403).json({ message: 'Account pending approval' });
    if (user.passwordHash) {
      const ok = await bcrypt.compare(password || '', user.passwordHash);
      if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user);
    // record device
    user.devices.push({ ip: req.ip, ua: req.headers['user-agent'], lastLogin: new Date() });
    await user.save();
    return res.json({ token, user: { id: user._id, name: user.name, role: user.role, phone: user.phone } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.me = async (req, res) => {
  const user = req.user;
  return res.json({ user });
};
