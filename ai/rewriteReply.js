module.exports = async function rewriteReply(openai, badReply, userMessage) {
  try {
    const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: `
Rewrite the message to sound like a real human sales expert.

Rules:
- Make it feel natural and conversational
- Remove corporate / robotic tone completely
- Make it warm, friendly, and slightly premium
- Not too short, not long (2–4 lines)
- Add a soft human touch (like "Got you", "Nice", "Makes sense")
- Keep ONE clear benefit
- End with a simple, natural question

DO NOT:
- Sound like a company
- Use phrases like "we specialize", "we focus on", "our services"
- Be pushy or aggressive

Goal:
Make the reply feel like a real human chatting — someone you'd trust.
`
    },
    {
      role: "user",
      content: originalReply
    }
  ]
};