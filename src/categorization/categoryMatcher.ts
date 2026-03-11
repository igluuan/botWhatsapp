import { CATEGORY_RULES, CANONICAL_LABELS } from "./categories.js";

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const hasKeywordMatch = (text: string, rawKeyword: string): boolean => {
  const keyword = normalize(rawKeyword);
  if (!keyword) return false;
  if (keyword.includes(" ")) {
    return text.includes(keyword);
  }
  const tokens = text.split(" ");
  return tokens.includes(keyword);
};

export const matchCategory = (
  description: string,
  transactionType: "expense" | "income" = "expense",
): string => {
  const key = normalize(description);

  if (!key) {
    return transactionType === "income" ? "renda" : "outros";
  }

  if (transactionType === "income") {
    const incomeRule = CATEGORY_RULES.find((r) => r.label === "renda");
    if (incomeRule) {
      const hit =
        incomeRule.keywords.some((kw) => hasKeywordMatch(key, kw)) ||
        incomeRule.aliases.some((a) => hasKeywordMatch(key, a));
      if (hit || key.length < 4) return "renda";
    }
  }

  for (const rule of CATEGORY_RULES) {
    if (normalize(rule.label) === key) return rule.label;
    if (rule.aliases.some((a) => normalize(a) === key)) return rule.label;
  }

  for (const rule of CATEGORY_RULES) {
    if (rule.label === "outros") continue;
    if (rule.keywords.some((kw) => normalize(kw).includes(" ") && hasKeywordMatch(key, kw))) {
      return rule.label;
    }
  }

  for (const rule of CATEGORY_RULES) {
    if (rule.label === "outros") continue;
    if (rule.keywords.some((kw) => !normalize(kw).includes(" ") && hasKeywordMatch(key, kw))) {
      return rule.label;
    }
  }

  for (const rule of CATEGORY_RULES) {
    if (rule.label === "outros") continue;
    if (rule.aliases.some((a) => hasKeywordMatch(key, a))) return rule.label;
  }

  const tokens = key.split(" ").filter((t) => t.length > 2);
  for (const rule of CATEGORY_RULES) {
    if (rule.label === "outros") continue;
    if (
      tokens.some((token) =>
        rule.keywords.some((kw) => normalize(kw) === token || normalize(kw).startsWith(token)),
      )
    ) {
      return rule.label;
    }
  }

  return transactionType === "income" ? "renda" : "outros";
};

export const resolveAICategory = (
  aiCategory: string,
  description: string,
  transactionType: "expense" | "income" = "expense",
): string => {
  const key = normalize(aiCategory);

  const canonical = CANONICAL_LABELS.find((l) => normalize(l) === key);
  if (canonical) return canonical;

  const aliasRule = CATEGORY_RULES.find((rule) =>
    rule.aliases.some((a) => normalize(a) === key),
  );
  if (aliasRule && aliasRule.label !== "outros") {
    return aliasRule.label;
  }

  return matchCategory(description || aiCategory, transactionType);
};
