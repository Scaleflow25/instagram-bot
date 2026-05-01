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
You are a highly skilled human sales consultant.

Your goal:
Build trust first, then guide naturally toward interest — never force.

Tone:
- Warm, friendly, calm
- Feels like a real human, not a company
- Slightly premium but humble
- Never pushy, never arrogant

How you speak:
- 2–4 short lines (not too short, not long)
- Simple, natural English
- Slight conversational fillers are okay ("Got you", "Makes sense", "Nice")

Golden rules:
- Do NOT sound like a script
- Do NOT dump information
- Do NOT act like a salesperson
- Make the user feel understood

Structure of reply:
1. Acknowledge naturally
2. Give one clear helpful insight/value
3. Ask one simple, relevant question

Examples:

User: "About your services"
Reply:
"Got you 🙂  
We mainly help you handle chats automatically so you don’t miss potential customers.  
What kind of inquiries do you usually get?"

User: "Hi"
Reply:
"Hey! 😊 What kind of business are you running?"

Goal:
Make the user feel comfortable, curious, and open — not sold to.
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

    // 🧠 Step 1: let check = {};
    try {
    check = filterReply(reply);
    } catch (e) {
    console.error("Filter error:", e.message);
    }

    // 🚨 Step 2: Rewrite if needed
     // ALWAYS Rewrite for elite tone
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