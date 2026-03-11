import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteUserCategoryRule,
  findUserCategoryRule,
  listUserCategoryRules,
  saveUserCategoryRule,
} from "./categoryRuleService.js";

vi.mock("../database/prisma.js", () => ({
  prisma: {
    userCategoryRule: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "../database/prisma.js";

const mockPrisma = prisma as unknown as {
  userCategoryRule: {
    upsert: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const USER_ID = "user-123";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveUserCategoryRule", () => {
  it("salva regra com keyword normalizada", async () => {
    mockPrisma.userCategoryRule.upsert.mockResolvedValue({});

    await saveUserCategoryRule(USER_ID, "Shell Gasolina", "transporte");

    expect(mockPrisma.userCategoryRule.upsert).toHaveBeenCalledWith({
      where: { userId_keyword: { userId: USER_ID, keyword: "shell gasolina" } },
      create: { userId: USER_ID, keyword: "shell gasolina", category: "transporte" },
      update: { category: "transporte" },
    });
  });

  it("normaliza acentos na keyword", async () => {
    mockPrisma.userCategoryRule.upsert.mockResolvedValue({});

    await saveUserCategoryRule(USER_ID, "Farmácia São João", "saúde");

    expect(mockPrisma.userCategoryRule.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_keyword: { userId: USER_ID, keyword: "farmacia sao joao" } },
      }),
    );
  });

  it("ignora keyword com menos de 2 chars", async () => {
    await saveUserCategoryRule(USER_ID, "a", "transporte");

    expect(mockPrisma.userCategoryRule.upsert).not.toHaveBeenCalled();
  });

  it("ignora keyword vazia", async () => {
    await saveUserCategoryRule(USER_ID, "", "transporte");

    expect(mockPrisma.userCategoryRule.upsert).not.toHaveBeenCalled();
  });

  it("sobrescreve categoria existente com upsert", async () => {
    mockPrisma.userCategoryRule.upsert.mockResolvedValue({});

    await saveUserCategoryRule(USER_ID, "shell", "transporte");
    await saveUserCategoryRule(USER_ID, "shell", "lazer");

    expect(mockPrisma.userCategoryRule.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        update: { category: "lazer" },
      }),
    );
  });
});

describe("findUserCategoryRule", () => {
  it("retorna categoria no match exato", async () => {
    mockPrisma.userCategoryRule.findFirst.mockResolvedValue({ category: "transporte" });
    mockPrisma.userCategoryRule.findMany.mockResolvedValue([]);

    const result = await findUserCategoryRule(USER_ID, "shell");

    expect(result).toBe("transporte");
  });

  it("retorna categoria por substring quando não há match exato", async () => {
    mockPrisma.userCategoryRule.findFirst.mockResolvedValue(null);
    mockPrisma.userCategoryRule.findMany.mockResolvedValue([
      { keyword: "shell", category: "transporte" },
    ]);

    const result = await findUserCategoryRule(USER_ID, "shell posto gasolina");

    expect(result).toBe("transporte");
  });

  it("prioriza keyword mais longa no match por substring", async () => {
    mockPrisma.userCategoryRule.findFirst.mockResolvedValue(null);
    mockPrisma.userCategoryRule.findMany.mockResolvedValue([
      { keyword: "shell gasolina", category: "transporte" },
      { keyword: "shell", category: "lazer" },
    ]);

    const result = await findUserCategoryRule(USER_ID, "shell gasolina extra");

    expect(result).toBe("transporte");
  });

  it("retorna null quando não há regra pessoal", async () => {
    mockPrisma.userCategoryRule.findFirst.mockResolvedValue(null);
    mockPrisma.userCategoryRule.findMany.mockResolvedValue([]);

    const result = await findUserCategoryRule(USER_ID, "pizza");

    expect(result).toBeNull();
  });

  it("retorna null para descrição vazia", async () => {
    const result = await findUserCategoryRule(USER_ID, "");

    expect(result).toBeNull();
    expect(mockPrisma.userCategoryRule.findFirst).not.toHaveBeenCalled();
  });

  it("normaliza acentos na busca", async () => {
    mockPrisma.userCategoryRule.findFirst.mockResolvedValue({ category: "saúde" });
    mockPrisma.userCategoryRule.findMany.mockResolvedValue([]);

    const result = await findUserCategoryRule(USER_ID, "Farmácia São João");

    expect(mockPrisma.userCategoryRule.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, keyword: "farmacia sao joao" },
      }),
    );
    expect(result).toBe("saúde");
  });
});

describe("listUserCategoryRules", () => {
  it("retorna lista de regras do usuário", async () => {
    mockPrisma.userCategoryRule.findMany.mockResolvedValue([
      { keyword: "shell", category: "transporte" },
      { keyword: "academia", category: "saúde" },
    ]);

    const result = await listUserCategoryRules(USER_ID);

    expect(result).toEqual([
      { keyword: "shell", category: "transporte" },
      { keyword: "academia", category: "saúde" },
    ]);
  });

  it("retorna lista vazia quando não há regras", async () => {
    mockPrisma.userCategoryRule.findMany.mockResolvedValue([]);

    const result = await listUserCategoryRules(USER_ID);

    expect(result).toEqual([]);
  });
});

describe("deleteUserCategoryRule", () => {
  it("deleta regra existente e retorna true", async () => {
    mockPrisma.userCategoryRule.delete.mockResolvedValue({});

    const result = await deleteUserCategoryRule(USER_ID, "shell");

    expect(result).toBe(true);
    expect(mockPrisma.userCategoryRule.delete).toHaveBeenCalledWith({
      where: { userId_keyword: { userId: USER_ID, keyword: "shell" } },
    });
  });

  it("retorna false quando regra não existe", async () => {
    mockPrisma.userCategoryRule.delete.mockRejectedValue(new Error("not found"));

    const result = await deleteUserCategoryRule(USER_ID, "nao existe");

    expect(result).toBe(false);
  });

  it("retorna false para keyword vazia", async () => {
    const result = await deleteUserCategoryRule(USER_ID, "");

    expect(result).toBe(false);
    expect(mockPrisma.userCategoryRule.delete).not.toHaveBeenCalled();
  });
});
