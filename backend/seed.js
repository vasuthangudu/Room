const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bachelorroom';

const User = require('./models/User');
const Expense = require('./models/Expense');
const Monthly = require('./models/Monthly');

async function seed() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', MONGO);

  // Remove any existing test users/expenses for idempotence
  await Expense.deleteMany({ notes: /smoke|seed/i });
  await User.deleteMany({ phone: { $in: ['1111111111', '2222222222'] } });

  const adminPass = await bcrypt.hash('admin123', 10);
  const userPass = await bcrypt.hash('user123', 10);

  const admin = await User.create({
    name: 'Admin User',
    phone: '1111111111',
    passwordHash: adminPass,
    role: 'admin',
    roomCode: 'R1',
    approved: true
  });

  const user = await User.create({
    name: 'Test User',
    phone: '2222222222',
    passwordHash: userPass,
    role: 'user',
    roomCode: 'R1',
    approved: true
  });

  await Expense.create([
    { user: user._id, amount: 120, category: 'Food', notes: 'Seed: lunch (seed)', approved: true },
    { user: user._id, amount: 40, category: 'Transport', notes: 'Seed: taxi (seed)', approved: true },
    { user: admin._id, amount: 200, category: 'Rent', notes: 'Seed: rent (seed)', approved: true }
  ]);

  await Monthly.create({ roomCode: 'R1', month: new Date().getMonth()+1, year: new Date().getFullYear(), rent:200, electricity:30, water:10, internet:20, maid:0, others:0, total:260 });

  console.log('Seeding complete: created admin (1111111111) and user (2222222222) with sample expenses.');
  await mongoose.disconnect();
}

seed().catch((err)=>{ console.error('Seed error', err); process.exit(1); });
