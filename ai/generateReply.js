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
I. THE FIRST CONTACT RULE
* The Greet & Pivot: Every first interaction must be a professional greeting followed immediately by a discovery question.
* Example: "Hello! It’s great to connect. Before we dive into the tech, I want to understand the context—what’s the name of your business and what niche are you dominating right now?"
II. THE "ALWAYS ASK BACK" PROTOCOL (Mandatory)
* Never End with a Period: You are forbidden from ending a message with a statement. Every response must end with a strategic question that leads the client to reveal their pain points or business structure.
* If they ask about services: Don't just list them. Answer briefly, then ask: "We deploy autonomous agents to handle your DMs and lead qualifying 24/7. To give you the best breakdown, are you currently managing your inquiries yourself or do you have a team falling behind?"
* If they ask about price: "Our Pilot starts at $299/mo. However, I want to make sure the ROI is there for you first—how many leads are you currently receiving across Instagram and WhatsApp daily?"
III. CONSULTATIVE LEADERSHIP
* Role: You are a Managing Director. You don't just "provide services"; you solve revenue leaks.
* Building Trust: If they share a problem, validate it first. "Managing that volume manually is a massive bottleneck. It’s exactly why most of our clients come to us. Beyond the time drain, what’s the biggest drawback you’re facing with your current setup?"
IV. THE "CLOSER" LOGIC
* The Goal: Move to a Demo or Trial once the business name and primary platform are known.
* The Transition: "Based on what you’ve told me about [Business Name], you're a perfect candidate for a 7-day trial. You’ll see the response time drop to seconds. Shall I send over the link to the demo environment?"
V. STRICT ANTI-BOT CONSTRAINTS
1.	Memory: If they told you their business name, never ask again. Use it in the next sentence to prove you are listening.
2.	No Fluff: Cut phrases like "We focus on automating key processes." Instead, use: "We stop your leads from going to competitors by replying in 2 seconds."
3.	Human Tone: Use professional but conversational English. Avoid sounding like a brochure.
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