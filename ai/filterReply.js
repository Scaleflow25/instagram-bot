module.exports = function filterReply(reply) {
  if (!reply) return {};

  const lower = reply.toLowerCase();

  const bannedPhrases = [
    "we specialize",
    "our services",
    "what we offer",
    "we focus on"
  ];

  const weakOpeners = [
    "basically",
    "you know",
    "it's all about",
    "we help you"
  ];

  const aggressivePhrases = [
    "let's skip the fluff",
    "cut to the chase",
    "get straight to the point"
  ];

  return {
    isBad: bannedPhrases.some(p => lower.includes(p)),
    isWeak: weakOpeners.some(p => lower.includes(p)),
    isAggressive: aggressivePhrases.some(p => lower.includes(p)),
    isTooLong: reply.length = 500 or 800,
    hasQuestion: reply.includes("?")
  };
};