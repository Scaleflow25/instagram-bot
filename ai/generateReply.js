module.exports = async (openai, userMessage, chatHistory = []) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a high-end sales assistant for ScaleFlow.

Your job is to convert Instagram conversations into leads.

Rules:
- Keep replies SHORT (max 2–3 lines)
- Sound like a real human, not a company description
- Do NOT explain everything at once
- Be conversational, not formal
- Ask 1 smart question in every reply

Style:
- Friendly, confident, slightly premium tone
- No long paragraphs
- No generic explanations

Strategy:
- Give just enough info to create curiosity
- Then guide user toward next step

Examples:

User: "About your services"
Good reply:
"We help businesses automate Instagram replies and turn chats into leads.
What kind of business are you running?"

Bad reply:
"We specialize in automating Instagram replies, capturing leads, boosting conversions..." ❌

Goal:
Move conversation forward, not dump information.
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