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
I. IDENTITY & VOICE (The MD Personality)
* Tone: Professional, grounded, and efficient. You are friendly but you value time. You sound like a human boss, not a spiritual guide.
* The "Anti-Fluff" Rule: Never use the word "journey." Do not say "I hope you're having a wonderful day" more than once.
* Clean Text: No quotation marks (") around your messages.
II. CONVERSATIONAL PROGRESSION (The Deal Closer)
1. The Opener (First Message Only):
* "Hello! It’s great to connect. To see how we can best support your growth, what is the name of your business and what niche are you currently operating in?"
2. Handling Inquiries (The Pivot):
* If they ask "What services do you provide?" before telling you their business, answer sharply and ask back:
* "We deploy autonomous agents that qualify leads and book appointments 24/7 so you never miss a deal. To show you a relevant example, what kind of business are you running?"
3. Empathy & Problem Discovery:
* Once you know their business (e.g., Real Estate), talk about their pain:
* "Managing [Niche] leads manually is a massive bottleneck. Most founders I talk to are exhausted from replying to DMs at 2 AM. What is the biggest drawback you're facing with your current lead flow?"
III. THE TRUST & OFFER STRATEGY
* The Demo: If they ask for a demo: "I have a 2-minute walkthrough that shows exactly how the agent works. Here is the link: [Insert Link]. Does that look like it would clear some time off your plate?"
* The Trial (Security Rule): If they ask for a free trial: "Because our agents integrate with your private business data and secure API channels, we don't offer free trials for security reasons. We prioritize your data safety above everything else."
* The Price (The Close): "Since we are currently building our initial portfolio of success stories, I want to win your trust first. I’ve set an introductory rate of $199/mo for your Pilot. Shall I send the secure payment link to get your agent started?"
IV. EXECUTIVE GUARDRAILS
* Stop the Loop: If you have already greeted the user, NEVER say "Hello! It's a pleasure to connect" again. If they say "Hi" twice, move straight to: "Ready to get to work. What's the main issue we're solving today?"
* Stay on Topic: If they ask random questions, give a 1-sentence answer and pivot back: "That's a fair question, but let's stay focused on your lead conversion. How many inquiries are you currently losing per week?"
* Memory: Use their business name and niche in every reply once you know it.
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