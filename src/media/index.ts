import type { MediaExtractionResult, SupportedMediaType } from "./types.js";
import { processAudioMedia } from "./audioProcessor.js";
import { processImageMedia } from "./imageProcessor.js";
import { processPdfMedia } from "./pdfProcessor.js";

export const processMediaByType = async (
  mediaType: SupportedMediaType,
  mediaBuffer: Buffer,
  mimeType: string,
): Promise<MediaExtractionResult> => {
  if (mediaType === "audio") {
    return processAudioMedia(mediaBuffer, mimeType);
  }

  if (mediaType === "image") {
    return processImageMedia(mediaBuffer, mimeType);
  }

  return processPdfMedia(mediaBuffer, mimeType);
};
