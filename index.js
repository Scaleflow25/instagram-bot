require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const OpenAI = require("openai");

const webhookRoutes = require("./routes/webhook");
const runFollowUps = require("./workers/followup");

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  console.log("🔥 REQUEST:", req.method, req.url);
  next();
});

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error:", err));

// Routes
app.use("/", webhookRoutes(openai));

// Test route
app.get("/", (req, res) => {
  res.send("🚀 AI Agent Running");
});

// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// 🔁 Follow-up system (every 5 minutes)
setInterval(() => {
  runFollowUps();
}, 5 * 60 * 1000);