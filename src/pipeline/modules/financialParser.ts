export const parseExpense = (text: string): { type: "expense"; description: string; amount: number } | null => {
  const match = text.match(/([a-zA-Z]+)\s+(\d+(?:[.,]\d{1,2})?)/);
  if (!match) return null;

  const description = match[1];
  const amount = Number(match[2].replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return {
    type: "expense",
    description,
    amount,
  };
};
