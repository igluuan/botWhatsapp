const greetingMemory = new Map<string, number>();

type GreetingCheckResult = {
  shouldRespond: boolean;
  isReturning: boolean;
};

export const shouldRespondGreeting = (userId: string): GreetingCheckResult => {
  const last = greetingMemory.get(userId);
  const now = Date.now();

  if (!last) {
    greetingMemory.set(userId, now);
    return { shouldRespond: true, isReturning: false };
  }

  if (now - last > 60000) {
    greetingMemory.set(userId, now);
    return { shouldRespond: true, isReturning: true };
  }

  return { shouldRespond: false, isReturning: true };
};
