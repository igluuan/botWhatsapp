import type { AuthorizationResult, PipelineIncomingMessage } from "../types.js";

const normalizeJid = (jid: string): string => {
  // Remove sufixo do servidor (@s.whatsapp.net, @lid, etc) e porta
  const bareJid = jid.split("@")[0].split(":")[0];
  // Remove código do país se for 55 e tiver 13 dígitos (lidando com nono dígito)
  // Mas a estratégia mais segura para lista de autorizados é comparar apenas os números
  return bareJid;
};

export const runAuthorizationCheck = (
  message: PipelineIncomingMessage,
  authorizedJids: string[],
): AuthorizationResult => {
  if (authorizedJids.length === 0) {
    return {
      isAuthorized: true,
      reason: "authorization-list-empty",
    };
  }

  const normalizedRemoteJid = normalizeJid(message.remoteJid);
  
  const isAuthorized = authorizedJids.some((jid) => {
    const normalizedAuthorized = normalizeJid(jid);
    console.log(`Checking incoming ${normalizedRemoteJid} against authorized ${normalizedAuthorized}`);
    return normalizedAuthorized === normalizedRemoteJid;
  });

  return {
    isAuthorized,
    reason: isAuthorized ? "authorized-jid-match" : "unauthorized-jid",
  };
};
