import { describe, expect, it } from "vitest";
import { loadConfig, redactSecrets } from "./config.js";

describe("loadConfig", () => {
  it("falha cedo quando faltam variáveis", () => {
    expect(() => loadConfig({})).toThrow(/HABITICA_USER_ID/);
    expect(() => loadConfig({})).toThrow(/HABITICA_API_TOKEN/);
    expect(() => loadConfig({})).toThrow(/HABITICA_X_CLIENT/);
  });

  it("não inclui valores secretos na mensagem de erro", () => {
    const env = {
      HABITICA_USER_ID: "user-secret-value",
      HABITICA_API_TOKEN: "",
      HABITICA_X_CLIENT: "client-secret-value",
    };
    try {
      loadConfig(env);
      expect.unreachable();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      expect(msg).not.toContain("user-secret-value");
      expect(msg).not.toContain("client-secret-value");
      expect(msg).toMatch(/HABITICA_API_TOKEN/);
    }
  });

  it("carrega config válida", () => {
    const cfg = loadConfig({
      HABITICA_USER_ID: " uid ",
      HABITICA_API_TOKEN: " tok ",
      HABITICA_X_CLIENT: " cli ",
    });
    expect(cfg).toEqual({
      userId: "uid",
      apiToken: "tok",
      xClient: "cli",
    });
  });
});

describe("redactSecrets", () => {
  it("mascara token, user e client", () => {
    const cfg = {
      userId: "USER123",
      apiToken: "TOKEN456",
      xClient: "CLIENT789",
    };
    const msg = redactSecrets("fail USER123 TOKEN456 CLIENT789 x-api-key=TOKEN456", cfg);
    expect(msg).not.toContain("USER123");
    expect(msg).not.toContain("TOKEN456");
    expect(msg).not.toContain("CLIENT789");
    expect(msg).toContain("[REDACTED]");
  });
});
