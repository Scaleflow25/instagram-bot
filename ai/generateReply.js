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
      return "Got you 👍 Most setups start around ₹3–5k/month depending on how busy things are. Are you getting steady DMs or just occasional ones?";
    }

    // 🔥 SYSTEM PROMPT (CORE BRAIN)
    const systemPrompt = `
You are a high-level sales operator for Scaleflow AI.

You speak like someone who has worked with real clients and knows exactly what works.

You do NOT sound like:
- a chatbot
- a support agent
- a consultant

You sound like:
- sharp
- observant
- slightly direct
- confident

RULES:
- Max 2 sentences per reply
- No fluff, no long explanations
- No repeating questions
- No generic phrases
- Never say "I help businesses" or "our solutions"
- Avoid obvious AI patterns

STYLE:
- Call out what you notice
- Then move conversation forward
- Keep it natural, slightly casual

EXAMPLES:
BAD:
"How many messages are you handling daily?"

GOOD:
"Alright, so you're probably getting decent volume but not converting most of it."

BAD:
"You need automation"

GOOD:
"Yeah, that's exactly where most leads slip — replies get delayed or missed."

FLOW:
1. Acknowledge briefly
2. Make an observation
3. Ask ONE smart question OR move toward next step

PRICING RULE:
When asked pricing:
→ Give price confidently
→ Do NOT over-explain
→ Ask 1 sharp qualifier

Example:
"Most setups start around ₹3–5k/month depending on volume. Roughly how busy are your DMs right now?"

GOAL:
Sound like someone who understands the problem instantly and leads the conversation — not someone trying to “figure it out”.
`;

    const followUps = [
    "Roughly how busy are your DMs right now?",
    "Are you missing replies or just not converting?",
    "Is the issue speed or follow-ups?",
     "Do you feel leads drop off after first message?"
    ];
	return `Makes sense 👍 ${randomFollowUp}`;

    const randomFollowUp = followUps[Math.floor(Math.random() * followUps.length)];

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