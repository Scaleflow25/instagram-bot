console.log("NEW CODE RUNNING");
require("dotenv").config();
// ==============================
// IMPORTS
// ==============================
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();

const OpenAI = require("openai");

// ==============================
// APP SETUP
// ==============================
const app = express();
app.use(express.json());

// ==============================
// ENV VARIABLES
// ==============================
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

const Openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==============================
// DATABASE CONNECTION
// ==============================
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ==============================
// ROOT ROUTE
// ==============================
app.get("/", (req, res) => {
  res.send("🚀 AI Bot is Running");
});

// ==============================
// WEBHOOK VERIFICATION (GET)
// ==============================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook Verified");
    return res.status(200).send(challenge);
  } else {
    console.log("❌ Webhook Verification Failed");
    return res.sendStatus(403);
  }
});

// ==============================
// WEBHOOK RECEIVER (POST)
// ==============================
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page" || body.object === "instagram") {
    for (const entry of body.entry) {
      const event = entry.messaging[0];

      if (event.message && event.message.text) {
        const senderId = event.sender.id;
        const userMessage = event.message.text;

        console.log("👤 User:", userMessage);
		


        try {
          // ============================
          // OPENAI RESPONSE
          // ============================
		  console.log("SYSTEM PROMPT ACTIVE");
          const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
  {
    role: "system",
    content: `You are Scaleflow AI, a business assistant for companies.

IMPORTANT:
You are NOT a general AI like ChatGPT.
You ONLY talk about business services, automation, and helping clients.

Your purpose:
- Help businesses grow using AI
- Explain services like:
  • AI chatbots
  • Lead generation systems
  • Automation tools
  • Sales funnels
  • Appointment booking systems

STRICT RULES:
- Never talk about homework, writing, translation, or general knowledge
- Never list generic AI capabilities
- Always answer as a business service provider
- Keep replies short, clear, and engaging

STYLE:
- Human-like
- Professional but friendly
- Ask follow-up questions

EXAMPLE:
If user asks "What services do you offer?"
Reply like:
"We help businesses automate customer interactions using AI chatbots, generate high-quality leads, and set up booking systems to increase conversions.

What kind of business are you running?"

GOAL:
Convert the user into a lead or conversation.`
  },
  {
    role: "user",
    content: userMessage
  }
],
temperature: 0.7
          });

          const botReply = aiResponse.choices[0].message.content.trim();

          console.log("🤖 AI Reply:", botReply);
		  console.log("Incoming message:", userMessage);

          // ============================
          // SEND MESSAGE BACK TO USER
          // ============================
          await axios.post(
            `https://graph.facebook.com/v18.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
            {
              recipient: { id: senderId },
              message: { text: botReply },
            }
          );

          console.log("✅ Message sent");
        } catch (error) {
          console.error("❌ Error:", error.response?.data || error.message);
        }
      }
    }

    return res.status(200).send("EVENT_RECEIVED");
  } else {
    return res.sendStatus(404);
  }
});

// ==============================
// START SERVER
// ==============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});