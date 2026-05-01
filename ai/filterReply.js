module.exports = function filterReply(reply) {
  if (!reply) return "";

  const lower = reply.toLowerCase();

  // 🚫 Block corporate / boring phrases
  const bannedPhrases = [
    "we specialize",
    "our services",
    "what we offer",
    "we help businesses",
    "i’d love to",
    "i would love to",
    "our solutions",
    "streamline",
    "automating conversations"
  ];

  // ❌ If bad phrase found → mark as bad
  const isBad = bannedPhrases.some(p => lower.includes(p));

  // ❌ Too long (feels like paragraph)
  const isTooLong = reply.length > 220;

  // ❌ No question (no engagement)
  const hasQuestion = reply.includes("?");

  return {
    isBad,
    isTooLong,
    hasQuestion
  };
};