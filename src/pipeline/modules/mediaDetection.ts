import type { MediaDetectionResult } from "../types.js";

const SUPPORTED_MEDIA_KEYS = ["imageMessage", "audioMessage", "documentMessage"] as const;

const extractMessageContent = (rawPayload: unknown): Record<string, unknown> | null => {
  if (!rawPayload || typeof rawPayload !== "object") {
    return null;
  }

  const payload = rawPayload as Record<string, unknown>;
  if (!payload.message || typeof payload.message !== "object") {
    return null;
  }

  return payload.message as Record<string, unknown>;
};

export const runMediaDetection = (rawPayload: unknown): MediaDetectionResult => {
  const content = extractMessageContent(rawPayload);
  if (!content) {
    return {
      hasMedia: false,
      mediaType: null,
    };
  }

  for (const mediaKey of SUPPORTED_MEDIA_KEYS) {
    const mediaContent = content[mediaKey];
    if (!mediaContent || typeof mediaContent !== "object") {
      continue;
    }

    if (mediaKey === "documentMessage") {
      const documentMessage = mediaContent as Record<string, unknown>;
      if (documentMessage.mimetype !== "application/pdf") {
        continue;
      }
    }

    if (mediaContent) {
      return {
        hasMedia: true,
        mediaType: mediaKey,
      };
    }
  }

  return {
    hasMedia: false,
    mediaType: null,
  };
};
