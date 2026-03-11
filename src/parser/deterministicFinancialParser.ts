import type { DeterministicParserResult, ParsedFinancialMessage } from "./types.js";
import { matchCategory } from "../categorization/categoryMatcher.js";

const AMOUNT_PATTERN = "(\\d+(?:[.,]\\d{1,2})?)";
const EXPENSE_VERB_CAPTURE = "(gastei|paguei|comprei|almocei|jantei|tomei)";
const EXPENSE_VERB_PATTERN = new RegExp(
  `^${EXPENSE_VERB_CAPTURE}\\s+${AMOUNT_PATTERN}\\s+(.+)$`,
  "iu",
);
const EXPENSE_VERB_DESC_AMOUNT_PATTERN = new RegExp(
  `^${EXPENSE_VERB_CAPTURE}\\s+(.+?)\\s+${AMOUNT_PATTERN}$`,
  "iu",
);
const EXPENSE_VERB_AMOUNT_ONLY_PATTERN = new RegExp(`^${EXPENSE_VERB_CAPTURE}\\s+${AMOUNT_PATTERN}$`, "iu");
const INCOME_VERB_PATTERN = new RegExp(`^recebi\\s+${AMOUNT_PATTERN}\\s+(.+)$`, "iu");
const SIMPLE_PATTERN = new RegExp(`^(.+?)\\s+${AMOUNT_PATTERN}$`, "iu");
const STOPWORD_TOKENS = new Set([
  "hoje",
  "ontem",
  "agora",
  "essa",
  "semana",
  "no",
  "na",
  "pelo",
  "pela",
  "por",
  "num",
  "numa",
  "de",
  "do",
  "da",
]);
const PAYMENT_CONTEXT_TOKENS = new Set(["pix", "credito", "debito", "dinheiro", "cash", "cartao"]);
const FOOD_VERB_INFERENCE: Record<string, { description: string; category: string } | null> = {
  almocei: { description: "almoço", category: "alimentação" },
  jantei: { description: "jantar", category: "alimentação" },
  tomei: { description: "lanche", category: "alimentação" },
  comprei: null,
  gastei: null,
  paguei: null,
};

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

const isMeaningfulToken = (token: string): boolean => {
  const normalizedToken = normalizeKey(token.replace(/[^\p{L}\p{N}]/gu, ""));
  if (!normalizedToken) return false;
  if (STOPWORD_TOKENS.has(normalizedToken)) return false;
  if (PAYMENT_CONTEXT_TOKENS.has(normalizedToken)) return false;
  return true;
};

const cleanDescription = (rawDescription: string): string | null => {
  const normalized = normalizeSpaces(rawDescription).toLowerCase();
  const withoutTemporalPhrase = normalized.replace(/\bessa semana\b/giu, " ");
  const cleanedTokens = withoutTemporalPhrase.split(" ").filter(isMeaningfulToken);
  const cleaned = normalizeSpaces(cleanedTokens.join(" "));
  if (cleaned.length < 2) return null;
  return cleaned;
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
  return matchCategory(description, type);
};

const buildResult = (
  type: "expense" | "income",
  rawAmount: string,
  rawDescription: string,
  verb?: string,
): DeterministicParserResult => {
  const amount = parseAmount(rawAmount);
  let description = cleanDescription(rawDescription);

  if (!amount) {
    return {
      matched: false,
      reason: "invalid-amount-or-description",
      data: null,
    };
  }

  if (!description && type === "expense" && verb) {
    const inferred = FOOD_VERB_INFERENCE[normalizeKey(verb)] ?? null;
    if (inferred) {
      description = inferred.description;
    }
  }

  if (!description) {
    return {
      matched: false,
      reason: "no-meaningful-description",
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
    const [, verb, amount, description] = expenseVerbMatch;
    return buildResult("expense", amount, description, verb);
  }

  const expenseVerbDescriptionAmountMatch = text.match(EXPENSE_VERB_DESC_AMOUNT_PATTERN);
  if (expenseVerbDescriptionAmountMatch) {
    const [, verb, description, amount] = expenseVerbDescriptionAmountMatch;
    return buildResult("expense", amount, description, verb);
  }

  const expenseVerbAmountOnlyMatch = text.match(EXPENSE_VERB_AMOUNT_ONLY_PATTERN);
  if (expenseVerbAmountOnlyMatch) {
    const [, verb, amount] = expenseVerbAmountOnlyMatch;
    return buildResult("expense", amount, "", verb);
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
