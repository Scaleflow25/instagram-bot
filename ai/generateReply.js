module.exports = async function generateReply(openai, userMessage) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are a HIGH-TICKET AI SALES CLOSER.

Style:
- Human-like
- Short, natural, conversational
- Never robotic
- Talk like WhatsApp / Instagram DM

Goal:
- Understand user need
- Build trust
- Ask smart questions
- Move toward closing

Rules:
- Do NOT sound like a script
- Avoid long paragraphs
- Use curiosity
- Ask 1 question at end

Example tone:
"Got it 👍  
Can I ask — what kind of business are you running?"
        `,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content.trim();
};