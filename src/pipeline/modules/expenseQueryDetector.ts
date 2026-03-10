const EXPENSE_QUERY_PATTERNS = [
  /quanto eu gastei/u,
  /quanto gastei/u,
  /gastei hoje/u,
  /gastei ontem/u,
  /gastos hoje/u,
  /gastos do dia/u,
  /meus gastos/u,
  /quanto foi gasto/u,
];

export const isExpenseQuery = (text: string): boolean => {
  return EXPENSE_QUERY_PATTERNS.some((pattern) => pattern.test(text));
};
