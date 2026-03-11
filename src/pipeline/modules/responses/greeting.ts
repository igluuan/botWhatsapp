import { pick } from "./picker.js";

const GREETING_VARIATIONS = [
  [
    "Oi! 👋 Seu bot de finanças aqui.",
    "É só mandar o gasto que eu anoto!",
    "Ex: *uber 25* ou *mercado 80*",
  ].join("\n"),
  [
    "E aí! 💬 Pronto pra ajudar com as finanças.",
    "Manda *ajuda* pra ver tudo que sei fazer.",
  ].join("\n"),
  [
    "Oi! 🤑 Anoto gastos e receitas na hora.",
    "Manda um gasto pra testar: *café 8*",
  ].join("\n"),
];

const RETURNING_GREETING_VARIATIONS = [
  "De volta! 👋 Precisando de algo?",
  "Oi de novo! 😄 Manda o que precisar.",
];

export const greetingResponse = (isReturning = false): string => {
  if (isReturning) {
    return pick(RETURNING_GREETING_VARIATIONS);
  }
  return pick(GREETING_VARIATIONS);
};
