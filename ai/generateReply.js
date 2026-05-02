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
You are a professional business consultant.

RULES:
- Keep replies to max 2–3 sentences
- No fluff, no motivational talk
- No phrases like "sounds like", "nice", "great way"
- Speak clearly and directly

STRUCTURE:
1. Short acknowledgment
2. One clear business insight (leads, missed replies, automation)
3. One direct question

PLATFORM:
- Do NOT assume Instagram
- Speak generally unless user mentions platform

GOAL:
Sound sharp, practical, and trustworthy — not chatty.
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

    // 🔥 Step 3: Hard enforce elite style
    function cleanReply(reply) {
    if (!reply) return "";

    // Remove fluff phrases
    const banned = [
    "it sounds like",
    "it's awesome",
    "nice to think",
    "you know",
    "great way",
    "makes sense",
    "don't you think"
    ];

    let cleaned = reply;
    banned.forEach(p => {
    cleaned = cleaned.replace(new RegExp(p, "gi"), "");
    });

    // Keep only first 2–3 sentences
    const sentences = cleaned.split(/[.!?]/).filter(s => s.trim());
    cleaned = sentences.slice(0, 3).join(". ") + ".";

    return cleaned.trim();
    }

    // apply it
    reply = cleanReply(reply);

    // Ensure reply has a question
    if (!reply.includes("?")) {
    reply += " Are you currently handling all messages yourself?";
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