import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  category: {
    upsert: vi.fn(),
  },
  transaction: {
    findFirst: vi.fn(),
    create: vi.fn(),
    aggregate: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock("../database/prisma.js", () => ({
  prisma: prismaMock,
}));

import {
  generateDailySummary,
  registerExpense,
  registerIncome,
} from "./financialService.js";

describe("financialService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates financial integrity in daily summary totals and balance", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "user-1" });
    prismaMock.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal(120) } })
      .mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal(200) } });
    prismaMock.transaction.count.mockResolvedValue(3);

    const result = await generateDailySummary({
      userId: "user-1",
      referenceDate: new Date("2026-03-09T12:00:00.000Z"),
    });

    expect(result.totalExpense).toBe(120);
    expect(result.totalIncome).toBe(200);
    expect(result.balance).toBe(80);
    expect(result.transactionCount).toBe(3);
  });

  it("detects duplicate transactions before creation", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "user-1" });
    prismaMock.category.upsert.mockResolvedValue({ id: "cat-1", name: "mercado" });
    prismaMock.transaction.findFirst.mockResolvedValue({ id: "tx-duplicate" });

    await expect(
      registerExpense({
        userId: "user-1",
        amount: 50,
        category: "mercado",
        paymentMethod: "pix",
        description: "compra",
        transactionDate: new Date("2026-03-09T00:00:00.000Z"),
      }),
    ).rejects.toThrowError("duplicate-transaction");

    expect(prismaMock.transaction.create).not.toHaveBeenCalled();
  });

  it("rejects transaction creation for unauthorized user ownership", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      registerIncome({
        userId: "missing-user",
        amount: 500,
        category: "renda",
        paymentMethod: null,
        description: "freela",
      }),
    ).rejects.toThrowError("user-not-found");
  });
});
