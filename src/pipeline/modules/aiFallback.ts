import { interpretFinancialMessageWithAI } from "../../ai/fallbackInterpreter.js";
import type { AIInterpretationResult } from "../../ai/types.js";
import { extractTextContent } from "./extractTextContent.js";
import { normalizeMessage } from "./messageNormalizer.js";

export const runAIFallback = async (
  rawPayload: unknown,
  shouldRunFallback: boolean,
  extractedTextOverride?: string | null,
): Promise<AIInterpretationResult> => {
  if (!shouldRunFallback) {
    return {
      matched: false,
      reason: "ai-fallback-not-required",
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

  return interpretFinancialMessageWithAI(normalizeMessage(text));
};
