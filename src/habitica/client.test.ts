import { afterEach, describe, expect, it, vi } from "vitest";
import type { HabiticaConfig } from "../config.js";
import { HabiticaClient } from "./client.js";

const config: HabiticaConfig = {
  userId: "user-id",
  apiToken: "api-token",
  xClient: "user-id-habitica-mcp",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HabiticaClient.resolveTags", () => {
  it("resolve nomes sem diferenciar maiusculas e preserva IDs explicitos", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: [
              { id: "tag-vault", name: "Vault" },
              { id: "tag-work", name: "Work" },
              { id: "other-tag", name: "tag-work" },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await new HabiticaClient(config).resolveTags(["vault", "tag-work"]);

    expect(result).toEqual({ tagIds: ["tag-vault", "tag-work"], warnings: [] });
  });

  it("ignora etiquetas inexistentes e evidencia nomes ambiguos", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: [
              { id: "tag-1", name: "Work" },
              { id: "tag-2", name: "work" },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await new HabiticaClient(config).resolveTags(["missing", "WORK"]);

    expect(result).toEqual({
      tagIds: ["tag-1", "tag-2"],
      warnings: [
        { tag: "missing", reason: "Etiqueta não encontrada; ignorada." },
        {
          tag: "WORK",
          reason: "Nome ambíguo; 2 etiquetas correspondentes foram aplicadas.",
        },
      ],
    });
  });
});
