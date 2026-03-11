import type { WASocket } from "@whiskeysockets/baileys";
import {
  registerExpense,
  registerIncome,
} from "../services/financialService.js";
import { findUserCategoryRule } from "../services/categoryRuleService.js";
import { resolveOrCreateUserIdFromJid } from "../services/userService.js";
import { runMessagePipeline } from "./pipelineController.js";
import type { ParsedFinancialMessage } from "../parser/types.js";
import type { PipelineIncomingMessage } from "./types.js";
import { extractTextContent } from "./modules/extractTextContent.js";
import { normalizeMessage } from "./modules/messageNormalizer.js";
import { detectIntent } from "./modules/intentDetector.js";
import { shouldRespondGreeting } from "./modules/greetingCooldown.js";
import { handleExpenseQuery } from "./modules/expenseQueryHandler.js";
import { detectEditDeleteIntent } from "./modules/editDeleteDetector.js";
import { handleEditDelete } from "./modules/editDeleteHandler.js";
import { logIntent } from "./modules/intentLogger.js";
import {
  aiUnavailableResponse,
  duplicateTransactionResponse,
  greetingResponse,
  helpResponse,
  invalidAmountResponse,
  notUnderstoodResponse,
  registrationResponse,
  smallTalkResponse,
  unexpectedProcessingErrorResponse,
  unexpectedRegistrationErrorResponse,
  unknownResponse,
} from "./modules/responses/index.js";

const persistTransaction = async (
  remoteJid: string,
  data: ParsedFinancialMessage,
): Promise<{ id: string; category: string; type: "expense" | "income"; amount: number; description: string | null }> => {
  const userId = await resolveOrCreateUserIdFromJid(remoteJid);
  const personalCategory = data.description
    ? await findUserCategoryRule(userId, data.description)
    : null;
  const payload = {
    userId,
    amount: data.amount,
    category: personalCategory ?? data.category,
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
      text: duplicateTransactionResponse(),
    });
    return;
  }
  if (errorMessage === "invalid-amount") {
    await socket.sendMessage(remoteJid, {
      text: invalidAmountResponse(),
    });
    return;
  }
  console.error("Transaction persistence failed:", error);
  if (errorMessage === "user-not-found") {
    console.error("Unexpected user-not-found after resolveOrCreateUserIdFromJid");
  }
  await socket.sendMessage(remoteJid, {
    text: unexpectedRegistrationErrorResponse(),
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

    if (intent === "greeting") {
      logIntent(message.remoteJid, intent);
      const greetingCheck = shouldRespondGreeting(message.remoteJid);
      if (greetingCheck.shouldRespond) {
        await socket.sendMessage(message.remoteJid, {
          text: greetingResponse(greetingCheck.isReturning),
        });
      }
      return;
    }

    if (intent === "help") {
      logIntent(message.remoteJid, intent);
      await socket.sendMessage(message.remoteJid, { text: helpResponse() });
      return;
    }

    if (intent === "small_talk") {
      logIntent(message.remoteJid, intent);
      await socket.sendMessage(message.remoteJid, { text: smallTalkResponse() });
      return;
    }

    if (intent === "expense_query") {
      logIntent(message.remoteJid, intent);
      const response = await handleExpenseQuery(message.remoteJid, normalizedText);
      await socket.sendMessage(message.remoteJid, { text: response });
      return;
    }

    if (intent === "edit_delete") {
      logIntent(message.remoteJid, intent);
      const editIntent = detectEditDeleteIntent(normalizedText);
      const response = await handleEditDelete(message.remoteJid, editIntent);
      await socket.sendMessage(message.remoteJid, { text: response });
      return;
    }

    const result = await runMessagePipeline(message);
    logIntent(message.remoteJid, result.intent);

    if (result.aiFallback.reason === "ai-timeout") {
      await socket.sendMessage(message.remoteJid, {
        text: aiUnavailableResponse(),
      });
      return;
    }

    if (result.aiFallback.reason === "ai-insufficient-credits") {
      await socket.sendMessage(message.remoteJid, {
        text: aiUnavailableResponse(),
      });
      return;
    }

    if (
      result.aiFallback.reason === "ai-invalid-response" ||
      result.aiFallback.reason === "ai-request-failed"
    ) {
      await socket.sendMessage(message.remoteJid, {
        text: notUnderstoodResponse(),
      });
      return;
    }

    const parsedData = result.aiFallback.matched && result.aiFallback.data
      ? result.aiFallback.data
      : result.deterministicParsing.matched && result.deterministicParsing.data
        ? result.deterministicParsing.data
        : null;

    if (!parsedData) {
      await socket.sendMessage(message.remoteJid, { text: unknownResponse() });
      return;
    }

    try {
      const transaction = await persistTransaction(message.remoteJid, parsedData);
      await socket.sendMessage(message.remoteJid, {
        text: registrationResponse({
          type: transaction.type,
          description: transaction.description ?? parsedData.description,
          amount: transaction.amount,
          category: transaction.category,
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
        text: unexpectedProcessingErrorResponse(),
      });
    } catch (sendError) {
      console.error("Failed to send fallback error message:", sendError);
    }
  }
};
