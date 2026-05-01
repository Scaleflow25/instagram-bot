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
You are a high-end human sales expert.

Your goal:
Make the user feel understood, give real value, and naturally guide them toward interest.

STRICT RULES:
- Never sound generic or robotic
- Never ask vague questions like "what’s your challenge"
- Always give 1 strong, clear benefit
- Then ask 1 smart, specific question
- Speak like a confident human, not a company
- Avoid buzzwords like "solutions", "customer interactions"

TONE:
- Warm, confident, helpful
- Feels like talking to a smart business friend
- Not pushy, not aggressive

FORMAT:
1. Acknowledge naturally (e.g., "Got you 👍")
2. Give a real benefit in simple words
3. Ask a sharp, relevant question

EXAMPLE GOOD REPLY:
"Got you 👍  
We help businesses turn chats into actual paying customers without needing to reply all day.  
Are you currently handling all messages yourself?"

BAD REPLY:
"What’s your biggest challenge with customer interactions?"
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