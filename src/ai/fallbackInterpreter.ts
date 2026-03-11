import type { ParsedFinancialMessage } from "../parser/types.js";
import { resolveAICategory } from "../categorization/categoryMatcher.js";
import { AIRequestError, requestAIInterpretation } from "./client.js";
import { buildAIInterpretationPrompt } from "./promptBuilder.js";
import type { AIInterpretationResult } from "./types.js";

const toStringValue = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const parseJSON = (content: string): unknown => {
  const trimmed = content.trim();
  const jsonCandidate = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
    : trimmed;
  return JSON.parse(jsonCandidate);
};

const normalizeData = (payload: unknown): ParsedFinancialMessage | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as Record<string, unknown>;
  const type = value.type;
  const amount = value.amount;
  const category = toStringValue(value.category);
  const description = toStringValue(value.description);
  const paymentMethodRaw = value.payment_method;

  if (type !== "expense" && type !== "income") {
    return null;
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  if (!category || !description) {
    return null;
  }
  if (
    paymentMethodRaw !== null &&
    paymentMethodRaw !== undefined &&
    typeof paymentMethodRaw !== "string"
  ) {
    return null;
  }

  const paymentMethod = toStringValue(paymentMethodRaw) ?? null;
  return {
    type,
    amount: Math.round(amount * 100) / 100,
    category: resolveAICategory(category, description ?? "", type),
    payment_method: paymentMethod ? paymentMethod.toLowerCase() : null,
    description: description.toLowerCase(),
  };
};

export const interpretFinancialMessageWithAI = async (
  messageText: string,
): Promise<AIInterpretationResult> => {
  const normalizedText = messageText.trim();
  if (!normalizedText) {
    return {
      matched: false,
      reason: "empty-message",
      data: null,
    };
  }

  const prompt = buildAIInterpretationPrompt(normalizedText);
  let responseContent = "";

  try {
    const response = await requestAIInterpretation({
      systemPrompt: prompt.system,
      userPrompt: prompt.user,
    });
    responseContent = response.content;
    if (process.env.NODE_ENV !== "production") {
      console.log("AI Response:", responseContent);
    }
  } catch (error) {
    console.error("AI Interpretation Request Error:", error);
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return {
        matched: false,
        reason: "ai-timeout",
        data: null,
      };
    }
    if (error instanceof AIRequestError && error.status === 402) {
      return {
        matched: false,
        reason: "ai-insufficient-credits",
        data: null,
      };
    }
    return {
      matched: false,
      reason: "ai-request-failed",
      data: null,
    };
  }

  try {
    const payload = parseJSON(responseContent);
    const normalizedData = normalizeData(payload);

    if (!normalizedData) {
      console.warn("AI output invalid:", payload);
      return {
        matched: false,
        reason: "ai-invalid-response",
        data: null,
      };
    }

    return {
      matched: true,
      reason: "ai-match",
      data: normalizedData,
    };
  } catch (error) {
    console.error("AI Interpretation Parse Error:", error);
    return {
      matched: false,
      reason: "ai-invalid-response",
      data: null,
    };
  }
};
