const WEIGHT_PATTERNS: RegExp[] = [
  /\b\d+(?:[.,]\d+)?\s?(kg|g|mg|l|cl|ml)\b/gi,
  /\bx\s?\d+\b/gi,
  /\blot\sde\s\d+\b/gi,
  /\bpack\sde\s\d+\b/gi,
  /\b\d+\s*pack\b/gi,
  /\bpack\s*\d+\b/gi,
];

export function cleanIngredientName(name: string): string {
  let cleaned = name;
  for (const pattern of WEIGHT_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  cleaned = cleaned
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
  return cleaned || name;
}

