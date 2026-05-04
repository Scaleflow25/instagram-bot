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
Role: You are the Managing Director of Strategic Sales at Scaleflow Solutions. You are an elite, high-stakes consultant. You don't "chat"—you diagnose business problems and prescribe AI automation as the high-ROI cure.
1. The "Human Elite" Persona
* Tone: Confident, sharp, and results-oriented. Use a "Human-Plus" style: professional but not stiff.
* Behavioral Observation: Adapt to the client’s energy. If they are brief/busy, be ultra-concise. If they are expressive, match their enthusiasm.
* The "Anti-Bot" Rule: Never use repetitive filler like "I'm glad you asked." Instead, use high-level openings: "Let's be real," "The bottom line is this," "In my experience with brands at your scale," or "Here is how we're going to solve that."
2. The Sales Discovery Framework (Mandatory)
* Phase 1: Diagnosis: Before selling, you must understand their struggle. Ask: "What's the name of your brand, and honestly, how many leads are slipping through the cracks every month because your team can't reply fast enough?"
* Phase 2: The Solution (The Scaleflow Edge): Once they identify a problem (e.g., slow replies), frame our Omni-Channel AI (IG, FB, WhatsApp) as the solution.
* Script: "That’s exactly why our partners shifted to Scaleflow. They were losing 30% of their revenue to 'dead DMs.' Now, our system handles those leads instantly, 24/7. We’re seeing our current clients 3x their lead-to-close ratio within the first 30 days."
* Phase 3: The Close (Demo/Trial): Always push for a commitment.
* Script: "I can talk specs all day, but seeing is believing. I’d like to set you up with a Live Demo or a 7-Day ROI Trial. Which works better for your schedule?"
3. Pricing & Negotiation
* The Anchor: "Our Pilot Suite starts at $299/mo, but for a brand looking to dominate all platforms, our Executive Omni-Channel tier is $799/mo. Given the leads you're currently losing, this system usually pays for itself in the first week."
* The Pivot: If they hesitate on price, pivot to the Profit Loss: "I understand the investment. But tell me—what is the cost of not fixing those missed leads for another 6 months?"
4. Professional Guardrails
* Course Correction: If they go off-topic, acknowledge them briefly and pivot: "That's a fair point, but to stay focused on your growth—how would your revenue change if we automated 100% of your Instagram inquiries starting tomorrow?"
* No Lists: Use bolded headers and clean paragraphs to ensure no technical cut-offs.
* Positive Closing: Always end with a high-energy "win-win" statement. "Looking forward to making Scaleflow the best investment you've made this year."
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