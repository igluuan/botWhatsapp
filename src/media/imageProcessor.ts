import { requestImageOCR } from "./client.js";
import type { MediaExtractionResult } from "./types.js";

export const processImageMedia = async (
  mediaBuffer: Buffer,
  mimeType: string,
): Promise<MediaExtractionResult> => {
  try {
    const text = await requestImageOCR(mediaBuffer, mimeType);
    if (!text) {
      return {
        processed: true,
        mediaType: "image",
        extractedText: null,
        reason: "image-ocr-empty",
      };
    }

    return {
      processed: true,
      mediaType: "image",
      extractedText: text,
      reason: "image-ocr-complete",
    };
  } catch {
    return {
      processed: true,
      mediaType: "image",
      extractedText: null,
      reason: "image-ocr-failed",
    };
  }
};
