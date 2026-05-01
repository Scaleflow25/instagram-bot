module.exports = function filterReply(reply) {
  if (!reply) return {};

  const lower = reply.toLowerCase();

  const bannedPhrases = [
    "we specialize",
    "our services",
    "what we offer",
    "we help businesses",
    "i’d love to",
    "our solutions",
    "streamline",
    "automating conversations"
  ];

  const weakOpeners = [
    "it's all about",
    "basically we",
    "we help you",
    "our goal is",
    "we provide"
  ];

  const isBad = bannedPhrases.some(p => lower.includes(p));
  const isWeak = weakOpeners.some(p => lower.includes(p));
  const isTooLong = reply.length > 200;
  const hasQuestion = reply.includes("?");

  return {
    isBad,
    isWeak,
    isTooLong,
    hasQuestion
  };
};