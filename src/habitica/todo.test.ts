import { describe, expect, it } from "vitest";
import { buildTodoPreview } from "./todo.js";

describe("buildTodoPreview", () => {
  it("monta payload válido com defaults", () => {
    const preview = buildTodoPreview({ titulo: "  Comprar pão  " });
    expect(preview.mode).toBe("preview");
    expect(preview.payload).toEqual({
      type: "todo",
      text: "Comprar pão",
      notes: "",
      priority: 1,
    });
    expect(preview.item.dificuldade).toBe("easy");
  });

  it("normaliza dificuldade e data", () => {
    const preview = buildTodoPreview({
      titulo: "Entregar relatório",
      notas: "cap. 2",
      dificuldade: "hard",
      data_limite: "2026-08-01",
      tags: ["trabalho"],
    });
    expect(preview.payload.priority).toBe(2);
    expect(preview.payload.date).toBe("2026-08-01");
    expect(preview.payload.tags).toEqual(["trabalho"]);
  });

  it("falha sem título", () => {
    expect(() => buildTodoPreview({ titulo: "  " })).toThrow(/titulo/);
  });

  it("falha com dificuldade inválida", () => {
    expect(() => buildTodoPreview({ titulo: "x", dificuldade: "extreme" })).toThrow(
      /Dificuldade inválida/,
    );
  });

  it("falha com tags inválidas", () => {
    expect(() => buildTodoPreview({ titulo: "x", tags: [""] })).toThrow(/Tag inválida/);
  });
});
