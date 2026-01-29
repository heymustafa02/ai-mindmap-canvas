export const truncateWords = (
  text?: string,
  maxWords: number = 20
): string => {
  if (!text || typeof text !== "string") return "";

  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;

  return words.slice(0, maxWords).join(" ") + "...";
};
