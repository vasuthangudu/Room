const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/admin', adminRoutes);

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('joinRoom', (roomId) => socket.join(roomId));
});

// default to 5001 since 5000 is frequently occupied during development
const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bachelorroom')
  .then(() => {
    server.listen(PORT, () => console.log('Server listening on', PORT));
  })
  .catch((err) => {
    console.error('Mongo connection error', err);
    process.exit(1);
  });

module.exports = { app, io };
