import { requestAudioTranscription } from "./client.js";
import type { MediaExtractionResult } from "./types.js";

export const processAudioMedia = async (
  mediaBuffer: Buffer,
  mimeType: string,
): Promise<MediaExtractionResult> => {
  try {
    const text = await requestAudioTranscription(mediaBuffer, mimeType);
    if (!text) {
      return {
        processed: true,
        mediaType: "audio",
        extractedText: null,
        reason: "audio-transcription-empty",
      };
    }

    return {
      processed: true,
      mediaType: "audio",
      extractedText: text,
      reason: "audio-transcribed",
    };
  } catch {
    return {
      processed: true,
      mediaType: "audio",
      extractedText: null,
      reason: "audio-transcription-failed",
    };
  }
};
