import { config as loadEnv } from "dotenv";

loadEnv();

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const toList = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 3000),
  whatsappAuthDir: process.env.WHATSAPP_AUTH_DIR ?? ".baileys_auth",
  whatsappPrintQr: toBoolean(process.env.WHATSAPP_PRINT_QR, true),
  authorizedWhatsappJids: toList(process.env.AUTHORIZED_WHATSAPP_JIDS),
  aiEnabled: toBoolean(process.env.AI_ENABLED, false),
  aiApiUrl: process.env.AI_API_URL ?? "https://api.anthropic.com/v1/messages",
  aiApiKey: process.env.AI_API_KEY ?? "",
  aiModel: process.env.AI_MODEL ?? "claude-haiku-4-5-20251001",
  aiAnthropicVersion: process.env.AI_ANTHROPIC_VERSION ?? "2023-06-01",
  aiTimeoutMs: toNumber(process.env.AI_TIMEOUT_MS, 8000),
  mediaProcessingEnabled: toBoolean(process.env.MEDIA_PROCESSING_ENABLED, false),
  mediaProcessingApiKey: process.env.MEDIA_PROCESSING_API_KEY ?? "",
  mediaAudioApiUrl: process.env.MEDIA_AUDIO_API_URL ?? "",
  mediaImageApiUrl: process.env.MEDIA_IMAGE_API_URL ?? "",
  mediaPdfApiUrl: process.env.MEDIA_PDF_API_URL ?? "",
  mediaProcessingTimeoutMs: toNumber(process.env.MEDIA_PROCESSING_TIMEOUT_MS, 20000),
};
