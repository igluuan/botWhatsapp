import { createInboundMessageLog } from "../../services/messageLogService.js";
import type { MessageLogResult, PipelineIncomingMessage } from "../types.js";

export const runMessageLogging = async (
  message: PipelineIncomingMessage,
  isAuthorized: boolean,
): Promise<MessageLogResult> => {
  const log = await createInboundMessageLog({
    messageId: message.messageId,
    remoteJid: message.remoteJid,
    pushName: message.pushName,
    receivedAt: message.timestamp,
    authorizationStatus: isAuthorized ? "authorized" : "unauthorized",
  });

  return {
    logId: log.id,
  };
};
