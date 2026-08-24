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

  it("substitui nomes por IDs no payload e omite tags quando nenhum nome existe", async () => {
    const fetchMock = vi.fn((input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/tags")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ success: true, data: [{ id: "tag-vault", name: "Vault" }] }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: { id: "todo-1", type: "todo", text: "Teste", notes: "", priority: 1 },
          }),
          { status: init?.method === "PUT" ? 200 : 201 },
        ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = new HabiticaClient(config);
    const resolvedPayload = {
      type: "todo" as const,
      text: "Teste",
      notes: "",
      alias: "teste",
      priority: 1,
      tags: ["vault"],
    };
    const unknownPayload: { tags?: string[] } = { tags: ["missing"] };

    const resolvedWarnings = await client.resolveTaskTags(resolvedPayload, ["vault"]);
    await client.createTodo(resolvedPayload);
    await client.updateTask("todo-1", { tags: resolvedPayload.tags });
    const unknownWarnings = await client.resolveTaskTags(unknownPayload, ["missing"]);
    await client.updateTask("todo-1", unknownPayload);

    expect(resolvedPayload.tags).toEqual(["tag-vault"]);
    expect(resolvedWarnings).toEqual([]);
    expect(unknownPayload).not.toHaveProperty("tags");
    expect(unknownWarnings).toEqual([
      { tag: "missing", reason: "Etiqueta não encontrada; ignorada." },
    ]);
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    const puts = fetchMock.mock.calls.filter(([, init]) => init?.method === "PUT");
    expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({ tags: ["tag-vault"] });
    expect(JSON.parse(String(puts[0]?.[1]?.body))).toMatchObject({ tags: ["tag-vault"] });
    expect(JSON.parse(String(puts[1]?.[1]?.body))).not.toHaveProperty("tags");
  });
});
