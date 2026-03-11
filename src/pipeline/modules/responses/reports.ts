import { getCategoryEmoji } from "./categoryEmojis.js";
import { pick } from "./picker.js";

const toCurrency = (value: number): string => {
  return value.toFixed(2).replace(".", ",");
};

const formatSignedCurrency = (value: number): string => {
  if (value < 0) {
    return `-R$ ${toCurrency(Math.abs(value))}`;
  }
  return `R$ ${toCurrency(value)}`;
};

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
};

const capitalize = (value: string): string => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const monthLabel = (date: Date): string => {
  return date.toLocaleDateString("pt-BR", { month: "long" });
};

type QueryType = "today" | "yesterday" | "week" | "month";

type BreakdownItem = {
  category: string;
  totalAmount: number;
  transactionCount: number;
};

type ReportInput = {
  queryType: QueryType;
  periodStart: Date;
  totalExpense: number;
  totalIncome: number;
  balance: number;
  breakdown: BreakdownItem[];
};

const reportHeader = (queryType: QueryType, periodStart: Date): string => {
  if (queryType === "today") return `📅 *Hoje, ${formatDate(periodStart)}*`;
  if (queryType === "yesterday") return `📅 *Ontem, ${formatDate(periodStart)}*`;
  if (queryType === "week") return "📆 *Semana atual*";
  return `📆 *${capitalize(monthLabel(periodStart))} — até agora*`;
};

const contextualLines = (input: ReportInput): string[] => {
  const lines: string[] = [];
  if (input.balance > 0 && input.balance > input.totalExpense * 0.5) {
    lines.push(pick(["Tá no azul! 💙", "Mês controlado! 👏", "Tá indo bem 🟢"]));
  } else if (input.balance > 0) {
    lines.push(pick(["Fechou no positivo 👍", "Tá equilibrado ⚖️"]));
  } else if (input.balance < 0) {
    lines.push(pick(["Tomou um susto? 😅", "Ficou no vermelho esse período 🔴", "Dá pra ajustar! 💪"]));
  }

  if (input.breakdown.length > 0) {
    const top = input.breakdown.reduce((acc, item) => {
      if (!acc || item.totalAmount > acc.totalAmount) return item;
      return acc;
    }, null as BreakdownItem | null);
    if (top) {
      lines.push(`${getCategoryEmoji(top.category)} ${capitalize(top.category)} foi o maior gasto`);
    }
  }

  const totalTransactions = input.breakdown.reduce((sum, item) => sum + item.transactionCount, 0);
  if (totalTransactions >= 10) {
    lines.push(`Foram ${totalTransactions} lançamentos nesse período, tá acompanhando bem! 💪`);
  }

  return lines;
};

export const reportResponse = (input: ReportInput): string => {
  const lines = [reportHeader(input.queryType, input.periodStart), ""];

  if (input.breakdown.length === 0) {
    lines.push("Sem gastos registrados no período.");
  } else {
    for (const item of input.breakdown) {
      lines.push(
        `${getCategoryEmoji(item.category)} ${capitalize(item.category)}     R$ ${toCurrency(item.totalAmount)}   ${item.transactionCount}x`,
      );
    }
  }

  lines.push(
    "",
    "━━━━━━━━━━━━━━━━━━",
    queryTypeLabel(input.queryType, input.totalExpense, input.totalIncome, input.balance),
  );

  const context = contextualLines(input);
  if (context.length > 0) {
    lines.push("", ...context);
  }

  return lines.join("\n");
};

const queryTypeLabel = (
  queryType: QueryType,
  totalExpense: number,
  totalIncome: number,
  balance: number,
): string => {
  if (queryType === "month") {
    return [
      `💸 Total gasto   R$ ${toCurrency(totalExpense)}`,
      `💰 Receitas      R$ ${toCurrency(totalIncome)}`,
      `📊 Sobrou        ${formatSignedCurrency(balance)}`,
    ].join("\n");
  }
  return [
    `💸 Gasto     R$ ${toCurrency(totalExpense)}`,
    `💰 Receita   R$ ${toCurrency(totalIncome)}`,
    `📊 Saldo    ${formatSignedCurrency(balance)}`,
  ].join("\n");
};
