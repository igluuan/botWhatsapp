import type { DeterministicParserResult, ParsedFinancialMessage } from "./types.js";

const AMOUNT_PATTERN = "(\\d+(?:[.,]\\d{1,2})?)";
const EXPENSE_VERB_PREFIX = "(?:gastei|paguei|comprei|almocei|jantei|tomei)";
const EXPENSE_VERB_PATTERN = new RegExp(`^${EXPENSE_VERB_PREFIX}\\s+${AMOUNT_PATTERN}\\s+(.+)$`, "iu");
const EXPENSE_VERB_DESC_AMOUNT_PATTERN = new RegExp(
  `^${EXPENSE_VERB_PREFIX}\\s+(.+?)\\s+${AMOUNT_PATTERN}$`,
  "iu",
);
const INCOME_VERB_PATTERN = new RegExp(`^recebi\\s+${AMOUNT_PATTERN}\\s+(.+)$`, "iu");
const SIMPLE_PATTERN = new RegExp(`^(.+?)\\s+${AMOUNT_PATTERN}$`, "iu");

const normalizeSpaces = (text: string): string => {
  return text.replace(/\s+/g, " ").trim();
};

const normalizeCurrencySuffixes = (text: string): string => {
  return text
    .replace(/r\$\s*(\d+(?:[.,]\d{1,2})?)/giu, "$1")
    .replace(/(\d+(?:[.,]\d{1,2})?)\s*reais?/giu, "$1");
};

const normalizeKey = (text: string): string => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const parseAmount = (rawAmount: string): number | null => {
  const normalized = rawAmount.trim();
  const decimalAdjusted =
    normalized.includes(",") && normalized.includes(".")
      ? normalized.replace(/\./g, "").replace(",", ".")
      : normalized.replace(",", ".");
  const amount = Number(decimalAdjusted);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return Math.round(amount * 100) / 100;
};

const detectPaymentMethod = (description: string): string | null => {
  const key = normalizeKey(description);

  if (key.includes("pix")) return "pix";
  if (key.includes("credito") || key.includes("cartao de credito")) return "credit_card";
  if (key.includes("debito") || key.includes("cartao de debito")) return "debit_card";
  if (key.includes("dinheiro") || key.includes("cash")) return "cash";
  return null;
};

const detectCategory = (description: string, type: "expense" | "income"): string => {
  const key = normalizeKey(description);

  if (type === "income") {
    if (key.includes("salario")) return "salário";
    return "renda";
  }

  if (key.includes("uber") || key.includes("taxi") || key.includes("onibus")) return "transporte";
  if (key.includes("pizza") || key.includes("cafe") || key.includes("restaurante")) {
    return "alimentação";
  }
  if (key.includes("mercado") || key.includes("supermercado")) return "mercado";
  return "geral";
};

const buildResult = (
  type: "expense" | "income",
  rawAmount: string,
  rawDescription: string,
): DeterministicParserResult => {
  const amount = parseAmount(rawAmount);
  const description = normalizeSpaces(rawDescription).toLowerCase();

  if (!amount || !description) {
    return {
      matched: false,
      reason: "invalid-amount-or-description",
      data: null,
    };
  }

  const parsed: ParsedFinancialMessage = {
    type,
    amount,
    category: detectCategory(description, type),
    payment_method: detectPaymentMethod(description),
    description,
  };

  return {
    matched: true,
    reason: "deterministic-match",
    data: parsed,
  };
};

export const parseDeterministicFinancialMessage = (
  content: string,
): DeterministicParserResult => {
  const text = normalizeCurrencySuffixes(normalizeSpaces(content));
  if (!text) {
    return {
      matched: false,
      reason: "empty-message",
      data: null,
    };
  }

  const incomeMatch = text.match(INCOME_VERB_PATTERN);
  if (incomeMatch) {
    const [, amount, description] = incomeMatch;
    return buildResult("income", amount, description);
  }

  const expenseVerbMatch = text.match(EXPENSE_VERB_PATTERN);
  if (expenseVerbMatch) {
    const [, amount, description] = expenseVerbMatch;
    return buildResult("expense", amount, description);
  }

  const expenseVerbDescriptionAmountMatch = text.match(EXPENSE_VERB_DESC_AMOUNT_PATTERN);
  if (expenseVerbDescriptionAmountMatch) {
    const [, description, amount] = expenseVerbDescriptionAmountMatch;
    return buildResult("expense", amount, description);
  }

  const simpleMatch = text.match(SIMPLE_PATTERN);
  if (simpleMatch) {
    const [, description, amount] = simpleMatch;
    return buildResult("expense", amount, description);
  }

  return {
    matched: false,
    reason: "no-supported-pattern",
    data: null,
  };
};
