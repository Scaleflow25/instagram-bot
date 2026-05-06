for (const entry of body.entry) {

  const event = entry.messaging
    ? entry.messaging[0]
    : entry.changes?.[0]?.value;

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

  let replyText =
    typeof botReply === "string"
      ? botReply
      : botReply?.reply || "Sorry, something went wrong.";

  replyText = replyText.replace(/[^\x00-\x7F]/g, "").trim();

  if (!replyText) replyText = "Got it";

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

  console.log("✅ FB MESSAGE SENT");
}