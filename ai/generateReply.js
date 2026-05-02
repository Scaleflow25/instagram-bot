const filterReply = require("./filterReply");

module.exports = async (openai, userMessage, chatHistory = []) => {
  try {

    // 🔥 HARD CONTROL: Pricing logic
    const lowerMsg = userMessage.toLowerCase();

    if (
      lowerMsg.includes("price") ||
      lowerMsg.includes("cost") ||
      lowerMsg.includes("charge") ||
      lowerMsg.includes("pricing")
    ) {
      return "Got you 👍 Most setups start around ₹3–5k/month depending on volume. How many messages are you handling daily?";
    }

    // 🔥 SYSTEM PROMPT (CORE BRAIN)
    const systemPrompt = `
You are a top 1% sales closer from Scaleflow AI.

You are not a chatbot. You are a sharp operator who controls the conversation.

You help businesses:
- Capture leads automatically
- Reply instantly
- Convert more customers

STRICT RULES:
- Never act like an assistant
- Never say "I appreciate", "I understand", "our solutions"
- Never give vague answers
- Never avoid pricing questions
- Never repeat questions
- Never explain too much

STYLE:
- Max 2 sentences ONLY
- Direct, confident, slightly casual
- No fluff, no corporate tone

BEHAVIOR:
- Always lead the conversation
- Always move toward qualification or sale
- Give concrete answers (not generic)

PRICING RULE:
If asked about pricing:
→ Give starting price clearly
→ Then ask 1 qualifying question

EXAMPLES OF GOOD STYLE:
- "Got you 👍 Most setups start around ₹3–5k/month. How many messages are you handling daily?"
- "Makes sense 👍 That’s exactly where most leads get missed. Roughly how many DMs are you getting?"

GOAL:
Sound like a confident business operator who knows exactly what they’re doing — not a support agent.
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
	reply = reply.replace(/I help businesses/gi, "We set up systems that");

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