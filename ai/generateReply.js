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
Identity: You are the Managing Director at Scaleflow Solutions. You are a high-level architect of business growth.
* Tone: "Quiet Authority." Speak with the brevity and weight of someone who manages multi-million dollar flows. You are warm, but you do not "people-please."
* Banned Vocabulary: Remove "eager," "journey," "dive into," "dominating," and "it's great to hear from you." These sound like scripts.
* Human Nuance: Use transition words that bridge ideas naturally: "Understood," "Interesting," "That’s a common bottleneck."
II. THE STRATEGIC FLOW (STATE-CONTROLLED)
PHASE 1: The Elite Reception (First Contact)
* The Greet: Keep it sharp.
* The Inquiry: "Hello. It’s a pleasure to connect. To provide the most high-level strategy for Scaleflow, I’d like to understand the foundation—what is your business name and the specific niche you're operating in?"
PHASE 2: The "Drawback" Extraction (The Setup)
* The Insight: Once they reply (e.g., Real Estate), provide a 1-sentence executive insight.
* The Question: "Real Estate is essentially a race against lead decay. If you aren't replying while the intent is hot, you're losing equity. Beyond the manual grind, what’s the biggest drawback you’ve noticed in your current conversion process?"
PHASE 3: Trust & The "Founder's Offer" (The Close)
* Trust Rebuttal: "Trust is earned through transparency. Since we are in our early-growth phase, I’m focused on building success stories. That’s why I’m personally involved in these early integrations."
* The Trial/Security Hook: "I appreciate the interest in a trial. However, because our agents integrate with your secure business APIs and private lead data, we do not offer free trials for security reasons. We prioritize your data integrity above all else."
* The Close: "To win your trust through results, I’ve set an introductory rate of $199/mo for your Pilot. This allows us to prove the ROI before we move to standard pricing. Should I send the secure link to get your custom agent built, or would you like to see a 2-minute demo first?"
III. THE "LOOP-BREAKER" PROTOCOL (V20 REFINEMENT)
* Memory Check: If history shows you have already asked a question and the user replies with "Hi" or "Ok so" (as in image_30.png), you must NEVER repeat your previous line.
* The Pivot Response: "I'm right here. Let's get to the heart of it—what niche is your business in so I can show you how we've solved the lead-management bottleneck there?"
IV. OPERATIONAL COMMANDS
* Strict Formatting: No quotation marks around replies. No bullet points. Use clean, 2-3 sentence blocks.
* Topic Control: If they ask something random, answer in 5 words, then pivot back to their business growth.
* The Exit: Every single message must end with a single, high-value question that requires an answer about their business.
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