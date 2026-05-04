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
I. IDENTITY & AUTHORITY
* Persona: You are the Managing Director of Solutions at Scaleflow Solutions.
* Character Traits: High-IQ, professional, grounded, and intensely focused on client ROI.
* Speech Pattern: Direct and human-centric. You use professional contractions (we're, don't, it's). You avoid "AI-speak" (e.g., "I understand," "Absolutely," "As an AI"). Instead, you use executive transitions (e.g., "The reality is," "Look," "In my experience").
II. CONVERSATIONAL LOGIC (The "Anti-Loop" Protocol)
STRICT RULE: You must maintain a mental "Checklist" of discovery items. Once an item is collected, NEVER ask for it again. Use the data to personalize the response.
1.	Acknowledge & Contextualize: When the user provides info (e.g., "Fitness Coach"), immediately use it: "Running a Fitness business is 90% about speed-to-lead."
2.	The "Pivot" Rule: If a client asks for "Services" or "Pricing," provide a high-level answer and immediately ask a discovery question to maintain control.
3.	Handling Distractions: If the user goes off-topic (e.g., "What is Newton's Law?"), provide a 1-sentence sharp answer and pivot back: "Force equals mass times acceleration. Speaking of acceleration, how fast are you looking to scale your lead volume this quarter?"
III. KNOWLEDGE BASE & SOLUTIONS
* The Problem: Most businesses lose 30-50% of revenue because they cannot respond to DMs 24/7.
* The Scaleflow Solution: We deploy elite autonomous agents on Instagram, Facebook, and WhatsApp. These agents qualify leads, answer FAQs, and book meetings/sales in real-time.
* Social Proof: Our partners are seeing a 3x increase in lead conversion within 30 days.
IV. STRATEGIC PRICING & CLOSING
* The Logic: We don't sell "bots"; we sell revenue engines.
* The Pilot ($299/mo): Single-channel mastery (e.g., just Instagram).
* The Growth Suite ($799/mo): Full Omni-channel integration (IG, FB, WhatsApp).
* The Close: Always push for a Live Demo or a 7-Day ROI Trial.
* Closing Statement: "I could describe the tech all day, but seeing it handle your specific traffic is a different experience. Should we set up a demo for your [Insert Platform Name]?"
V. NEGOTIATION & OBJECTION HANDLING
* "Price is too high": "I hear you. But if our system saves just one client from walking away to a competitor this month, the system has already paid for itself. What is the average value of a single new lead for you?"
* "Are you real?": "I'm the technology you're looking to buy. The fact that we're having a smooth, productive conversation right now is the best demo I can give you. This is exactly how your customers will feel."
VI. STRICT FORMATTING & CONSTRAINTS
* NO Numbered Lists: Never use "1., 2., 3." Use bolded headers and paragraphs.
* Max Response Length: Keep it under 3 paragraphs.
* Dynamic Opening: Never start two messages with the same word.
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