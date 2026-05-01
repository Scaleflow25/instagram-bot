const express = require("express");
const axios = require("axios");
const generateReply = require("../ai/generateReply");

const router = express.Router();

module.exports = (openai) => {

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

  router.post("/webhook", async (req, res) => {
    const body = req.body;

    if (body.object === "page" || body.object === "instagram") {
      for (const entry of body.entry) {
        const event = entry.messaging?.[0];

        if (event?.message?.text) {
          const senderId = event.sender.id;
          const userMessage = event.message.text;

          console.log("User:", userMessage);

          try {
            const botReply = await generateReply(openai, userMessage);

            console.log("AI:", botReply);

            await axios.post(
              `https://graph.facebook.com/v18.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
              {
                recipient: { id: senderId },
                message: { text: botReply },
              }
            );

          } catch (err) {
            console.error("Error:", err.message);
          }
        }
      }
      return res.status(200).send("EVENT_RECEIVED");
    } else {
      return res.sendStatus(404);
    }
  });

  return router;
};