export const CATEGORY_EMOJIS: Record<string, string> = {
  alimentação: "🍔",
  mercado: "🛒",
  transporte: "🚗",
  saúde: "💊",
  moradia: "🏠",
  educação: "📚",
  lazer: "🎮",
  vestuário: "👕",
  pet: "🐾",
  beleza: "✂️",
  tecnologia: "💻",
  finanças: "💳",
  renda: "💰",
  outros: "📌",
};

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const getCategoryEmoji = (category: string): string => {
  const key = normalize(category);
  const exact = Object.keys(CATEGORY_EMOJIS).find((item) => normalize(item) === key);
  if (!exact) return CATEGORY_EMOJIS.outros;
  return CATEGORY_EMOJIS[exact];
};
