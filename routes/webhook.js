const express = require("express");
const axios = require("axios");
const generateReply = require("../ai/generateReply");

const router = express.Router();

module.exports = (openai) => {

  // ✅ Webhook verification
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

    // ⚡ Always respond fast
    res.status(200).send("EVENT_RECEIVED");

    try {
      if (body.object !== "page" && body.object !== "instagram") return;

      // 🔥 Detect platform
      const isInstagram = !!item.changes;

      for (const item of body.entry) {

        const event = item.messaging
          ? item.messaging[0]
          : item.changes?.[0]?.value;

        if (!event) continue;

        console.log("📩 FULL EVENT:", JSON.stringify(event, null, 2));

        const senderId = event.sender?.id || event.from?.id;

        const userMessage =
          event.message?.text ||
          event.message?.quick_reply?.payload ||
          event.text ||
          null;

        if (!senderId || !userMessage) continue;

        console.log("👤 User:", userMessage);

        // 🔥 Generate AI reply
        const botReply = await generateReply(openai, userMessage);

        console.log("🤖 AI RAW:", botReply);

        // ✅ clean reply
        let replyText =
          typeof botReply === "string"
            ? botReply
            : botReply?.reply || "Sorry, something went wrong.";

        replyText = replyText.replace(/[^\x00-\x7F]/g, "").trim();

        if (!replyText) replyText = "Got it 👍";

        // 🔥 SELECT TOKEN BASED ON PLATFORM
        let ACCESS_TOKEN;

        if (entry.messaging) {
          ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
        } 

        // 🚀 Send message
        await axios.post(
          "https://graph.facebook.com/v22.0/me/messages",
          {
            recipient: { id: senderId },
            message: { text: replyText }
          },
          {
            params: {
              access_token: ACCESS_TOKEN
            }
          }
        );

        console.log(`✅ MESSAGE SENT (${isInstagram ? "IG" : "FB"})`);
      }

    } catch (error) {
      console.error("❌ SERVER ERROR:");
      console.log(error.response?.data);
      console.log(error.message);
    }
  });

  return router;
};