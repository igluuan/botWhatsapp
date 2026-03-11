export const logIntent = (userId: string, intent: string): void => {
  if (process.env.NODE_ENV !== "production") {
    console.log({
      user: userId,
      intent,
      timestamp: Date.now(),
    });
  }
};
