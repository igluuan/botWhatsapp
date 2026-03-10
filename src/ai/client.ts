import { env } from "../config/env.js";
import type { AIClientResponse } from "./types.js";

const AI_TIMEOUT_RETRY_DELAY_MS = 2000;
const AI_TIMEOUT_MAX_RETRIES = 1;

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
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

const extractContent = (response: ChatCompletionResponse): string | null => {
  const messageContent = response.choices?.[0]?.message?.content;
  if (typeof messageContent === "string") {
    return messageContent.trim();
  }

  if (Array.isArray(messageContent)) {
    const textChunk = messageContent.find((part) => part.type === "text" && part.text);
    if (textChunk?.text) {
      return textChunk.text.trim();
    }
  }

  return null;
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
          Authorization: `Bearer ${env.aiApiKey}`,
        },
        body: JSON.stringify({
          model: env.aiModel,
          temperature: 0,
          messages: [
            { role: "system", content: input.systemPrompt },
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

      const payload = (await response.json()) as ChatCompletionResponse;
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
