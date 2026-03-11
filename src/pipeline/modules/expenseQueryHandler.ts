import {
  generateCategorySummary,
  generateDailySummary,
  generateMonthlySummary,
  generateWeeklySummary,
} from "../../services/financialService.js";
import { resolveOrCreateUserIdFromJid } from "../../services/userService.js";

const toCurrency = (value: number): string => {
  return value.toFixed(2).replace(".", ",");
};

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
};

const MONTH_NAME_TO_INDEX: Record<string, number> = {
  janeiro: 0,
  fevereiro: 1,
  marco: 2,
  abril: 3,
  maio: 4,
  junho: 5,
  julho: 6,
  agosto: 7,
  setembro: 8,
  outubro: 9,
  novembro: 10,
  dezembro: 11,
};

const buildCategoryLine = (category: string, total: number, count: number): string => {
  return `🏷️ ${category}    R$ ${toCurrency(total)}  (${count}x)`;
};

const formatBreakdownResponse = (input: {
  title: string;
  periodStart: Date;
  periodEnd: Date;
  totalExpense: number;
  totalIncome: number;
  balance: number;
  breakdown: Array<{ category: string; totalAmount: number; transactionCount: number }>;
}): string => {
  const header = `${input.title} — ${formatDate(input.periodStart)}`;
  const lines = [header, ""];
  if (input.breakdown.length === 0) {
    lines.push("Sem gastos registrados no período.");
  } else {
    for (const item of input.breakdown) {
      lines.push(buildCategoryLine(item.category, item.totalAmount, item.transactionCount));
    }
  }
  lines.push(
    "─────────────────────────",
    `💰 Total  R$ ${toCurrency(input.totalExpense)}`,
    `📈 Receitas  R$ ${toCurrency(input.totalIncome)}`,
    `📉 Saldo  R$ ${toCurrency(input.balance)}`,
  );
  return lines.join("\n");
};

const resolveMonthlyReferenceDate = (text: string): Date | null => {
  const monthName = Object.keys(MONTH_NAME_TO_INDEX).find((name) => text.includes(name));
  if (!monthName) return null;
  const now = new Date();
  const monthIndex = MONTH_NAME_TO_INDEX[monthName];
  return new Date(now.getFullYear(), monthIndex, 1);
};

export const handleExpenseQuery = async (remoteJid: string, text: string): Promise<string> => {
  const userId = await resolveOrCreateUserIdFromJid(remoteJid);
  let title = "📊 Gastos de hoje";
  let summary = await generateDailySummary({ userId });

  if (text.includes("ontem")) {
    const referenceDate = new Date();
    referenceDate.setDate(referenceDate.getDate() - 1);
    title = "📊 Gastos de ontem";
    summary = await generateDailySummary({ userId, referenceDate });
  } else if (text.includes("semana")) {
    title = "📊 Gastos da semana";
    summary = await generateWeeklySummary({ userId });
  } else if (
    text.includes("mes") ||
    text.includes("extrato") ||
    text.includes("resumo") ||
    resolveMonthlyReferenceDate(text)
  ) {
    const monthReferenceDate = resolveMonthlyReferenceDate(text) ?? new Date();
    title = "📊 Gastos do mês";
    summary = await generateMonthlySummary({ userId, referenceDate: monthReferenceDate });
  }

  const categorySummary = await generateCategorySummary({
    userId,
    periodStart: summary.periodStart,
    periodEnd: summary.periodEnd,
  });
  const breakdown = categorySummary.items
    .filter((item) => item.type === "expense")
    .map((item) => ({
      category: item.category,
      totalAmount: item.totalAmount,
      transactionCount: item.transactionCount,
    }));
  return formatBreakdownResponse({
    title,
    periodStart: summary.periodStart,
    periodEnd: summary.periodEnd,
    totalExpense: summary.totalExpense,
    totalIncome: summary.totalIncome,
    balance: summary.balance,
    breakdown,
  });
};
