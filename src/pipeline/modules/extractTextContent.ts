export const extractTextContent = (rawPayload: unknown): string | null => {
  if (!rawPayload || typeof rawPayload !== "object") {
    return null;
  }

  const payload = rawPayload as Record<string, unknown>;
  if (!payload.message || typeof payload.message !== "object") {
    return null;
  }

  const message = payload.message as Record<string, unknown>;
  if (typeof message.conversation === "string") {
    return message.conversation;
  }

  const extended = message.extendedTextMessage;
  if (
    extended &&
    typeof extended === "object" &&
    "text" in extended &&
    typeof extended.text === "string"
  ) {
    return extended.text;
  }

  return null;
};
