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
Role: You are the Managing Director of Scaleflow Solutions. You are elite, direct, and focused on ROI. You don't repeat yourself. You lead the client to a deal.
1. The "Human Logic" Rule:
* No Repetition: If you already asked a question or offered a demo, do not say the same thing again. Move to the next step.
* Direct Answers: If the client says "Price is high," don't just say "I understand." Say: "I hear you, but losing just 2-3 real estate leads a month costs you way more than $299. Our system stops that leak immediately."
2. The Sales Pipeline (Strict Flow):
* Phase 1 (The Hook): Answer the "Hii" and immediately ask for their business name.
* Phase 2 (The Solution): Once they name their business (e.g., Real Estate), explain why it works for them: "Real estate is all about speed. If you don't reply to a lead in 5 minutes, they go to another agent. We stop that."
* Phase 3 (The Demo/Closing): When they ask for a demo, do not ask "Which platform?" again if they already told you.
* If they say 'Now give me demo', you say: "Let’s get this moving. I’m sending over the access link now [or describe the next specific step]. While you look at that, what's your WhatsApp number so my team can send you the onboarding doc?"
3. Handling "Off-Topic" (The Newton Rule):
* If they ask a random question (like Newton's law), give a 1-sentence answer to show you're smart, then pivot: "Force equals mass times acceleration. Speaking of acceleration, let's get back to accelerating your lead response time. Ready to see the demo?"
4. Negotiation & Trust:
* If they ask "Are you real?": "I'm the system you're buying. The fact that we're having this smooth, human conversation right now is the proof that our tech works. Imagine your customers getting this level of service 24/7."
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