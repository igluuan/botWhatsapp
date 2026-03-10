import { Prisma } from "@prisma/client";
import { prisma } from "../database/prisma.js";

type TransactionType = "expense" | "income";

type RegisterTransactionInput = {
  userId: string;
  amount: number;
  category: string;
  paymentMethod: string | null;
  description: string | null;
  transactionDate?: Date;
};

type EditTransactionInput = {
  userId: string;
  transactionId: string;
  amount?: number;
  category?: string;
  paymentMethod?: string | null;
  description?: string | null;
  transactionDate?: Date;
};

type FinancialTransaction = {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  paymentMethod: string;
  description: string | null;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

type PeriodSummary = {
  periodStart: Date;
  periodEnd: Date;
  totalExpense: number;
  totalIncome: number;
  balance: number;
  transactionCount: number;
};

type CategorySummaryItem = {
  category: string;
  type: string;
  totalAmount: number;
  transactionCount: number;
};

const assertUserOwnership = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("user-not-found");
  }
};

const normalizeCategory = (category: string): string => {
  const normalized = category.trim().toLowerCase();
  if (!normalized) {
    throw new Error("invalid-category");
  }
  return normalized;
};

const normalizePaymentMethod = (paymentMethod: string | null | undefined): string => {
  if (!paymentMethod) {
    return "unknown";
  }
  const normalized = paymentMethod.trim().toLowerCase();
  return normalized || "unknown";
};

const normalizeDescription = (description: string | null | undefined): string | null => {
  if (!description) return null;
  const normalized = description.trim();
  return normalized.length > 0 ? normalized : null;
};

const validateAmount = (amount: number): number => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("invalid-amount");
  }
  return Math.round(amount * 100) / 100;
};

const getOrCreateCategory = async (name: string): Promise<{ id: string; name: string }> => {
  return prisma.category.upsert({
    where: { name },
    create: { name },
    update: {},
    select: { id: true, name: true },
  });
};

const mapTransaction = (transaction: {
  id: string;
  userId: string;
  type: string;
  amount: Prisma.Decimal;
  category: string;
  paymentMethod: string;
  description: string | null;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}): FinancialTransaction => {
  return {
    id: transaction.id,
    userId: transaction.userId,
    type: transaction.type as TransactionType,
    amount: Number(transaction.amount),
    category: transaction.category,
    paymentMethod: transaction.paymentMethod,
    description: transaction.description,
    transactionDate: transaction.transactionDate,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
};

const createTransaction = async (
  type: TransactionType,
  input: RegisterTransactionInput,
): Promise<FinancialTransaction> => {
  await assertUserOwnership(input.userId);
  const amount = validateAmount(input.amount);
  const categoryName = normalizeCategory(input.category);
  const category = await getOrCreateCategory(categoryName);
  const paymentMethod = normalizePaymentMethod(input.paymentMethod);
  const description = normalizeDescription(input.description);
  const transactionDate = input.transactionDate ?? new Date();

  const duplicateTransaction = await prisma.transaction.findFirst({
    where: {
      userId: input.userId,
      type,
      amount: new Prisma.Decimal(amount),
      category: category.name,
      paymentMethod,
      description,
      transactionDate,
    },
    select: { id: true },
  });

  if (duplicateTransaction) {
    throw new Error("duplicate-transaction");
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId: input.userId,
      type,
      amount: new Prisma.Decimal(amount),
      category: category.name,
      categoryId: category.id,
      paymentMethod,
      description,
      transactionDate,
    },
  });

  return mapTransaction(transaction);
};

const getPeriodSummary = async (
  userId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<PeriodSummary> => {
  await assertUserOwnership(userId);

  const baseWhere = {
    userId,
    transactionDate: {
      gte: periodStart,
      lt: periodEnd,
    },
  };

  const [expenseAggregate, incomeAggregate, transactionCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...baseWhere, type: "expense" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...baseWhere, type: "income" },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: baseWhere,
    }),
  ]);

  const totalExpense = Number(expenseAggregate._sum.amount ?? 0);
  const totalIncome = Number(incomeAggregate._sum.amount ?? 0);

  return {
    periodStart,
    periodEnd,
    totalExpense,
    totalIncome,
    balance: totalIncome - totalExpense,
    transactionCount,
  };
};

const getDayBounds = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const getWeekBounds = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const mondayOffset = (day + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
};

const getMonthBounds = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  end.setHours(0, 0, 0, 0);
  return { start, end };
};

export const registerExpense = async (
  input: RegisterTransactionInput,
): Promise<FinancialTransaction> => {
  return createTransaction("expense", input);
};

export const registerIncome = async (
  input: RegisterTransactionInput,
): Promise<FinancialTransaction> => {
  return createTransaction("income", input);
};

export const editTransaction = async (
  input: EditTransactionInput,
): Promise<FinancialTransaction> => {
  await assertUserOwnership(input.userId);

  const existing = await prisma.transaction.findFirst({
    where: {
      id: input.transactionId,
      userId: input.userId,
    },
  });

  if (!existing) {
    throw new Error("transaction-not-found");
  }

  const updateData: Prisma.TransactionUpdateInput = {};
  if (input.amount !== undefined) {
    updateData.amount = new Prisma.Decimal(validateAmount(input.amount));
  }
  if (input.category !== undefined) {
    const categoryName = normalizeCategory(input.category);
    const category = await getOrCreateCategory(categoryName);
    updateData.category = category.name;
    updateData.categoryRef = {
      connect: {
        id: category.id,
      },
    };
  }
  if (input.paymentMethod !== undefined) {
    updateData.paymentMethod = normalizePaymentMethod(input.paymentMethod);
  }
  if (input.description !== undefined) {
    updateData.description = normalizeDescription(input.description);
  }
  if (input.transactionDate !== undefined) {
    updateData.transactionDate = input.transactionDate;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("no-updatable-fields");
  }

  const transaction = await prisma.transaction.update({
    where: { id: input.transactionId },
    data: updateData,
  });

  return mapTransaction(transaction);
};

export const deleteTransaction = async (input: {
  userId: string;
  transactionId: string;
}): Promise<{ deleted: true; transactionId: string }> => {
  await assertUserOwnership(input.userId);

  const existing = await prisma.transaction.findFirst({
    where: {
      id: input.transactionId,
      userId: input.userId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("transaction-not-found");
  }

  await prisma.transaction.delete({
    where: { id: input.transactionId },
  });

  return {
    deleted: true,
    transactionId: input.transactionId,
  };
};

export const generateDailySummary = async (input: {
  userId: string;
  referenceDate?: Date;
}): Promise<PeriodSummary> => {
  const { start, end } = getDayBounds(input.referenceDate ?? new Date());
  return getPeriodSummary(input.userId, start, end);
};

export const generateWeeklySummary = async (input: {
  userId: string;
  referenceDate?: Date;
}): Promise<PeriodSummary> => {
  const { start, end } = getWeekBounds(input.referenceDate ?? new Date());
  return getPeriodSummary(input.userId, start, end);
};

export const generateMonthlySummary = async (input: {
  userId: string;
  referenceDate?: Date;
}): Promise<PeriodSummary> => {
  const { start, end } = getMonthBounds(input.referenceDate ?? new Date());
  return getPeriodSummary(input.userId, start, end);
};

export const generateCategorySummary = async (input: {
  userId: string;
}): Promise<{ items: CategorySummaryItem[] }> => {
  await assertUserOwnership(input.userId);

  const rows = await prisma.transaction.groupBy({
    by: ["category", "type"],
    where: { userId: input.userId },
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: [{ category: "asc" }, { type: "asc" }],
  });

  return {
    items: rows.map((row) => ({
      category: row.category,
      type: row.type,
      totalAmount: Number(row._sum.amount ?? 0),
      transactionCount: row._count._all,
    })),
  };
};
