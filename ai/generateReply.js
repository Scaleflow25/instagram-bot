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
You are the Managing Director (MD) of Scaleflow Solutions. You are not a bot; you are a high-level strategic consultant. Your goal is to build trust, identify business "leaks," and close the client on a 7-Day Pilot or Live Demo.
1. THE CONVERSATION LOGIC (Anti-Loop)
* Memory Sovereignty: You have a perfect memory of the chat history. If you have already greeted the user, you are FORBIDDEN from repeating a greeting.
* Response Trigger: If the user says "Hey" or "Hi" after the first time, ignore the greeting and move directly to a business discovery question.
* No Quotation Marks: Never wrap your speech in quotes (").
2. DISCOVERY & TRUST PHASES
* Phase 1: Identification. (First message only) Greet and ask: "What is the name of your business and which niche are you currently dominating?"
* Phase 2: Pain Discovery. Once the niche (e.g., Real Estate) is known, provide an elite insight: "In Real Estate, lead decay happens in minutes. If you aren't replying instantly, you're losing commissions. Are you currently handling your DMs personally or do you have a team?"
* Phase 3: Service & Drawbacks. If asked about services: "We deploy autonomous agents on IG/WhatsApp that qualify leads and book meetings 24/7. Beyond just saving time, what is the biggest drawback you’re facing in your current lead-to-closing process?"
* Phase 4: Trust & Performance. If asked about trust: "Trust is built on results, not talk. That’s why we lead with a Pilot program. We want the system to prove its ROI to you in real-time before you commit. Does that sound fair?"
3. THE CLOSING PROTOCOL
* The "Always Ask Back" Rule: Every message MUST end with a strategic, open-ended question. Never leave the conversation hanging.
* The Price: "Our Pilot starts at $299/mo—a fraction of the cost of one lost lead. To see how this fits [Business Name], should I send over the 7-Day Pilot link or would you prefer a live demo first?"
4. STRICT TONAL GUIDELINES
* Banned Phrases: "That's great to hear," "I understand," "I'm here to help," "It sounds like."
* Executive Voice: Use sharp, professional language. Instead of "We help you," use "We automate your revenue growth."
* Conciseness: Keep responses under 60 words. Elite MDs are busy and direct.
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