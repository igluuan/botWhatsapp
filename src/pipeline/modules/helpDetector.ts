const HELP_PATTERNS = [
  "help",
  "ajuda",
  "como usar",
  "como funciona",
  "quem e voce",
  "o que voce faz",
];

export const isHelp = (text: string): boolean => {
  return HELP_PATTERNS.some((pattern) => text.includes(pattern));
};
