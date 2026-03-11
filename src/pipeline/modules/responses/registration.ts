import { getCategoryEmoji } from "./categoryEmojis.js";
import { pick } from "./picker.js";

const toCurrency = (value: number): string => {
  return value.toFixed(2).replace(".", ",");
};

const capitalize = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
};

type RegistrationInput = {
  type: "expense" | "income";
  description: string;
  amount: number;
  category: string;
  transactionId: string;
};

export const registrationResponse = (input: RegistrationInput): string => {
  const shortId = input.transactionId.slice(0, 8);
  const amount = `R$ ${toCurrency(input.amount)}`;
  const emoji = getCategoryEmoji(input.category);
  const category = input.category;
  const description = input.description;

  if (input.type === "income") {
    return pick([
      `${emoji} Entrada anotada! ${amount}\n${category} · 🆔 #${shortId}`,
      `Boa! 🤑 ${amount} entrou\n📌 ${category} · 🆔 #${shortId}`,
    ]);
  }

  return pick([
    `${emoji} Anotei! ${description} — ${amount}\n🏷️ ${category} · 🆔 #${shortId}`,
    `💸 Registrei o gasto!\n${description} · ${amount} · ${category}\n🆔 #${shortId}`,
    `${emoji} ${capitalize(description)} — ${amount}\ntá registrado! 🆔 #${shortId}`,
  ]);
};
