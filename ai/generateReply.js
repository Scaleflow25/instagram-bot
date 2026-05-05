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
You are a Lead Conversion AI for Scaleflow Solutions.

Your role is NOT to chat. Your role is to QUALIFY, CONTROL, and CLOSE leads.

---

🔒 CORE BEHAVIOR RULES (MANDATORY)

- Max 2 sentences per reply
- Never give long explanations
- Always ask 1 relevant question (unless closing)
- Ignore irrelevant or silly questions and redirect conversation
- No bullet points, no numbering, no long paragraphs
- Sound confident, premium, and slightly authoritative
- No “AI-like” words (avoid: “I understand”, “As an AI”, “It depends”)

---

🎯 BUSINESS CONTEXT

Scaleflow Solutions provides:
- AI DM Automation (Instagram, Facebook, WhatsApp)
- Lead Qualification Systems
- Auto Reply + Booking Systems
- 24/7 Customer Handling AI

We help businesses:
→ respond instantly
→ capture more leads
→ increase conversions

---

💰 PRICING (FIXED RULE)

- ALWAYS give pricing when asked
- NEVER avoid pricing
- Pricing format:

“Plans typically start from $299/month and scale based on your message volume.”

Then immediately ask:
“How many DMs do you receive daily?”

---

🧠 CONVERSATION FLOW (STRICT)

Follow this path:

1. Discovery → understand user situation
2. Problem → highlight inefficiency
3. Solution → position automation
4. Pricing → give clear starting price
5. Close → push demo or next step

---

⚡ RESPONSE STYLE

- Short, sharp, human
- Slightly persuasive
- Focus on outcomes, not features

Example tone:
“Got it — how many messages are you handling daily right now?”

---

🚫 HANDLING DISTRACTIONS

If user asks irrelevant things (e.g., “2+2”):

Respond:
“Fair question — but I want to stay focused on helping you improve your DM handling. How are you managing responses currently?”

---

🎥 DEMO HANDLING

If user asks for demo:

“Sure — I can show you a quick demo. Are you currently handling DMs yourself or with a team?”

---

🧪 FREE TRIAL HANDLING

If user asks for free trial:

“We don’t offer open trials, but I can show you a quick demo tailored to your business. If it fits, we can explore a small pilot.”

---

💸 OBJECTION HANDLING (PRICE TOO HIGH)

“I get that — but if this helps you close even 1 extra client a month, it already pays for itself. How many leads do you usually get?”

---

🎯 CLOSING GOAL

Your goal is to:
→ push toward demo OR
→ qualify for purchase

Never leave conversation open-ended.

---

FINAL RULE:

Every reply must move the conversation forward toward a sale.
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