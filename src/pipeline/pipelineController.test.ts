import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env.js", () => ({
  env: {
    authorizedWhatsappJids: ["5511999999999@s.whatsapp.net"],
  },
}));

vi.mock("./modules/messageLogging.js", () => ({
  runMessageLogging: vi.fn().mockResolvedValue({ logId: "log-1" }),
}));

vi.mock("./modules/mediaDetection.js", () => ({
  runMediaDetection: vi.fn().mockReturnValue({
    hasMedia: true,
    mediaType: "audioMessage",
  }),
}));

vi.mock("./modules/mediaProcessing.js", () => ({
  runMediaProcessing: vi.fn().mockResolvedValue({
    processed: true,
    mediaType: "audio",
    extractedText: "gastei 19,90 uber",
    reason: "audio-transcribed",
  }),
}));

vi.mock("./modules/deterministicParsingTrigger.js", () => ({
  runDeterministicParsingTrigger: vi.fn().mockReturnValue({
    shouldTrigger: true,
    reason: "ready-for-deterministic-parser",
  }),
}));

vi.mock("./modules/deterministicParsing.js", () => ({
  runDeterministicParsing: vi.fn().mockReturnValue({
    matched: false,
    reason: "no-supported-pattern",
    data: null,
  }),
}));

vi.mock("./modules/intentRouting.js", () => ({
  runIntentRouting: vi.fn().mockReturnValue({
    route: "ai_fallback",
    reason: "deterministic-parser-no-match",
  }),
}));

vi.mock("./modules/aiFallback.js", () => ({
  runAIFallback: vi.fn().mockResolvedValue({
    matched: true,
    reason: "ai-match",
    data: {
      type: "expense",
      amount: 19.9,
      category: "transporte",
      payment_method: "pix",
      description: "uber",
    },
  }),
}));

import { runAIFallback } from "./modules/aiFallback.js";
import { runDeterministicParsing } from "./modules/deterministicParsing.js";
import { runMessagePipeline } from "./pipelineController.js";

describe("runMessagePipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes extracted media text through deterministic and AI fallback stages", async () => {
    const result = await runMessagePipeline({
      messageId: "msg-1",
      remoteJid: "5511999999999@s.whatsapp.net",
      pushName: "Tester",
      timestamp: new Date("2026-03-09T12:00:00.000Z"),
      rawPayload: {
        message: {
          audioMessage: {
            mimetype: "audio/ogg",
          },
        },
      },
    });

    expect(runDeterministicParsing).toHaveBeenCalledWith(
      expect.anything(),
      true,
      "gastei 19,90 uber",
    );
    expect(runAIFallback).toHaveBeenCalledWith(expect.anything(), true, "gastei 19,90 uber");
    expect(result.mediaProcessing.extractedText).toBe("gastei 19,90 uber");
    expect(result.aiFallback.matched).toBe(true);
  });
});
