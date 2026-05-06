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

    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
      console.log("Webhook Verified");
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  });
  
  entry.messaging.forEach((messaging) => {

    console.log("PLATFORM:", messaging.sender.id);
    console.log(JSON.stringify(req.body, null, 2));

  });

  // Incoming messages
  router.post("/webhook", async (req, res) => {

    console.log("POST WEBHOOK RECEIVED");

    const body = req.body;

    res.status(200).send("EVENT_RECEIVED");

    try {

      if (!body.entry) {
        console.log("No entries");
        return;
      }

      for (const entry of body.entry) {

        const event = entry.messaging
          ? entry.messaging[0]
          : entry.changes?.[0]?.value;

        if (!event) continue;

        console.log("FULL EVENT:", JSON.stringify(event, null, 2));

        const senderId = event.sender?.id || event.from?.id;

        const userMessage =
          event.message?.text ||
          event.message?.quick_reply?.payload ||
          event.text ||
          null;

        if (!senderId || !userMessage) continue;

        console.log("USER:", userMessage);

        const botReply = await generateReply(openai, userMessage);

        console.log("AI:", botReply);

        let replyText =
          typeof botReply === "string"
            ? botReply
            : botReply?.reply || "Sorry, something went wrong.";

        replyText = replyText.replace(/[^\x00-\x7F]/g, "").trim();

        if (!replyText) {
          replyText = "Got it";
        }

        await axios.post(
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

        console.log("MESSAGE SENT");
      }

    } catch (error) {

      console.error(
        "SERVER ERROR:",
        error.response?.data || error.message
      );

    }

  });

  return router;
};