import type { WASocket } from "@whiskeysockets/baileys";
import { runMessagePipeline } from "./pipelineController.js";
import type { PipelineIncomingMessage } from "./types.js";
import { extractTextContent } from "./modules/extractTextContent.js";
import { normalizeMessage } from "./modules/messageNormalizer.js";
import { detectIntent } from "./modules/intentDetector.js";
import { shouldRespondGreeting } from "./modules/greetingCooldown.js";
import { greetingResponse } from "./modules/greetingResponse.js";
import { helpResponse } from "./modules/helpResponse.js";
import { handleExpenseQuery } from "./modules/expenseQueryHandler.js";
import { logIntent } from "./modules/intentLogger.js";
import { unknownResponse } from "./modules/unknownResponse.js";

export const processIncomingMessage = async (
  message: PipelineIncomingMessage,
  socket: WASocket,
): Promise<void> => {
  const rawText = extractTextContent(message.rawPayload);
  const normalizedText = rawText ? normalizeMessage(rawText) : "";
  const intent = normalizedText ? detectIntent(normalizedText) : "unknown";
  logIntent(message.remoteJid, intent);

  if (intent === "greeting") {
    if (shouldRespondGreeting(message.remoteJid)) {
      await socket.sendMessage(message.remoteJid, { text: greetingResponse() });
    }
    return;
  }

  if (intent === "help") {
    await socket.sendMessage(message.remoteJid, { text: helpResponse() });
    return;
  }

  if (intent === "small_talk") {
    await socket.sendMessage(message.remoteJid, { text: greetingResponse() });
    return;
  }

  if (intent === "expense_query") {
    const response = await handleExpenseQuery(message.remoteJid, normalizedText);
    await socket.sendMessage(message.remoteJid, { text: response });
    return;
  }

  if (intent === "unknown") {
    await socket.sendMessage(message.remoteJid, { text: unknownResponse() });
    return;
  }

  const result = await runMessagePipeline(message);

  if (result.aiFallback.reason === "ai-timeout") {
    await socket.sendMessage(message.remoteJid, {
      text: "⚠️ A IA demorou demais para responder. Tente enviar novamente.",
    });
    return;
  }

  if (result.aiFallback.reason === "ai-insufficient-credits") {
    await socket.sendMessage(message.remoteJid, {
      text: '⚠️ Serviço de IA temporariamente indisponível. Tente o formato direto: "descrição valor" (ex: uber 20).',
    });
    return;
  }

  if (result.aiFallback.reason === "ai-invalid-response") {
    await socket.sendMessage(message.remoteJid, {
      text: '⚠️ Não consegui interpretar sua mensagem. Tente o formato: "descrição valor" (ex: mercado 120).',
    });
    return;
  }

  if (result.aiFallback.reason === "ai-request-failed") {
    await socket.sendMessage(message.remoteJid, {
      text: '⚠️ Não consegui interpretar sua mensagem. Tente o formato: "descrição valor" (ex: mercado 120).',
    });
    return;
  } else if (result.aiFallback.matched && result.aiFallback.data) {
    const data = result.aiFallback.data;
    await socket.sendMessage(message.remoteJid, {
      text: `✅ Despesa Identificada!\n\nCategoria: ${data.category}\nValor: R$ ${data.amount}\nDescrição: ${data.description}`,
    });
    return;
  }

  if (result.deterministicParsing.matched && result.deterministicParsing.data) {
    const data = result.deterministicParsing.data;
    await socket.sendMessage(message.remoteJid, {
      text: `✅ Despesa Identificada!\n\nCategoria: ${data.category}\nValor: R$ ${data.amount}\nDescrição: ${data.description}`,
    });
  }
};
