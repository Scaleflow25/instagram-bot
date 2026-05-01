module.exports = async function rewriteReply(openai, badReply, userMessage) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Rewrite this message to sound like a confident, natural human.

Rules:
- Max 2 sentences
- No corporate words
- No "we help businesses"
- No "our services"
- Keep it simple and conversational
- Include one natural question
- Sound like texting, not marketing
`
        },
        {
          role: "user",
          content: `User said: "${userMessage}"
Bad reply: "${badReply}"
Rewrite it better.`
        }
      ]
    });

    return response.choices[0].message.content;

  } catch (err) {
    console.error("Rewrite Error:", err.message);
    return badReply;
  }
};