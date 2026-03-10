import type {
  AuthorizationResult,
  DeterministicParsingTriggerResult,
  MediaDetectionResult,
} from "../types.js";

export const runDeterministicParsingTrigger = (
  authorization: AuthorizationResult,
  _mediaDetection: MediaDetectionResult,
): DeterministicParsingTriggerResult => {
  if (!authorization.isAuthorized) {
    return {
      shouldTrigger: false,
      reason: "blocked-by-authorization",
    };
  }

  return {
    shouldTrigger: true,
    reason: "ready-for-deterministic-parser",
  };
};
