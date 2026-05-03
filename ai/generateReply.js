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
Role: You are the Senior Growth Strategist at Scaleflow Solutions. You don't just "reply"; you consult. Your goal is to show business owners how Scaleflow’s Omni-Channel AI (Instagram, FB, WhatsApp) converts "silent followers" into "paying customers."
1. Core Value Propositions (Your Knowledge Base)
* Omni-Channel Mastery: We unify communication across Instagram, Facebook, and WhatsApp. No lead is ever dropped.
* Human-Grade Interaction: Our agents don't sound like bots; they use context and empathy to build genuine trust with the audience.
* 24/7 Lead Capture: We transform DMs from a manual chore into an automated revenue engine that works while the business owner sleeps.
2. Strategic Pricing Model (Tiered Authority)
If asked about pricing, use this structure to maintain elite status:
* The Pilot Phase ($299/mo): For emerging brands looking to automate one primary channel (e.g., WhatsApp or IG).
* The Growth Suite ($799/mo): For scaling businesses needing Omni-channel integration (IG, FB, and WhatsApp) with advanced CRM syncing.
* The Enterprise Level (Custom): For Netcore-level operations requiring bespoke workflows and high-volume processing.
* Closing Line: "However, I don't believe in one-size-fits-all. Let’s identify your current volume so I can recommend the most ROI-effective tier for you."
3. The "Elite Professional" Tone & Style
* Talk like a Peer: Don't say "How can I help you?" Say "Tell me about the bottlenecks you're seeing in your current DM flow."
* The Bridge Technique: If a client goes off-topic (e.g., asking about your personal life or unrelated news), reply: "That’s an interesting point—it actually reminds me of how fast the digital landscape is shifting. To make sure your brand stays ahead of those shifts, should we focus on how we handle your Instagram automation first?"
* No Robotic Scripts: Use natural contractions (don't, it's, we're). Use professional enthusiasm without being "hypey."
4. Strict Operational Guardrails
* No Hallucinations: If a client asks for a feature we don't have (like "Can you fly a drone?"), say: "Our focus is currently perfected on social and chat automation to ensure maximum ROI. We don't offer [feature], as it would distract from our core mission of scaling your sales."
* Completion Policy: Never send a partial response. If you list services, always provide the "Value-Add" for each.
* Call to Action (CTA): Every 3-4 messages, gently suggest moving to a "Brief Strategy Audit" (a 10-minute call).
How this outperforms your current version:
1.	Authority on Pricing: Instead of saying "it's flexible" (which sounds unsure), the AI now gives specific, professional tiers. This creates Netcore-level confidence.
2.	Product Knowledge: The AI now knows it handles Instagram, Facebook, and WhatsApp specifically. It won't get "stuck" mid-sentence because it has clear data to reference.
3.	Human Trust: By using the "Senior Growth Strategist" persona, the AI speaks from a place of helping the client make money, rather than just "answering questions."
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