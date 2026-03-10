import {
  generateDailySummary,
  generateMonthlySummary,
  generateWeeklySummary,
} from "../../services/financialService.js";
import { resolveOrCreateUserIdFromJid } from "../../services/userService.js";

const toCurrency = (value: number): string => {
  return value.toFixed(2).replace(".", ",");
};

const formatResponse = (title: string, total: number, count: number): string => {
  return [
    title,
    "",
    `Total: R$ ${toCurrency(total)}`,
    `Itens registrados: ${count}`,
  ].join("\n");
};

export const handleExpenseQuery = async (remoteJid: string, text: string): Promise<string> => {
  const userId = await resolveOrCreateUserIdFromJid(remoteJid);

  if (text.includes("ontem")) {
    const referenceDate = new Date();
    referenceDate.setDate(referenceDate.getDate() - 1);
    const summary = await generateDailySummary({ userId, referenceDate });
    return formatResponse("📊 Gastos de ontem", summary.totalExpense, summary.transactionCount);
  }

  if (text.includes("semana")) {
    const summary = await generateWeeklySummary({ userId });
    return formatResponse("📊 Gastos da semana", summary.totalExpense, summary.transactionCount);
  }

  if (text.includes("mes")) {
    const summary = await generateMonthlySummary({ userId });
    return formatResponse("📊 Gastos do mês", summary.totalExpense, summary.transactionCount);
  }

  const summary = await generateDailySummary({ userId });
  return formatResponse("📊 Gastos de hoje", summary.totalExpense, summary.transactionCount);
};
