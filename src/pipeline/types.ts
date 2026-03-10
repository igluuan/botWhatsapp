import type { AIInterpretationResult } from "../ai/types.js";
import type { MediaExtractionResult } from "../media/types.js";
import type { DeterministicParserResult } from "../parser/types.js";

export type PipelineIncomingMessage = {
  messageId: string;
  remoteJid: string;
  pushName: string | undefined;
  timestamp: Date;
  rawPayload: unknown;
};

export type AuthorizationResult = {
  isAuthorized: boolean;
  reason: string;
};

export type MessageLogResult = {
  logId: string;
};

export type MediaDetectionResult = {
  hasMedia: boolean;
  mediaType: string | null;
};

export type DeterministicParsingTriggerResult = {
  shouldTrigger: boolean;
  reason: string;
};

export type IntentRoute =
  | "unauthorized"
  | "media_processing"
  | "deterministic_parser"
  | "ai_fallback";

export type IntentRoutingResult = {
  route: IntentRoute;
  reason: string;
};

export type PipelineControllerResult = {
  authorization: AuthorizationResult;
  messageLog: MessageLogResult;
  mediaDetection: MediaDetectionResult;
  mediaProcessing: MediaExtractionResult;
  deterministicParsingTrigger: DeterministicParsingTriggerResult;
  deterministicParsing: DeterministicParserResult;
  intentRouting: IntentRoutingResult;
  aiFallback: AIInterpretationResult;
};
