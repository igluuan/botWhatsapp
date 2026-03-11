import {
  editTransaction,
  deleteTransaction,
} from "../../services/financialService.js";
import { resolveOrCreateUserIdFromJid } from "../../services/userService.js";
import { prisma } from "../../database/prisma.js";
import type { EditDeleteIntent } from "./editDeleteDetector.js";
import {
  deleteSuccessResponse,
  editAmountSuccessResponse,
  editCategorySuccessResponse,
  transactionNotFoundResponse,
  unexpectedProcessingErrorResponse,
} from "./responses/index.js";

const resolveFullTransactionId = async (
  userId: string,
  shortId: string,
): Promise<string | null> => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      userId,
      id: { startsWith: shortId },
    },
    select: { id: true },
  });
  return transaction?.id ?? null;
};

export const handleEditDelete = async (
  remoteJid: string,
  intent: EditDeleteIntent,
): Promise<string> => {
  if (!intent) return "Hmm, não entendi direito 🤔\nTenta assim: *muda categoria #a1b2c3d4 pra transporte*";

  const userId = await resolveOrCreateUserIdFromJid(remoteJid);
  const fullId = await resolveFullTransactionId(userId, intent.transactionId);

  if (!fullId) {
    return transactionNotFoundResponse(intent.transactionId);
  }

  try {
    if (intent.action === "delete") {
      await deleteTransaction({ userId, transactionId: fullId });
      return deleteSuccessResponse(intent.transactionId);
    }

    if (intent.action === "edit_category") {
      await editTransaction({
        userId,
        transactionId: fullId,
        category: intent.newCategory,
      });
      return editCategorySuccessResponse(intent.transactionId, intent.newCategory);
    }

    if (intent.action === "edit_amount") {
      await editTransaction({
        userId,
        transactionId: fullId,
        amount: intent.newAmount,
      });
      return editAmountSuccessResponse(intent.transactionId, intent.newAmount);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    if (msg === "transaction-not-found") {
      return transactionNotFoundResponse(intent.transactionId);
    }
    console.error("editDeleteHandler error:", error);
    return unexpectedProcessingErrorResponse();
  }

  return "Hmm, não entendi direito 🤔\nTenta assim: *muda categoria #a1b2c3d4 pra transporte*";
};
