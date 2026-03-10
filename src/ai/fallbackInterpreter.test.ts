import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./client.js", () => ({
  AIRequestError: class AIRequestError extends Error {
    public status?: number;

    public constructor(message: string, status?: number) {
      super(message);
      this.name = "AIRequestError";
      this.status = status;
    }
  },
  requestAIInterpretation: vi.fn(),
}));

import { AIRequestError, requestAIInterpretation } from "./client.js";
import { interpretFinancialMessageWithAI } from "./fallbackInterpreter.js";

describe("interpretFinancialMessageWithAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts valid structured JSON output", async () => {
    vi.mocked(requestAIInterpretation).mockResolvedValue({
      content:
        '{"type":"expense","amount":42.35,"category":"transporte","payment_method":"pix","description":"uber casa"}',
    });

    const result = await interpretFinancialMessageWithAI("corrida de uber por 42,35");

    expect(result).toEqual({
      matched: true,
      reason: "ai-match",
      data: {
        type: "expense",
        amount: 42.35,
        category: "transporte",
        payment_method: "pix",
        description: "uber casa",
      },
    });
  });

  it("rejects invalid AI output missing required amount", async () => {
    vi.mocked(requestAIInterpretation).mockResolvedValue({
      content: '{"type":"expense","category":"geral","description":"sem valor"}',
    });

    const result = await interpretFinancialMessageWithAI("anota ai");

    expect(result).toEqual({
      matched: false,
      reason: "ai-invalid-response",
      data: null,
    });
  });

  it("returns timeout classification when AI client times out", async () => {
    const timeoutError = new Error("timeout");
    timeoutError.name = "TimeoutError";
    vi.mocked(requestAIInterpretation).mockRejectedValue(timeoutError);

    const result = await interpretFinancialMessageWithAI("gastei com mercado");

    expect(result).toEqual({
      matched: false,
      reason: "ai-timeout",
      data: null,
    });
  });

  it("returns insufficient credits classification on status 402", async () => {
    vi.mocked(requestAIInterpretation).mockRejectedValue(
      new AIRequestError("ai-request-failed-402", 402),
    );

    const result = await interpretFinancialMessageWithAI("gastei com mercado");

    expect(result).toEqual({
      matched: false,
      reason: "ai-insufficient-credits",
      data: null,
    });
  });

  it("returns request failure when AI client throws unknown error", async () => {
    vi.mocked(requestAIInterpretation).mockRejectedValue(new Error("network-error"));

    const result = await interpretFinancialMessageWithAI("gastei com mercado");

    expect(result).toEqual({
      matched: false,
      reason: "ai-request-failed",
      data: null,
    });
  });
});
