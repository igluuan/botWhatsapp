import {
  editTransaction,
  deleteTransaction,
} from "../../services/financialService.js";
import { resolveOrCreateUserIdFromJid } from "../../services/userService.js";
import { prisma } from "../../database/prisma.js";
import type { EditDeleteIntent } from "./editDeleteDetector.js";

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
  if (!intent) return "⚠️ Comando não reconhecido.";

  const userId = await resolveOrCreateUserIdFromJid(remoteJid);
  const fullId = await resolveFullTransactionId(userId, intent.transactionId);

  if (!fullId) {
    return `⚠️ Lançamento #${intent.transactionId} não encontrado.`;
  }

  try {
    if (intent.action === "delete") {
      await deleteTransaction({ userId, transactionId: fullId });
      return `🗑️ Lançamento #${intent.transactionId} removido.`;
    }

    if (intent.action === "edit_category") {
      await editTransaction({
        userId,
        transactionId: fullId,
        category: intent.newCategory,
      });
      return `✅ Categoria do #${intent.transactionId} atualizada para *${intent.newCategory}*.`;
    }

    if (intent.action === "edit_amount") {
      const formatted = intent.newAmount.toFixed(2).replace(".", ",");
      await editTransaction({
        userId,
        transactionId: fullId,
        amount: intent.newAmount,
      });
      return `✅ Valor do #${intent.transactionId} atualizado para *R$ ${formatted}*.`;
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    if (msg === "transaction-not-found") {
      return `⚠️ Lançamento #${intent.transactionId} não encontrado.`;
    }
    console.error("editDeleteHandler error:", error);
    return "⚠️ Erro ao editar lançamento. Tente novamente.";
  }

  return "⚠️ Comando não reconhecido.";
};
