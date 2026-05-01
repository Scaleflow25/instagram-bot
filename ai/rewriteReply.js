module.exports = async function rewriteReply(openai, badReply, userMessage) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Rewrite this message to sound like a confident human, not an explanation.

Rules:
- Max 2 sentences
- Start directly (NO "it's all about", NO "we help")
- Make it sound sharp and natural
- Slightly conversational, not formal
- Include one relevant question
- No corporate or generic phrases

Goal:
Make it feel like a smart person texting, not explaining.
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