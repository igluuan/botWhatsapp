import { randomUUID } from "node:crypto";

type CreateInboundMessageLogInput = {
  messageId: string;
  remoteJid: string;
  pushName: string | undefined;
  receivedAt: Date;
  authorizationStatus: "authorized" | "unauthorized";
};

export const createInboundMessageLog = async (
  _input: CreateInboundMessageLogInput,
): Promise<{ id: string }> => {
  return { id: randomUUID() };
};
