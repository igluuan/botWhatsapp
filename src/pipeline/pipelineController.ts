import { env } from "../config/env.js";
import { runAIFallback } from "./modules/aiFallback.js";
import { runAuthorizationCheck } from "./modules/authorizationCheck.js";
import { runDeterministicParsing } from "./modules/deterministicParsing.js";
import { runDeterministicParsingTrigger } from "./modules/deterministicParsingTrigger.js";
import { runIntentRouting } from "./modules/intentRouting.js";
import { runMediaDetection } from "./modules/mediaDetection.js";
import { runMediaProcessing } from "./modules/mediaProcessing.js";
import { runMessageLogging } from "./modules/messageLogging.js";
import { extractTextContent } from "./modules/extractTextContent.js";
import { detectIntent } from "./modules/intentDetector.js";
import { normalizeMessage } from "./modules/messageNormalizer.js";
import { shouldUseAI } from "./modules/aiGuard.js";
import type { PipelineControllerResult, PipelineIncomingMessage } from "./types.js";

export const runMessagePipeline = async (
  message: PipelineIncomingMessage,
): Promise<PipelineControllerResult> => {
  const rawText = extractTextContent(message.rawPayload) ?? "";
  const normalizedText = rawText ? normalizeMessage(rawText) : "";
  const intent = normalizedText ? detectIntent(normalizedText) : "unknown";
  const authorization = runAuthorizationCheck(message, env.authorizedWhatsappJids);

  if (!authorization.isAuthorized) {
    return {
      authorization,
      messageLog: await runMessageLogging(message, false),
      mediaDetection: runMediaDetection(message.rawPayload),
      mediaProcessing: {
        processed: false,
        mediaType: null,
        extractedText: null,
        reason: "unauthorized",
      },
      deterministicParsingTrigger: { shouldTrigger: false, reason: "unauthorized" },
      deterministicParsing: { matched: false, reason: "unauthorized", data: null },
      intentRouting: { route: "unauthorized", reason: "unauthorized" },
      aiFallback: { matched: false, reason: "unauthorized", data: null },
      intent,
    };
  }

  const messageLog = await runMessageLogging(message, authorization.isAuthorized);
  const mediaDetection = runMediaDetection(message.rawPayload);
  const mediaProcessing = await runMediaProcessing(message.rawPayload, mediaDetection);
  const deterministicParsingTrigger = runDeterministicParsingTrigger(authorization, mediaDetection);
  const deterministicParsing = runDeterministicParsing(
    message.rawPayload,
    deterministicParsingTrigger.shouldTrigger,
    mediaProcessing.extractedText,
  );
  const intentRouting = runIntentRouting(
    authorization,
    mediaDetection,
    deterministicParsingTrigger,
    deterministicParsing,
  );
  const fallbackTextSource =
    mediaProcessing.extractedText?.trim() || extractTextContent(message.rawPayload) || "";
  const normalizedFallbackText = normalizeMessage(fallbackTextSource);
  const shouldRunAIFallback =
    deterministicParsingTrigger.shouldTrigger &&
    shouldUseAI(normalizedFallbackText, deterministicParsing) &&
    intentRouting.route === "ai_fallback";
  const aiFallback = await runAIFallback(
    message.rawPayload,
    shouldRunAIFallback,
    mediaProcessing.extractedText,
  );

  return {
    authorization,
    messageLog,
    mediaDetection,
    mediaProcessing,
    deterministicParsingTrigger,
    deterministicParsing,
    intentRouting,
    aiFallback,
    intent,
  };
};
