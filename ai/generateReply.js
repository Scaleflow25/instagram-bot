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
You are a sharp, confident human sales expert chatting casually.

IMPORTANT:
- Talk like a real person, not a company
- Keep replies short (max 2–3 sentences)
- Simple English, natural tone
- No corporate phrases

NEVER say:
- "we help businesses"
- "our services"
- "what we offer"
- "we specialize"
- "I’d love to chat"

STYLE:
- Friendly, confident, slightly direct
- No long paragraphs
- No generic explanations

GOAL:
Guide conversation naturally toward interest.

ALWAYS:
- Give 1 simple benefit
- Ask 1 smart question
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

    // 🧠 Step 1: Filter check
    const check = filterReply(reply);

    // 🚨 Step 2: Rewrite if needed
    if (check.isBad || check.isTooLong || !check.hasQuestion) {
      console.log("⚠️ Rewriting reply...");
      reply = await rewriteReply(openai, reply, userMessage);
    }

    // ✂️ Step 3: Safety trim
    if (reply.length > 250) {
      reply = reply.slice(0, 250);
    }

    return reply;

  } catch (error) {
    console.error("OpenAI Error:", error.message);
    return "Something went wrong. Try again?";
  }
};