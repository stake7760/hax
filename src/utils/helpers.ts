export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}min`);
  if (seconds || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(" ");
}

export function getTeamIcon(team: number): string {
  return team === 1 ? "🔴" : team === 2 ? "🔵" : "🟢";
}

export function getExponent(n: number): string {
  const exponents = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
  return n.toString().split("").map((d) => exponents[parseInt(d)] || "").join("");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function sanitizeAvatar(input: string): string {
  if (!input) return "";
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  const emojis = (input.match(emojiRegex) ?? []) as string[];
  const letters = input.replace(emojiRegex, "").trim();
  if (emojis.length > 0 && letters.length > 0 && input.indexOf(emojis[0]) === 0) return emojis[0];
  if (emojis.length >= 2) return emojis[0];
  if (emojis.length === 1 && letters.length === 0) return emojis[0];
  if (letters.length > 0 && emojis.length > 0 && input.indexOf(letters[0]) === 0) return input;
  if (letters.length > 2) return letters.slice(0, 2);
  return letters || emojis[0] || "";
}
