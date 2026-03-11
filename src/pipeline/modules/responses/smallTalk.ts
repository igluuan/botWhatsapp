import { pick } from "./picker.js";

const SMALL_TALK_VARIATIONS = [
  "Aqui é só sobre grana! 💸\nManda um gasto ou *ajuda* pra ver os comandos.",
  "Só entendo de finanças 🤑\nMas nisso sou ótimo! Manda *ajuda* pra começar.",
  "Essa eu não sei responder 😄\nMas posso anotar seus gastos! Ex: *uber 25*",
];

const UNKNOWN_VARIATIONS = [
  "Hmm, não entendi direito 🤔\nTenta assim: *mercado 50* ou *uber 25*",
  "Não saquei essa mensagem 😅\nTenta no formato: *descrição valor*",
];

export const smallTalkResponse = (): string => {
  return pick(SMALL_TALK_VARIATIONS);
};

export const unknownResponse = (): string => {
  return pick(UNKNOWN_VARIATIONS);
};
