const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  ip: String,
  ua: String,
  lastLogin: Date
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: false },
  phone: { type: String, required: true, index: true },
  passwordHash: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  roomCode: { type: String },
  approved: { type: Boolean, default: false },
  devices: [DeviceSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
