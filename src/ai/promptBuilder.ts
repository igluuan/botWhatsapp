type PromptPayload = {
  system: string;
  user: string;
};

const SYSTEM_PROMPT = [
  "Role: You are a financial assistant for WhatsApp.",
  "Task: Interpret complex financial messages, extract transaction data, and classify categories.",
  "Rules:",
  "- Never invent values",
  "- Ask clarification if uncertain",
  "- Return JSON only",
  "Output format:",
  '{"type":"expense|income","amount":number,"category":"string","payment_method":"string|null","description":"string"}',
].join("\n");

export const buildAIInterpretationPrompt = (messageText: string): PromptPayload => {
  const user = [
    "Role: Financial transaction interpreter",
    "Task: Parse the message and return structured transaction JSON.",
    "Rules:",
    "- Use only provided message content",
    "- If amount is missing, return {\"invalid\":true,\"reason\":\"missing-amount\"}",
    "- Keep category as a concise label",
    "Output format:",
    "JSON only",
    `Message: ${messageText}`,
  ].join("\n");

  return {
    system: SYSTEM_PROMPT,
    user,
  };
};
