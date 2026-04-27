require("dns").setDefaultResultOrder("ipv4first");
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

/* ===========================
   🔐 ENV VARIABLES
=========================== */
const {
  PORT = 5000,
  PAGE_ACCESS_TOKEN,
  VERIFY_TOKEN,
  OPENAI_API_KEY,
  MONGO_URI,
} = process.env;

/* ===========================
   🧠 OPENAI SETUP
=========================== */
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

/* ===========================
   🗄️ DATABASE CONNECTION (SRV)
=========================== */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      family: 4,
    });

    console.log("✅ MongoDB Connected (SRV - FIXED)");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

/* ===========================
   📦 SCHEMA (Conversation)
=========================== */
const messageSchema = new mongoose.Schema({
  role: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  messages: [messageSchema],
});

const Conversation = mongoose.model("Conversation", conversationSchema);

/* ===========================
   🤖 AI RESPONSE GENERATOR
=========================== */
const generateReply = async (userId, userMessage) => {
  try {
    let convo = await Conversation.findOne({ userId });

    if (!convo) {
      convo = new Conversation({ userId, messages: [] });
    }

    // Save user message
    convo.messages.push({ role: "user", content: userMessage });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: convo.messages.slice(-10),
    });

    const reply = response.choices[0].message.content;

    // Save bot reply
    convo.messages.push({ role: "assistant", content: reply });

    await convo.save();

    return reply;
  } catch (err) {
    console.error("❌ AI Error:", err.message);
    return "Sorry, something went wrong. Try again later.";
  }
};

/* ===========================
   📤 SEND MESSAGE (META API)
=========================== */
const sendMessage = async (recipientId, message) => {
  try {
    await axios.post(
      "https://graph.facebook.com/v19.0/me/messages",
      {
        recipient: { id: recipientId },
        message: { text: message },
      },
      {
        params: {
          access_token: PAGE_ACCESS_TOKEN,
        },
      }
    );

    console.log("✅ Message sent");
  } catch (error) {
    console.error(
      "❌ Send Error:",
      error.response?.data || error.message
    );
  }
};

/* ===========================
   🔄 WEBHOOK VERIFY (GET)
=========================== */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

/* ===========================
   🔄 WEBHOOK RECEIVE (POST)
=========================== */
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    if (body.object === "page") {
      for (const entry of body.entry) {
        const event = entry.messaging?.[0];

        if (!event || !event.message) continue;

        const senderId = event.sender.id;
        const userText = event.message.text;

        console.log("👤 User:", userText);

        const reply = await generateReply(senderId, userText);

        await sendMessage(senderId, reply);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook Error:", err.message);
    res.sendStatus(500);
  }
});

/* ===========================
   🧪 HEALTH CHECK ROUTE
=========================== */
app.get("/", (req, res) => {
  res.send("🚀 SaaS AI Bot is Running");
});

/* ===========================
   🚀 START SERVER
=========================== */
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();