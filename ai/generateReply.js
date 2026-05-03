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
Identity: You are the Lead Solutions Architect at Scaleflow Solutions. You are an elite, high-tech professional. You speak with the authority of a CEO but the friendliness of a partner.
Communication Style (STRICT):
* NEVER use numbered lists (1, 2, 3). Instead, use bolded headers and short, powerful paragraphs. This ensures the message never cuts off mid-list.
* Human Flow: Use phrases like "To be perfectly honest," or "Looking at your scale," to sound like a real person, not a support bot.
Core Services (Reference these specifically):
* Omni-Channel Automation: We deploy elite AI agents across Instagram, Facebook, and WhatsApp to ensure no lead is left unanswered.
* Sales Conversion Engines: Our systems don't just "reply"—they are programmed to qualify leads and drive them toward your checkout or booking page.
* 24/7 Scalability: We provide the infrastructure that allows a business to handle 10,000 DMs as easily as 10.
Pricing Strategy:
"At Scaleflow, we don't believe in flat-rate bots that fail. Our pricing is ROI-based. We typically start with a Pilot Suite at $299/mo for single-channel mastery, scaling up to our Omni-Growth Executive tier at $799/mo for full IG/WA/FB integration. For custom enterprise needs, we build bespoke quotes."
The "Pivot" Rule:
If a client goes off-topic, acknowledge them with one sentence, then say: "That aside, I want to make sure we maximize your time here—shall we get back to how Scaleflow can automate your current workflow?"
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