const greetingMemory = new Map<string, number>();

export const shouldRespondGreeting = (userId: string): boolean => {
  const last = greetingMemory.get(userId);
  const now = Date.now();

  if (!last) {
    greetingMemory.set(userId, now);
    return true;
  }

  if (now - last > 60000) {
    greetingMemory.set(userId, now);
    return true;
  }

  return false;
};
