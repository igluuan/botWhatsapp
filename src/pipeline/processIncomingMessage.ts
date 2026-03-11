import type { WASocket } from "@whiskeysockets/baileys";
import {
  registerExpense,
  registerIncome,
} from "../services/financialService.js";
import { resolveOrCreateUserIdFromJid } from "../services/userService.js";
import { runMessagePipeline } from "./pipelineController.js";
import type { ParsedFinancialMessage } from "../parser/types.js";
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

const toCurrency = (value: number): string => {
  return value.toFixed(2).replace(".", ",");
};

const buildRegisteredTransactionResponse = (input: {
  description: string;
  amount: number;
  category: string;
  paymentMethod: string | null;
  transactionId: string;
}): string => {
  const lines = [
    "✅ Registrado!",
    `📝 ${input.description}`,
    `💰 R$ ${toCurrency(input.amount)}`,
    `🏷️ ${input.category}`,
  ];
  if (input.paymentMethod) {
    lines.push(`💳 ${input.paymentMethod}`);
  }
  lines.push(`🆔 #${input.transactionId.slice(0, 8)}`);
  return lines.join("\n");
};

const persistTransaction = async (
  remoteJid: string,
  data: ParsedFinancialMessage,
): Promise<{ id: string }> => {
  const userId = await resolveOrCreateUserIdFromJid(remoteJid);
  const payload = {
    userId,
    amount: data.amount,
    category: data.category,
    paymentMethod: data.payment_method,
    description: data.description,
    transactionDate: new Date(),
  };
  if (data.type === "income") {
    return registerIncome(payload);
  }
  return registerExpense(payload);
};

const handleTransactionPersistenceError = async (
  socket: WASocket,
  remoteJid: string,
  error: unknown,
): Promise<void> => {
  const errorMessage = error instanceof Error ? error.message : "unknown-error";
  if (errorMessage === "duplicate-transaction") {
    await socket.sendMessage(remoteJid, {
      text: "⚠️ Essa transação parece duplicada. Já registrei algo igual agora há pouco.",
    });
    return;
  }
  if (errorMessage === "invalid-amount") {
    await socket.sendMessage(remoteJid, {
      text: "⚠️ Valor inválido. Tente novamente com um número positivo.",
    });
    return;
  }
  console.error("Transaction persistence failed:", error);
  if (errorMessage === "user-not-found") {
    console.error("Unexpected user-not-found after resolveOrCreateUserIdFromJid");
  }
  await socket.sendMessage(remoteJid, {
    text: "⚠️ Ocorreu um erro ao registrar sua transação. Tente novamente.",
  });
};

export const processIncomingMessage = async (
  message: PipelineIncomingMessage,
  socket: WASocket,
): Promise<void> => {
  try {
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
    }

    const parsedData = result.aiFallback.matched && result.aiFallback.data
      ? result.aiFallback.data
      : result.deterministicParsing.matched && result.deterministicParsing.data
        ? result.deterministicParsing.data
        : null;

    if (!parsedData) return;

    try {
      const transaction = await persistTransaction(message.remoteJid, parsedData);
      await socket.sendMessage(message.remoteJid, {
        text: buildRegisteredTransactionResponse({
          description: parsedData.description,
          amount: parsedData.amount,
          category: parsedData.category,
          paymentMethod: parsedData.payment_method,
          transactionId: transaction.id,
        }),
      });
    } catch (error) {
      await handleTransactionPersistenceError(socket, message.remoteJid, error);
    }
  } catch (error) {
    console.error("processIncomingMessage fatal error:", error);
    try {
      await socket.sendMessage(message.remoteJid, {
        text: "⚠️ Ocorreu um erro inesperado ao processar sua mensagem. Tente novamente.",
      });
    } catch (sendError) {
      console.error("Failed to send fallback error message:", sendError);
    }
  }
};
