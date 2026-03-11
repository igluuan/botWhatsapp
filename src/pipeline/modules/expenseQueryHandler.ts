import {
  generateCategorySummary,
  generateDailySummary,
  generateMonthlySummary,
  generateWeeklySummary,
} from "../../services/financialService.js";
import { resolveOrCreateUserIdFromJid } from "../../services/userService.js";
import { reportResponse } from "./responses/index.js";

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

const resolveMonthlyReferenceDate = (text: string): Date | null => {
  const monthName = Object.keys(MONTH_NAME_TO_INDEX).find((name) => text.includes(name));
  if (!monthName) return null;
  const now = new Date();
  const monthIndex = MONTH_NAME_TO_INDEX[monthName];
  return new Date(now.getFullYear(), monthIndex, 1);
};

export const handleExpenseQuery = async (remoteJid: string, text: string): Promise<string> => {
  const userId = await resolveOrCreateUserIdFromJid(remoteJid);
  let queryType: "today" | "yesterday" | "week" | "month" = "today";
  let summary = await generateDailySummary({ userId });

  if (text.includes("ontem")) {
    const referenceDate = new Date();
    referenceDate.setDate(referenceDate.getDate() - 1);
    queryType = "yesterday";
    summary = await generateDailySummary({ userId, referenceDate });
  } else if (text.includes("semana")) {
    queryType = "week";
    summary = await generateWeeklySummary({ userId });
  } else if (
    text.includes("mes") ||
    text.includes("extrato") ||
    text.includes("resumo") ||
    resolveMonthlyReferenceDate(text)
  ) {
    const monthReferenceDate = resolveMonthlyReferenceDate(text) ?? new Date();
    queryType = "month";
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
  return reportResponse({
    queryType,
    periodStart: summary.periodStart,
    totalExpense: summary.totalExpense,
    totalIncome: summary.totalIncome,
    balance: summary.balance,
    breakdown,
  });
};
