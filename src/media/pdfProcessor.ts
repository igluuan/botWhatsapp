import { requestPDFTextExtraction } from "./client.js";
import type { MediaExtractionResult } from "./types.js";

export const processPdfMedia = async (
  mediaBuffer: Buffer,
  mimeType: string,
): Promise<MediaExtractionResult> => {
  try {
    const text = await requestPDFTextExtraction(mediaBuffer, mimeType);
    if (!text) {
      return {
        processed: true,
        mediaType: "pdf",
        extractedText: null,
        reason: "pdf-text-empty",
      };
    }

    return {
      processed: true,
      mediaType: "pdf",
      extractedText: text,
      reason: "pdf-text-extracted",
    };
  } catch {
    return {
      processed: true,
      mediaType: "pdf",
      extractedText: null,
      reason: "pdf-text-extraction-failed",
    };
  }
};
