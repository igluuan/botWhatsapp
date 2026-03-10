import type { DeterministicParserResult } from "../../parser/types.js";
import { hasMoneyValue } from "./moneyDetector.js";

export const shouldUseAI = (
  text: string,
  parserResult: DeterministicParserResult,
): boolean => {
  if (!hasMoneyValue(text)) return false;
  if (parserResult.matched) return false;
  return true;
};
