const mongoose = require('mongoose');

const MonthlySchema = new mongoose.Schema({
  roomCode: { type: String, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  rent: { type: Number, default: 0 },
  electricity: { type: Number, default: 0 },
  water: { type: Number, default: 0 },
  internet: { type: Number, default: 0 },
  maid: { type: Number, default: 0 },
  others: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  locked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Monthly', MonthlySchema);
