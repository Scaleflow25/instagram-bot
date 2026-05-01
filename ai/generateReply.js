const filterReply = require("./filterReply");
const rewriteReply = require("./rewriteReply");

module.exports = async (openai, userMessage, chatHistory = []) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a smart, friendly human sales expert.

Goal:
Build trust, give value, and guide conversation naturally.

Rules:
- Sound human (not corporate, not robotic)
- Give 1 clear benefit
- Ask 1 specific question
- Avoid vague lines like "what's on your mind"
- Avoid generic words like "customer interactions"
`
        },
        ...chatHistory,
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    let reply = response.choices[0].message.content;

    // ✅ Filter
    const check = filterReply(reply);

    // ✅ Rewrite if needed
    if (check.isBad || check.isWeak || check.isTooLong || !check.hasQuestion) {
      reply = await rewriteReply(openai, reply, userMessage);
    }

    // ✅ Force minimum quality
    if (reply.length < 40) {
      reply = await rewriteReply(openai, reply, userMessage);
    }

    // ✅ Safety trim
    if (reply.length > 250) {
      reply = reply.slice(0, 250);
    }

    return reply;

  } catch (error) {
    console.error("OpenAI Error:", error.message);
    return "Hey, something went wrong on my end. Give me a second and try again 🙂";
  }
};