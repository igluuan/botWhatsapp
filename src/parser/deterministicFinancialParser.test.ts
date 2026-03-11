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
      payment_method: null,
      description: "pizza",
    });
  });

  it("parses income verb pattern", () => {
    const result = parseDeterministicFinancialMessage("recebi 5000 salario empresa");

    expect(result.matched).toBe(true);
    expect(result.data?.type).toBe("income");
    expect(result.data?.amount).toBe(5000);
    expect(result.data?.category).toBe("renda");
  });

  it("parses expense with verb + description + amount + reais suffix", () => {
    const result = parseDeterministicFinancialMessage("comprei pão 7 reais");

    expect(result.matched).toBe(true);
    expect(result.reason).toBe("deterministic-match");
    expect(result.data).toEqual({
      type: "expense",
      amount: 7,
      category: "alimentação",
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

  it("infers almoço for temporal-only description", () => {
    const result = parseDeterministicFinancialMessage("almocei hoje 55");

    expect(result).toEqual({
      matched: true,
      reason: "deterministic-match",
      data: {
        type: "expense",
        amount: 55,
        category: "alimentação",
        payment_method: null,
        description: "almoço",
      },
    });
  });

  it("infers jantar for temporal-only description", () => {
    const result = parseDeterministicFinancialMessage("jantei ontem 40");

    expect(result).toEqual({
      matched: true,
      reason: "deterministic-match",
      data: {
        type: "expense",
        amount: 40,
        category: "alimentação",
        payment_method: null,
        description: "jantar",
      },
    });
  });

  it("infers almoço when verb appears without explicit description", () => {
    const result = parseDeterministicFinancialMessage("almocei 30");

    expect(result).toEqual({
      matched: true,
      reason: "deterministic-match",
      data: {
        type: "expense",
        amount: 30,
        category: "alimentação",
        payment_method: null,
        description: "almoço",
      },
    });
  });

  it("rejects payment-context-only descriptions", () => {
    const result = parseDeterministicFinancialMessage("paguei 22 no pix");

    expect(result).toEqual({
      matched: false,
      reason: "no-meaningful-description",
      data: null,
    });
  });

  it("rejects temporal-only descriptions for non-inferable verbs", () => {
    const result = parseDeterministicFinancialMessage("gastei 50 hoje");

    expect(result).toEqual({
      matched: false,
      reason: "no-meaningful-description",
      data: null,
    });
  });

  it("parses simple amount format for transport", () => {
    const result = parseDeterministicFinancialMessage("uber 20");

    expect(result).toEqual({
      matched: true,
      reason: "deterministic-match",
      data: {
        type: "expense",
        amount: 20,
        category: "transporte",
        payment_method: null,
        description: "uber",
      },
    });
  });

  it("rejects messages without supported pattern", () => {
    const result = parseDeterministicFinancialMessage("oi tudo bem");

    expect(result).toEqual({
      matched: false,
      reason: "no-supported-pattern",
      data: null,
    });
  });
});
