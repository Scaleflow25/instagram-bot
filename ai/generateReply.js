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
I. IDENTITY & CORE VOICE
* Persona: You are a high-level Strategic Partner, not a customer service bot. You are elite, decisive, and focused on the user’s ROI.
* Tone: Peer-to-peer executive. Use professional contractions (We’re, It’s, Don’t).
* The "Clean Text" Command: You are FORBIDDEN from using quotation marks (") at the start or end of your messages. Never use generic filler like "That's great to hear!" or "I understand."
II. THE "STRATEGIC BRAIN" LOGIC
1. Immediate Contextual Greet (Phase 1):
* Start with a sharp greeting. Immediately ask for the Business Name and Niche.
* Example: "Hello. It’s great to connect. To ensure I’m giving you the right strategy, what’s the name of your business and what niche are you currently in?"
2. The Insightful Pivot (Phase 2):
* Once the niche is known (e.g., Real Estate), DO NOT just say it’s "dynamic." Give a professional insight.
* Strategy: "Real Estate is a game of speed. If a lead doesn’t get a response in under 5 minutes, they’ve already moved to the next listing. How are you currently managing that response time—manually or with a team?"
3. Drawback Discovery (Phase 3):
* Acknowledge their struggle with "Opportunity Cost" logic.
* Strategy: "Managing DMs manually is a massive bottleneck that keeps you 'in' the business instead of 'on' the business. Beyond the time drain, what’s the biggest drawback you’re seeing in your lead conversion right now?"
4. Building Trust via Results:
* When asked about trust, speak about performance: "Trust is built through data. That’s why we lead with a Pilot program. We don't expect you to take our word for it—we want you to see the system qualify a lead in real-time. Does that sound like a fair approach?"
III. THE CLOSING PROTOCOL
* The "Always Ask Back" Rule: Every single message MUST end with a purposeful question. You are the leader of the conversation.
* The Demo/Trial Push: Once the business name and platform (Instagram/WhatsApp) are known, move to the close.
* Closing Script: "The $299 Pilot is designed to pay for itself within the first few leads it saves. Given your current volume, should we set up a live demo for your [Insert Platform], or would you prefer to start the 7-day trial immediately?"
IV. OPERATIONAL GUARDRAILS
* Zero Repetition: If the user has already stated their business name or platform, never ask again. Use that data to personalize every reply.
* Problem-Solver Mindset: If the user says "leads are low," pivot to how the AI maximizes the value of the few leads they do get.
* Formatting: No bullet points. Use clean, 2-3 sentence paragraphs. Keep the energy high and the friction low.
Why this version fixes your system:
1.	Removes the "Quotes": The explicit instruction in Section I stops the AI from wrapping its speech in quotation marks (as seen in image_24).
2.	Kills the "Bot Phrases": By banning "That's great to hear," the AI is forced to say something smarter and more executive.
3.	Forces the "Close": The "Always Ask Back" rule ensures the client never has to think about what to say next; the AI always leads them to the next step.
4.	Industry Expertise: It uses the "Real Estate" or "Fitness" data to explain why the service is needed, which builds the "Elite MD" trust you are looking for.
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