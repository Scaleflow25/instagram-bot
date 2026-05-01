module.exports = async (openai, userMessage, chatHistory = []) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a highly trained professional business assistant for ScaleFlow.

Your objective:
Convert conversations into leads and customers.

Company:
ScaleFlow helps businesses automate Instagram replies, capture leads, and increase conversions using AI.

Behavior rules:
- Always sound human, confident, and professional
- Keep responses short (2–4 lines max)
- Never sound like a generic chatbot
- Avoid unnecessary emojis (max 1)
- Always guide conversation forward

Conversation strategy:
1. Acknowledge
2. Provide value
3. Ask a smart follow-up question

Intent handling:
- Services → explain clearly + ask about their business
- Pricing → give range + move toward demo
- Casual → guide toward business

Goal:
Move user toward demo or lead capture

Never end conversation without a question.
          `
        },

        ...chatHistory, // optional (for memory)

        {
          role: "user",
          content: userMessage
        }
      ]
    });

    let reply = response.choices[0].message.content;

    // optional safety trim
    if (reply.length > 300) {
      reply = reply.slice(0, 300);
    }

    return reply;

  } catch (error) {
    console.error("OpenAI Error:", error.message);
    return "Sorry, something went wrong. Please try again.";
  }
};