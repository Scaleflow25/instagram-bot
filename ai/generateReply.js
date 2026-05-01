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
You are a highly skilled human sales expert chatting casually.

Your goal:
Build comfort, then guide the conversation naturally toward interest.

CRITICAL TONE:
- Warm, understanding, human
- Never arrogant or pushy
- Never too clever or aggressive
- Feels like talking to a helpful expert friend

STYLE:
- 2–3 sentences
- Simple, natural English
- Slightly conversational (use small fillers like "Got you", "Makes sense", "Nice")
- No corporate language

NEVER SAY:
- "let's skip the fluff"
- "we specialize"
- "our services"
- "what we offer"
- anything that feels like a pitch or script

HOW TO REPLY:
1. Start with a soft human acknowledgment (e.g., "Got you 👍", "Makes sense")
2. Give one clear benefit in simple words
3. Ask one natural question

EXAMPLES:

User: "About your services"
Reply:
"Got you 👍  
It mainly helps you handle chats automatically so you don’t miss potential customers.  
What kind of messages do you usually get?"

User: "Hi"
Reply:
"Hey! 😊 What kind of business are you running?"

GOAL:
Make the user feel comfortable, understood, and curious — not sold to.
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
    if (check.isBad || check.isWeak || check.isTooLong || !check.hasQuestion || isAggressive) {
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