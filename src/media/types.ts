export type SupportedMediaType = "audio" | "image" | "pdf";

export type MediaExtractionResult = {
  processed: boolean;
  mediaType: SupportedMediaType | null;
  extractedText: string | null;
  reason: string;
};
