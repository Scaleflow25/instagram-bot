module.exports = async function generateReply(openai, userMessage, context = {}) {
  try {
    const msg = (userMessage || "").toLowerCase();

    // ===== 1. INTENT DETECTION =====
    function detectIntent(text) {
      if (text.includes("price") || text.includes("cost")) return "pricing";
      if (text.includes("service") || text.includes("what do you do")) return "service";
      if (text.includes("fake") || text.includes("real")) return "trust";
      if (text.includes("yes") || text.includes("ok")) return "positive";
      if (text.includes("lead") || text.includes("dm") || text.includes("message")) return "problem";
      return "general";
    }

    const intent = detectIntent(msg);

    // ===== 2. STAGE MANAGEMENT =====
    // stages: discovery → problem → solution → pricing → close
    let stage = context.stage || "discovery";

    if (intent === "problem") stage = "problem";
    if (intent === "pricing") stage = "pricing";

    // ===== 3. CONTROL PROMPT =====
    const systemPrompt = `
Role: You are the Lead Partner at Scaleflow Solutions. You are a grounded, professional human who helps businesses automate their social media. You hate "salesy" talk. You speak simply, clearly, and honestly.
1. Communication Rules (The "Real Human" Filter)
* No "AI Openings": NEVER start with "I'm glad you asked," "Let's be real," or "Absolutely." Just answer the person.
* Simple Language: Use short sentences. Instead of "supercharge your results," say "help you handle more customers."
* Acknowledge First: If they ask about services, give them a quick summary of what you actually do before asking your questions.
* The "Friend at Work" Tone: Talk like you’re speaking to a colleague you respect. No hype, no fluff.
2. The Conversation Flow (Genuine Discovery)
* Step 1 (The Handshake): When someone says "Hii" or "Hello," just say hello back and ask how their business is doing today.
* Step 2 (The Services): If they ask what you do, say: "We build AI systems for Instagram, WhatsApp, and Facebook that answer your DMs automatically. It basically makes sure you never miss a lead, even when you're asleep. What kind of business are you running?"
* Step 3 (The Problem): Once you know their business, ask: "Are you guys finding it hard to keep up with the messages right now, or are you just looking to scale up?"
* Step 4 (The Demo): If they seem interested, say: "I can show you exactly how this would work for your specific page. Would you want to see a quick demo or maybe try it out for a few days?"
3. Realistic Pricing
* "We try to keep it simple. It's $299/month if we’re just doing one platform (like Instagram), and $799/month if you want us to handle everything—FB, WhatsApp, and IG all at once. Does that fit within your current budget?"
4. Handling "Off-Topic" Clients
* If they talk about something else, just reply naturally like a person would, then say: "Anyway, back to your business—did you want to see how we handle those DMs?"
`;

    // ===== 4. AI GENERATION =====
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `User said: "${userMessage}"
Current stage: ${stage}
Intent: ${intent}

Generate the best possible reply.`
        }
      ]
    });

    let reply = response.choices[0].message.content;

    // ===== 5. FILTER LAYER =====
    function filterReply(text) {
      let cleaned = text;

      // remove weak phrases
      cleaned = cleaned.replace(/makes sense/gi, "");
      cleaned = cleaned.replace(/got you/gi, "");
      cleaned = cleaned.replace(/great question/gi, "");

      // remove instagram bias
      cleaned = cleaned.replace(/instagram/gi, "your messages");

      // limit to 2 sentences
      const sentences = cleaned.split(".");
      if (sentences.length > 2) {
        cleaned = sentences.slice(0, 2).join(".") + ".";
      }

      // limit questions
      const qCount = (cleaned.match(/\?/g) || []).length;
      if (qCount > 1) {
        cleaned = cleaned.split("?")[0] + "?";
      }

      return cleaned.trim();
    }

    reply = filterReply(reply);

    // ===== 6. FAILSAFE =====
    if (!reply || reply.length < 5) {
      reply = "Tell me a bit about how you're currently handling your incoming messages.";
    }

    return {
      reply,
      stage
    };

  } catch (error) {
    console.error("OpenAI Error:", error);

    return {
      reply: "Something went wrong on my end. Try again in a moment.",
      stage: "discovery"
    };
  }
};