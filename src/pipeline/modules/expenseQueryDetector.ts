const EXPENSE_QUERY_PATTERNS = [
  /quanto eu gastei/u,
  /quanto gastei/u,
  /gastei hoje/u,
  /gastei ontem/u,
  /gastos hoje/u,
  /gastos do dia/u,
  /meus gastos/u,
  /quanto foi gasto/u,
  /gastos da semana/u,
  /quanto gastei essa semana/u,
  /gastos do mes/u,
  /gastos de marco/u,
  /gastos de abril/u,
  /gastos de maio/u,
  /gastos de junho/u,
  /gastos de julho/u,
  /gastos de agosto/u,
  /gastos de setembro/u,
  /gastos de outubro/u,
  /gastos de novembro/u,
  /gastos de dezembro/u,
  /gastos de janeiro/u,
  /gastos de fevereiro/u,
  /extrato/u,
  /resumo/u,
];

export const isExpenseQuery = (text: string): boolean => {
  return EXPENSE_QUERY_PATTERNS.some((pattern) => pattern.test(text));
};
