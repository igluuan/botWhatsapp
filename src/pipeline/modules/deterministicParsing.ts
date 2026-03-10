import { parseDeterministicFinancialMessage } from "../../parser/deterministicFinancialParser.js";
import type { DeterministicParserResult } from "../../parser/types.js";
import { extractTextContent } from "./extractTextContent.js";
import { normalizeMessage } from "./messageNormalizer.js";

export const runDeterministicParsing = (
  rawPayload: unknown,
  shouldTrigger: boolean,
  extractedTextOverride?: string | null,
): DeterministicParserResult => {
  if (!shouldTrigger) {
    return {
      matched: false,
      reason: "trigger-not-enabled",
      data: null,
    };
  }

  const text = extractedTextOverride?.trim() || extractTextContent(rawPayload);
  if (!text) {
    return {
      matched: false,
      reason: "no-supported-text-content",
      data: null,
    };
  }

  return parseDeterministicFinancialMessage(normalizeMessage(text));
};
