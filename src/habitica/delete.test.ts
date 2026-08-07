import { describe, expect, it } from "vitest";
import type { ItemExecucao } from "../types.js";
import { buildDeletePreview, parseDeleteTipo } from "./delete.js";

function item(overrides: Partial<ItemExecucao> = {}): ItemExecucao {
  return {
    id: "task-1",
    tipo: "todo",
    titulo: "Exemplo",
    notas: "",
    dificuldade: "easy",
    ativo: true,
    ...overrides,
  };
}

describe("parseDeleteTipo", () => {
  it("aceita habit|daily|todo", () => {
    expect(parseDeleteTipo("habit")).toBe("habit");
    expect(parseDeleteTipo("daily")).toBe("daily");
    expect(parseDeleteTipo("todo")).toBe("todo");
  });

  it("rejeita reward e valores inválidos", () => {
    expect(() => parseDeleteTipo("reward")).toThrow(/reward fora de escopo/i);
    expect(() => parseDeleteTipo("quest")).toThrow(/Tipo inválido/);
  });
});

describe("buildDeletePreview", () => {
  it("monta preview quando tipo coincide", () => {
    const preview = buildDeletePreview("task-1", "todo", item());
    expect(preview.mode).toBe("preview");
    expect(preview.tipo).toBe("todo");
    expect(preview.item.titulo).toBe("Exemplo");
    expect(preview.risk).toMatch(/irreversível/i);
    expect(preview.message).toMatch(/confirm=true/);
  });

  it("falha quando tipo não coincide", () => {
    expect(() => buildDeletePreview("task-1", "habit", item({ tipo: "todo" }))).toThrow(
      /não coincide/,
    );
  });

  it("falha com id vazio", () => {
    expect(() => buildDeletePreview(" ", "todo", item())).toThrow(/id/);
  });
});
