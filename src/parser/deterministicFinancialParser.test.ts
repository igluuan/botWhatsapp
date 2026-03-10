import { describe, expect, it } from "vitest";
import { parseDeterministicFinancialMessage } from "./deterministicFinancialParser.js";

describe("parseDeterministicFinancialMessage", () => {
  it("parses expense verb pattern with category and payment method", () => {
    const result = parseDeterministicFinancialMessage("gastei 25,50 pizza no pix");

    expect(result.matched).toBe(true);
    expect(result.reason).toBe("deterministic-match");
    expect(result.data).toEqual({
      type: "expense",
      amount: 25.5,
      category: "alimentação",
      payment_method: "pix",
      description: "pizza no pix",
    });
  });

  it("parses income verb pattern", () => {
    const result = parseDeterministicFinancialMessage("recebi 5000 salario empresa");

    expect(result.matched).toBe(true);
    expect(result.data?.type).toBe("income");
    expect(result.data?.amount).toBe(5000);
    expect(result.data?.category).toBe("salário");
  });

  it("parses expense with verb + description + amount + reais suffix", () => {
    const result = parseDeterministicFinancialMessage("comprei pão 7 reais");

    expect(result.matched).toBe(true);
    expect(result.reason).toBe("deterministic-match");
    expect(result.data).toEqual({
      type: "expense",
      amount: 7,
      category: "geral",
      payment_method: null,
      description: "pão",
    });
  });

  it("normalizes R$ prefix and parses verb + description + amount", () => {
    const result = parseDeterministicFinancialMessage("paguei café R$7");

    expect(result.matched).toBe(true);
    expect(result.reason).toBe("deterministic-match");
    expect(result.data).toEqual({
      type: "expense",
      amount: 7,
      category: "alimentação",
      payment_method: null,
      description: "café",
    });
  });

  it.each(["comprei", "almocei", "jantei", "tomei"])(
    "supports expense verb %s in description + amount format",
    (verb) => {
      const result = parseDeterministicFinancialMessage(`${verb} lanche 12`);

      expect(result.matched).toBe(true);
      expect(result.reason).toBe("deterministic-match");
      expect(result.data?.type).toBe("expense");
      expect(result.data?.amount).toBe(12);
      expect(result.data?.description).toBe("lanche");
    },
  );

  it("rejects messages without supported pattern", () => {
    const result = parseDeterministicFinancialMessage("oi tudo bem");

    expect(result).toEqual({
      matched: false,
      reason: "no-supported-pattern",
      data: null,
    });
  });
});
