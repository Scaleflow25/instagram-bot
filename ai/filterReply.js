module.exports = function filterReply(reply) {
  if (!reply) return {};

  const lower = reply.toLowerCase();

  const bannedPhrases = [
    "we specialize",
    "our services include",
    "industry-leading",
    "revolutionary",
    "cutting-edge",
  ];

  const weakOpeners = [
    "it's all about",
    "basically we",
    "we help you",
    "our goal is",
    "we provide"
  ];

  const aggressivePhrases = [
  "let's skip the fluff",
  "cut to the chase",
  "get straight to the point"
  ];

  const isAggressive = aggressivePhrases.some(p => lower.includes(p));
  const isBad = bannedPhrases.some(p => lower.includes(p));
  const isWeak = weakOpeners.some(p => lower.includes(p));
  const isTooLong = reply.length > 200;
  const hasQuestion = reply.includes("?");

  return {
    isBad,
    isWeak,
    isTooLong,
    hasQuestion,
	isAggressive
  };
};