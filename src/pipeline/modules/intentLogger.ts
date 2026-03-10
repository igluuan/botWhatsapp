export const logIntent = (userId: string, intent: string): void => {
  console.log({
    user: userId,
    intent,
    timestamp: Date.now(),
  });
};
