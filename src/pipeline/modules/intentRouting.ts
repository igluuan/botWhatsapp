import type {
  AuthorizationResult,
  DeterministicParsingTriggerResult,
  IntentRoutingResult,
  MediaDetectionResult,
} from "../types.js";
import type { DeterministicParserResult } from "../../parser/types.js";

export const runIntentRouting = (
  authorization: AuthorizationResult,
  mediaDetection: MediaDetectionResult,
  deterministicParsingTrigger: DeterministicParsingTriggerResult,
  deterministicParsing: DeterministicParserResult,
): IntentRoutingResult => {
  if (!authorization.isAuthorized) {
    return {
      route: "unauthorized",
      reason: "authorization-rejected",
    };
  }

  if (mediaDetection.hasMedia) {
    return {
      route: "media_processing",
      reason: "media-message-detected",
    };
  }

  if (deterministicParsingTrigger.shouldTrigger) {
    if (deterministicParsing.matched) {
      return {
        route: "deterministic_parser",
        reason: "deterministic-parser-matched",
      };
    }

    return {
      route: "ai_fallback",
      reason: "deterministic-parser-no-match",
    };
  }

  return {
    route: "ai_fallback",
    reason: "deterministic-parser-not-triggered",
  };
};
