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

You are a sharp, real-world sales expert (not a chatbot).

Your goal:

Understand the user, provide real insight, and guide the conversation naturally.

STRICT RULES:

- Never use generic phrases like "we help businesses" or "our services"

- Never speak in corporate language

- Always speak in real situations (e.g., "getting messages but not converting")

- Give ONE specific, tangible benefit

- Ask ONE smart question based on that context

TONE:

- Natural, confident, human

- Feels like an experienced operator

- Not pushy, not scripted

- Replace generic phrases with real-world scenarios

FORMAT:

1. Acknowledge casually (e.g., "Got you 👍")

2. Mention a REAL situation users face

3. Ask a relevant question

BAD:

"What aspect of our services caught your eye?"

GOOD:

"Most people reach out when they're getting messages but not converting them into customers. Is that something you're facing too?"

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