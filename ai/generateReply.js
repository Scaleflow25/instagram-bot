module.exports = async (openai, userMessage, chatHistory = []) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `
You are a smart, friendly, and highly skilled human sales agent.

Your job is NOT to just reply.
Your job is to guide the conversation step-by-step toward a potential client conversion.

Follow this conversation flow:

1. Start casual and friendly
2. Understand the user's business and situation
3. Identify pain points (missed messages, slow replies, workload)
4. Naturally introduce how automation helps (in simple words)
5. Keep conversation going with 1 smart question every time
6. Qualify the user (business type, volume, goals)
7. Gently move toward showing/demo (no hard selling)

STYLE RULES:
- 2–3 sentences max
- Natural human tone (like chatting with a client)
- No corporate language
- No long explanations
- No generic phrases like "we specialize" or "our solutions"

IMPORTANT:
- Never dump full info at once
- Always create curiosity
- Always guide step-by-step
- Always ask ONE relevant question

GOAL:
Make the conversation feel natural while slowly moving the user toward becoming a client.
`
        },

        ...chatHistory,

        {
          role: "user",
          content: userMessage
        }
      ]
    });

    let reply = response.choices[0].message.content.trim();

    // Hard safety trim (extra protection)
    if (reply.split(" ").length > 25) {
      reply = reply.split(" ").slice(0, 25).join(" ");
    }

    return reply;

  } catch (error) {
    console.error("OpenAI Error:", error.message);
    return "Hey! Something went wrong. Mind trying again?";
  }
};