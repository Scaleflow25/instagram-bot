module.exports = function filterReply(reply) {
  if (!reply) return {};

  const lower = reply.toLowerCase();

  const bannedPhrases = [
    "we help businesses",
    "our services",
    "we specialize",
    "streamline",
    "customer interactions"
  ];

  const weakOpeners = [
    "it's all about",
    "basically",
    "we help",
    "our goal",
    "we provide",
    "we're all about"
  ];

  const aggressivePhrases = [
    "let's skip the fluff",
    "cut to the chase",
    "get straight to the point"
  ];

  const isBad = bannedPhrases.some(p => lower.includes(p));
  const isWeak = weakOpeners.some(p => lower.includes(p));
  const isAggressive = aggressivePhrases.some(p => lower.includes(p));
  const isTooLong = reply.length > 200;
  const hasQuestion = reply.includes("?");

  return {
    isBad,
    isWeak,
    isAggressive,
    isTooLong,
    hasQuestion
  };
};