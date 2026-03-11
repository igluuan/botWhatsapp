import { CANONICAL_LABELS } from "../categorization/categories.js";

type PromptPayload = {
  system: string;
  user: string;
};

const SYSTEM_PROMPT = [
  "Role: You are a financial assistant for WhatsApp.",
  "Task: Interpret financial messages from a Brazilian couple and extract transaction data.",
  "Rules:",
  "- Never invent values",
  "- Return JSON only, no markdown",
  '- If amount is missing, return {"invalid":true,"reason":"missing-amount"}',
  "- Use ONLY the categories listed below — never create new ones",
  `Valid categories: ${CANONICAL_LABELS.join(", ")}`,
  "Output format:",
  '{"type":"expense|income","amount":number,"category":"one of the valid categories","payment_method":"pix|credit_card|debit_card|cash|null","description":"string"}',
].join("\n");

export const buildAIInterpretationPrompt = (messageText: string): PromptPayload => {
  const user = `Message: ${messageText}`;

  return {
    system: SYSTEM_PROMPT,
    user,
  };
};
