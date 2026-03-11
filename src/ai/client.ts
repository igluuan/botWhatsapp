import { env } from "../config/env.js";
import type { AIClientResponse } from "./types.js";

const AI_TIMEOUT_RETRY_DELAY_MS = 2000;
const AI_TIMEOUT_MAX_RETRIES = 1;

type AnthropicResponse = {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
};

export class AIRequestError extends Error {
  public status?: number;

  public constructor(message: string, status?: number) {
    super(message);
    this.name = "AIRequestError";
    this.status = status;
  }
}

const extractContent = (response: AnthropicResponse): string | null => {
  const block = response.content?.find((b) => b.type === "text" && b.text);
  return block?.text?.trim() ?? null;
};

const sleep = async (delayMs: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
};

const isTimeoutError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return error.name === "TimeoutError" || error.name === "AbortError";
};

export const requestAIInterpretation = async (input: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<AIClientResponse> => {
  if (!env.aiEnabled) {
    throw new Error("ai-disabled");
  }

  if (!env.aiApiKey) {
    throw new Error("ai-api-key-missing");
  }

  for (let attempt = 0; attempt <= AI_TIMEOUT_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(env.aiApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.aiApiKey,
          "anthropic-version": env.aiAnthropicVersion,
        },
        body: JSON.stringify({
          model: env.aiModel,
          max_tokens: 1024,
          temperature: 0,
          system: input.systemPrompt,
          messages: [
            { role: "user", content: input.userPrompt },
          ],
        }),
        signal: AbortSignal.timeout(env.aiTimeoutMs),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`AI Request Failed: ${response.status} ${response.statusText}`, errorBody);
        throw new AIRequestError(`ai-request-failed-${response.status}`, response.status);
      }

      const payload = (await response.json()) as AnthropicResponse;
      const content = extractContent(payload);
      if (!content) {
        throw new AIRequestError("ai-empty-response");
      }

      return { content };
    } catch (error) {
      const shouldRetryTimeout = isTimeoutError(error) && attempt < AI_TIMEOUT_MAX_RETRIES;
      if (!shouldRetryTimeout) {
        throw error;
      }
      await sleep(AI_TIMEOUT_RETRY_DELAY_MS);
    }
  }

  throw new AIRequestError("ai-request-failed");
};
