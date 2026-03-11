import { createInboundMessageLog } from "../../services/messageLogService.js";
import type { MessageLogResult, PipelineIncomingMessage } from "../types.js";
import { extractTextContent } from "./extractTextContent.js";

export const runMessageLogging = async (
  message: PipelineIncomingMessage,
  isAuthorized: boolean,
): Promise<MessageLogResult> => {
  const content = extractTextContent(message.rawPayload)?.trim() || "[mídia]";
  const log = await createInboundMessageLog({
    messageId: message.messageId,
    remoteJid: message.remoteJid,
    pushName: message.pushName,
    receivedAt: message.timestamp,
    authorizationStatus: isAuthorized ? "authorized" : "unauthorized",
    content,
  });

  return {
    logId: log.id,
  };
};
