import { describe, expect, it } from "vitest";
import { runAuthorizationCheck } from "./authorizationCheck.js";

describe("runAuthorizationCheck", () => {
  it("authorizes when jid is present in allowlist", () => {
    const result = runAuthorizationCheck(
      {
        messageId: "m-1",
        remoteJid: "5511999999999@s.whatsapp.net",
        pushName: "User",
        timestamp: new Date(),
        rawPayload: {},
      },
      ["5511999999999@s.whatsapp.net"],
    );

    expect(result).toEqual({
      isAuthorized: true,
      reason: "authorized-jid-match",
    });
  });

  it("rejects unauthorized jid", () => {
    const result = runAuthorizationCheck(
      {
        messageId: "m-2",
        remoteJid: "5511888888888@s.whatsapp.net",
        pushName: "Other",
        timestamp: new Date(),
        rawPayload: {},
      },
      ["5511999999999@s.whatsapp.net"],
    );

    expect(result).toEqual({
      isAuthorized: false,
      reason: "unauthorized-jid",
    });
  });
});
