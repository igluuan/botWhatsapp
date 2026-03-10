import { env } from "../config/env.js";

type ExtractTextResponse = {
  text?: string;
};

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const requestTextExtraction = async (
  endpoint: string,
  fileBuffer: Buffer,
  mimeType: string,
): Promise<string | null> => {
  if (!env.mediaProcessingEnabled) {
    return null;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: env.mediaProcessingApiKey
        ? `Bearer ${env.mediaProcessingApiKey}`
        : "",
    },
    body: JSON.stringify({
      mime_type: mimeType,
      content_base64: fileBuffer.toString("base64"),
    }),
    signal: AbortSignal.timeout(env.mediaProcessingTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`media-request-failed-${response.status}`);
  }

  const payload = (await response.json()) as ExtractTextResponse;
  return normalizeText(payload.text);
};

export const requestAudioTranscription = async (
  audioBuffer: Buffer,
  mimeType: string,
): Promise<string | null> => {
  return requestTextExtraction(env.mediaAudioApiUrl, audioBuffer, mimeType);
};

export const requestImageOCR = async (
  imageBuffer: Buffer,
  mimeType: string,
): Promise<string | null> => {
  return requestTextExtraction(env.mediaImageApiUrl, imageBuffer, mimeType);
};

export const requestPDFTextExtraction = async (
  pdfBuffer: Buffer,
  mimeType: string,
): Promise<string | null> => {
  return requestTextExtraction(env.mediaPdfApiUrl, pdfBuffer, mimeType);
};
