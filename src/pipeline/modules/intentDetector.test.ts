import { describe, expect, it } from "vitest";
import { detectIntent } from "./intentDetector.js";

describe("detectIntent", () => {
  it("detects greeting intent", () => {
    expect(detectIntent("ola")).toBe("greeting");
  });

  it("detects help intent", () => {
    expect(detectIntent("como funciona isso")).toBe("help");
  });

  it("detects small talk intent", () => {
    expect(detectIntent("tudo bem por ai")).toBe("small_talk");
  });

  it("detects expense query intent", () => {
    expect(detectIntent("quanto eu gastei hoje")).toBe("expense_query");
  });

  it("detects financial intent", () => {
    expect(detectIntent("uber 20")).toBe("financial");
  });

  it("detects unknown intent", () => {
    expect(detectIntent("mensagem sem padrao")).toBe("unknown");
  });
});
