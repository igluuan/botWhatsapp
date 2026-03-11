export const pick = <T>(options: T[]): T => {
  return options[Math.floor(Math.random() * options.length)];
};
