const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { Server } = require("socket.io");

dotenv.config();

/* ================= APP SETUP ================= */
const app = express();
const server = http.createServer(app);

/* ================= SOCKET.IO ================= */
const io = new Server(server, {
  cors: { origin: "*" }
});

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= ROUTES ================= */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/admin", require("./routes/admin"));

/* ================= BASIC TEST ROUTE ================= */
app.get("/", (req, res) => {
  res.send("Backend running successfully 🚀");
});

/* ================= SOCKET EVENTS ================= */
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

/* ================= SERVER START ================= */
const PORT = process.env.PORT || 5001;

function startServer() {
  server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
}

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing");
  startServer();
} else {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("✅ MongoDB connected");
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err);
      // don't exit; server will still start and retries can occur later
    })
    .finally(() => {
      // always start the server regardless of DB result
      startServer();
    });
}

// log unhandled rejections to avoid process crash
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

/* ================= EXPORTS ================= */
module.exports = { app, io };
