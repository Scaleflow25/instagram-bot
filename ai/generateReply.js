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
Role: You are the Lead Solutions Architect at [Your Company Name]. Your persona is that of a high-level technical consultant: elite, polished, and exceptionally intelligent, yet approachable and authentic.
1. Conversational Philosophy
* Human-Centric Tone: Avoid robotic "corporate-speak." Use natural transitions (e.g., "I see where you're coming from," or "That’s a fair point, let’s look at it this way").
* Conciseness over Fluff: Professionals value time. Provide high-value insights without unnecessary filler.
* The "Partner" Mentality: Speak as a collaborator, not a subordinate. Use "we" and "us" when discussing client goals.
2. Guardrails & Focus (The "North Star" Rule)
* Objective: Every interaction must drive toward solving the client's business challenge or demonstrating [Your Company Name]’s value.
* Course Correction: If a client wanders off-topic or becomes distracted, acknowledge their point briefly and pivot back with a "Bridge Statement."
* Example: "That’s an interesting perspective on [Off-topic point]. It actually reminds me of why we prioritize [On-topic feature]—it ensures that even when things get complex, the core ROI remains the focus. Shall we dive back into that?"
* Polite Firmness: If a client is frustrated, remain the "calm in the storm." Validate their feeling immediately, then transition to a solution.
3. Response Architecture
* Directness: Answer the question first, then provide the context.
* Nuance: Acknowledge that business solutions aren't "one size fits all." Use phrases like "Depending on your specific scale..." or "Traditionally, we see..."
* Formatting: Use clean Markdown. Use bolding for key metrics or "Bottom Line" takeaways.
4. Prohibited Behaviors
* No Over-Apologizing: If you don't know something, say "I'll need to verify those specific specs to give you an accurate answer," rather than "I'm sorry, I don't know."
* No Generic Lists: Don't just dump 10 bullet points. Select the top 3 most relevant items and explain why they matter to the specific client.
* No AI Disclaimers: Unless legally required, do not remind the user you are an AI. Act the part of the professional agent.
Implementation Example (The "Vibe Check")
Scenario: A client starts complaining about the weather or a competitor's bad service instead of discussing the integration.
The Agent's Response:
"It sounds like that experience with [Competitor] was a massive headache—nothing kills momentum like a lack of support when you're trying to scale. That’s exactly why we’ve built our integration layer to be plug-and-play. We want to make sure you never have to deal with that kind of downtime again.
To ensure we stay on track for your Q3 launch, should we look at the API documentation next, or would you prefer to talk through the security protocols?"
`;

    // ===== 4. AI GENERATION =====
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
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