import { downloadMediaMessage, type WAMessage } from "@whiskeysockets/baileys";
import { processMediaByType } from "../../media/index.js";
import type { MediaExtractionResult, SupportedMediaType } from "../../media/types.js";
import type { MediaDetectionResult } from "../types.js";

type MediaTarget = {
  mediaType: SupportedMediaType;
  mimeType: string;
};

const detectMediaTarget = (rawPayload: unknown): MediaTarget | null => {
  if (!rawPayload || typeof rawPayload !== "object") {
    return null;
  }

  const payload = rawPayload as Record<string, unknown>;
  if (!payload.message || typeof payload.message !== "object") {
    return null;
  }

  const message = payload.message as Record<string, unknown>;
  const audioMessage = message.audioMessage;
  if (audioMessage && typeof audioMessage === "object") {
    const audio = audioMessage as Record<string, unknown>;
    return {
      mediaType: "audio",
      mimeType: typeof audio.mimetype === "string" ? audio.mimetype : "audio/ogg",
    };
  }

  const imageMessage = message.imageMessage;
  if (imageMessage && typeof imageMessage === "object") {
    const image = imageMessage as Record<string, unknown>;
    return {
      mediaType: "image",
      mimeType: typeof image.mimetype === "string" ? image.mimetype : "image/jpeg",
    };
  }

  const documentMessage = message.documentMessage;
  if (documentMessage && typeof documentMessage === "object") {
    const document = documentMessage as Record<string, unknown>;
    if (document.mimetype === "application/pdf") {
      return {
        mediaType: "pdf",
        mimeType: "application/pdf",
      };
    }
  }

  return null;
};

const downloadMediaBuffer = async (rawPayload: unknown): Promise<Buffer | null> => {
  if (!rawPayload || typeof rawPayload !== "object") {
    return null;
  }

  try {
    return await downloadMediaMessage(rawPayload as WAMessage, "buffer", {});
  } catch {
    return null;
  }
};

export const runMediaProcessing = async (
  rawPayload: unknown,
  mediaDetection: MediaDetectionResult,
): Promise<MediaExtractionResult> => {
  if (!mediaDetection.hasMedia) {
    return {
      processed: false,
      mediaType: null,
      extractedText: null,
      reason: "no-media-detected",
    };
  }

  const mediaTarget = detectMediaTarget(rawPayload);
  if (!mediaTarget) {
    return {
      processed: true,
      mediaType: null,
      extractedText: null,
      reason: "unsupported-media-type",
    };
  }

  const mediaBuffer = await downloadMediaBuffer(rawPayload);
  if (!mediaBuffer) {
    return {
      processed: true,
      mediaType: mediaTarget.mediaType,
      extractedText: null,
      reason: "media-download-failed",
    };
  }

  return processMediaByType(mediaTarget.mediaType, mediaBuffer, mediaTarget.mimeType);
};
