const express = require("express");
const axios = require("axios");
const generateReply = require("../ai/generateReply");

const router = express.Router();

module.exports = (openai) => {

  // ✅ Webhook verification (Facebook setup)
  router.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
      console.log("✅ Webhook Verified");
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  });

  // ✅ Handle incoming messages
  router.post("/webhook", async (req, res) => {
    const body = req.body;

    try {
      if (body.object === "page" || body.object === "instagram") {

        for (const entry of body.entry) {

          // Messenger uses "messaging"
          const event = entry.messaging ? entry.messaging[0] : entry.changes?.[0]?.value;

          if (!event) continue;

          console.log("📩 FULL EVENT:", JSON.stringify(event, null, 2));

          // ✅ Get sender ID (works for both IG & FB)
          const senderId = event.sender?.id || event.from?.id;

          // ✅ Extract message safely
          const userMessage =
            event.message?.text ||
            event.message?.quick_reply?.payload ||
            event.text ||
            null;

          if (!senderId || !userMessage) continue;

          console.log("👤 User:", userMessage);

          // 🔥 Generate AI reply
          const botReply = await generateReply(openai, userMessage);

          console.log("🤖 AI:", botReply);

          // ✅ extract only text
          const replyText = botReply?.reply || "Sorry, something went wrong.";

          try {
            const response = await axios.post(
              "https://graph.facebook.com/v18.0/me/messages",
              {
                recipient: { id: senderId },
                message: { text: replyText }
              },
              {
                params: {
                  access_token: process.env.PAGE_ACCESS_TOKEN
                }
              }
            );

  console.log("✅ FB SUCCESS:", response.data);

} catch (err) {
  console.error("❌ FB ERROR:", err.response?.data || err.message);
}

        return res.status(200).send("EVENT_RECEIVED");
      } else {
        return res.sendStatus(404);
      }

    } catch (error) {
      console.error("❌ SERVER ERROR:", error.message);
      return res.sendStatus(500);
    }
  });

  return router;
};