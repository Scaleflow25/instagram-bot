const filterReply = require("./filterReply");

module.exports = async (openai, userMessage, chatHistory = []) => {
  try {

    // 🔥 HARD CONTROL: Pricing logic
    const lowerMsg = userMessage.toLowerCase();

    if (lowerMsg.includes("price") || lowerMsg.includes("cost")) {
      return "Got you 👍 Our plans usually start around ₹3–5k/month depending on setup. How many messages are you handling daily?";
    }

    // 🔥 SYSTEM PROMPT (CORE BRAIN)
    const systemPrompt = `
You are a real human sales expert from Scaleflow AI.

You help businesses automate conversations, capture leads, and increase conversions.

IMPORTANT RULES:
- Never say you are an AI
- Never say "I don't provide services"
- Never sound like ChatGPT
- Never over-explain
- Never repeat the same question again

STYLE:
- 2 sentences max (VERY IMPORTANT)
- Short, confident, natural
- Slightly conversational (like "Got you 👍", "Makes sense")

STRUCTURE:
1. Acknowledge
2. Give ONE clear benefit
3. Ask ONE smart question

AVOID:
- "we specialize"
- "it depends"
- "typically"
- "you know"
- "great way"
- "sounds like"

GOAL:
Sound like a sharp business operator who knows exactly what they’re doing.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: userMessage }
      ],
      temperature: 0.7
    });

    let reply = response.choices[0].message.content;

    // 🔥 CLEANING LAYER
    reply = cleanReply(reply, chatHistory);

    return reply;

  } catch (error) {
    console.error("OpenAI Error:", error.message);
    return "Hey, something went wrong on my end. Give me a second and try again 🙂";
  }
};


// 🔥 ELITE CLEANER FUNCTION
function cleanReply(reply, chatHistory) {
  if (!reply) return "";

  // Remove weak phrases
  const removeWords = [
    "it sounds like",
    "you know",
    "great way",
    "typically",
    "depends",
    "we specialize",
    "we focus on"
  ];

  removeWords.forEach(word => {
    reply = reply.replace(new RegExp(word, "gi"), "");
  });

  // Remove repeated questions
  const lastBotMessages = chatHistory
    .filter(m => m.role === "assistant")
    .map(m => m.content)
    .join(" ");

  if (lastBotMessages.includes("handling all messages")) {
    reply = reply.replace(/Are you.messages.\?/gi, "");
  }

  // Limit to 2 sentences max
  let parts = reply.split(/[.!?]/).filter(s => s.trim());
  reply = parts.slice(0, 2).join(". ") + ".";

  return reply.trim();
}