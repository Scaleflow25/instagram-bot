const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// 🔐 VERIFY TOKEN (same as Meta webhook)
const VERIFY_TOKEN = "scaleflow_123_secure";

// 🔑 PASTE YOUR REAL PAGE ACCESS TOKEN HERE
const PAGE_ACCESS_TOKEN = "EAAXzKBbK21sBRVCgZBKRxbbWYBTd4KZAYCiOIcRnAcw78V9ZCfDxTxSfJWnGCjtqG5wzYuWulu2erEkOZADkZAPp97FJ82oC7lER6iSq4q6xpF2hQgVp3ETP7XCgDxLp1ZBuXtkRsiq2NpTNNRnX5Kl1efNdgWVKq3ox4jZCD9vKqQwpgjImjoSVgMZAQkzevYcxUvdeRYZAJyuBjTXpr5oLawfZBOvZAozM27e3muJY70zh9IlOxfS82AJrBn1WiKIR4ELgLjYHVftUaTj9xiH00Td";


// ==============================
// ✅ Webhook Verification
// ==============================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});


// ==============================
// 📩 Receive Messages
// ==============================
app.post("/webhook", async (req, res) => {
  console.log("Incoming:", JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry;

    if (entry && entry[0].changes) {
      const changes = entry[0].changes[0].value;

      if (changes.messages) {
        const message = changes.messages[0];

        const senderId = message.from.id;
        const text = message.text?.body || "No text";

        console.log("User said:", text);

        // ==============================
        // 🤖 Send Reply
        // ==============================
        await axios.post(
          "https://graph.facebook.com/v19.0/me/messages",
          {
            messaging_product: "instagram",
            recipient: { id: senderId },
            message: {
              text: "Hello 👋 This is your bot reply!"
            }
          },
          {
            params: {
              access_token: PAGE_ACCESS_TOKEN
            }
          }
        );

        console.log("Reply sent successfully");
      }
    }

    res.sendStatus(200);

  } catch (error) {
    console.log("❌ ERROR:", error.response?.data || error.message);
    res.sendStatus(500);
  }
});


// ==============================
// 🚀 Start Server
// ==============================
app.listen(3000, () => {
  console.log("Server running on port 3000");
});