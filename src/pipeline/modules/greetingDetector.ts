const GREETINGS = [
  "oi",
  "ola",
  "bom dia",
  "boa tarde",
  "boa noite",
  "e ai",
  "fala",
];

export const isGreeting = (text: string): boolean => {
  return GREETINGS.some((greeting) => text.startsWith(greeting));
};
