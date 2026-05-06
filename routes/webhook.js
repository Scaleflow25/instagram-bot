const express = require("express");
const axios = require("axios");
const generateReply = require("../ai/generateReply");

const router = express.Router();

module.exports = (openai) => {

  // Webhook verification
  router.get("/webhook", (req, res) => {

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (
      mode === "subscribe" &&
      token === process.env.VERIFY_TOKEN
    ) {

      console.log("✅ Webhook Verified");
      return res.status(200).send(challenge);

    } else {

      return res.sendStatus(403);

    }

  });

  // Incoming messages
  router.post("/webhook", async (req, res) => {

    console.log("🔥 POST WEBHOOK RECEIVED");

    const body = req.body;

    console.log("📦 FULL BODY:");
    console.log(JSON.stringify(body, null, 2));

    // Reply immediately to Meta
    res.status(200).send("EVENT_RECEIVED");

    try {

      if (!body.entry) {

        console.log("❌ No entries found");
        return;

      }

      for (const entry of body.entry) {

        if (!entry.messaging) continue;

        for (const messaging of entry.messaging) {

          console.log("📨 MESSAGE EVENT:");
          console.log(JSON.stringify(messaging, null, 2));

          const senderId = messaging.sender?.id;

          let userMessage = null;

          if (messaging.message) {

            userMessage =
              messaging.message.text ||
              messaging.message.quick_reply?.payload;

        }

          if (!userMessage && messaging.postback) {

            userMessage = messaging.postback.payload;

}

          if (!senderId) {

            console.log("❌ Missing sender ID");
            continue;

          }

          if (!userMessage) {

            console.log("⚠️ Non-text event received");
            console.log(JSON.stringify(messaging, null, 2));
            continue;

          }

          console.log("👤 USER:", userMessage);

          // Generate AI reply
          const botReply = await generateReply(
            openai,
            userMessage
          );

          console.log("🤖 AI:", botReply);

          let replyText =
            typeof botReply === "string"
              ? botReply
              : botReply?.reply ||
                "Sorry, something went wrong.";

          // Remove unsupported characters
          replyText = replyText
            .replace(/[^\x00-\x7F]/g, "")
            .trim();

          if (!replyText) {

            replyText = "Got it";

          }

          // Send reply
          const response = await axios.post(
            "https://graph.facebook.com/v18.0/me/messages",
            {
              recipient: {
                id: senderId
              },
              message: {
                text: replyText
              }
            },
            {
              params: {
                access_token:
                  process.env.PAGE_ACCESS_TOKEN
              }
            }
          );

          console.log("✅ MESSAGE SENT");
          console.log(response.data);

        }

      }

    } catch (error) {

      console.error("❌ SERVER ERROR:");

      if (error.response?.data) {

        console.log(
          JSON.stringify(error.response.data, null, 2)
        );

      } else {

        console.log(error.message);

      }

    }

  });

  return router;

};