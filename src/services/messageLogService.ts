import { randomUUID } from "node:crypto";
import { prisma } from "../database/prisma.js";
import { resolveOrCreateUserIdFromJid } from "./userService.js";

type CreateInboundMessageLogInput = {
  messageId: string;
  remoteJid: string;
  pushName: string | undefined;
  receivedAt: Date;
  authorizationStatus: "authorized" | "unauthorized";
  content: string;
};

export const createInboundMessageLog = async (
  input: CreateInboundMessageLogInput,
): Promise<{ id: string }> => {
  try {
    const userId = await resolveOrCreateUserIdFromJid(input.remoteJid);
    const log = await prisma.messageLog.create({
      data: {
        userId,
        direction: "inbound",
        content: input.content,
        status: input.authorizationStatus,
        createdAt: input.receivedAt,
      },
      select: { id: true },
    });
    return { id: log.id };
  } catch (error) {
    console.error("Message log persistence failed:", error);
    return { id: randomUUID() };
  }
};
