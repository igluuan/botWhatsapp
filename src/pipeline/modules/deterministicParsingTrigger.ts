import type {
  AuthorizationResult,
  DeterministicParsingTriggerResult,
  MediaDetectionResult,
} from "../types.js";

export const runDeterministicParsingTrigger = (
  authorization: AuthorizationResult,
  mediaDetection: MediaDetectionResult,
): DeterministicParsingTriggerResult => {
  if (!authorization.isAuthorized) {
    return {
      shouldTrigger: false,
      reason: "blocked-by-authorization",
    };
  }

  if (mediaDetection.hasMedia) {
    return {
      shouldTrigger: false,
      reason: "blocked-by-media",
    };
  }

  return {
    shouldTrigger: true,
    reason: "ready-for-deterministic-parser",
  };
};
