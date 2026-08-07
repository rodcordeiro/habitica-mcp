import { describe, expect, it } from "vitest";
import { buildTodoPreview, resolveSlug, slugifyTitulo } from "./todo.js";

describe("slugifyTitulo", () => {
  it("gera kebab-case sem acentos", () => {
    expect(slugifyTitulo("  Comprar pão  ")).toBe("comprar-pao");
    expect(slugifyTitulo("Entregar relatório!")).toBe("entregar-relatorio");
  });
});

describe("resolveSlug", () => {
  it("usa slug informado quando válido", () => {
    expect(resolveSlug("Qualquer", "meu-slug")).toBe("meu-slug");
  });

  it("gera do título quando ausente", () => {
    expect(resolveSlug("Comprar pão")).toBe("comprar-pao");
  });

  it("rejeita slug inválido", () => {
    expect(() => resolveSlug("x", "Inválido!")).toThrow(/slug inválido/i);
  });
});

describe("buildTodoPreview", () => {
  it("monta payload válido com slug no alias (não nas notas)", () => {
    const preview = buildTodoPreview({ titulo: "  Comprar pão  " });
    expect(preview.mode).toBe("preview");
    expect(preview.item.slug).toBe("comprar-pao");
    expect(preview.payload).toEqual({
      type: "todo",
      text: "Comprar pão",
      notes: "",
      alias: "comprar-pao",
      priority: 1,
    });
    expect(preview.item.dificuldade).toBe("easy");
  });

  it("respeita slug informado e preserva notas sem marcador de slug", () => {
    const preview = buildTodoPreview({
      titulo: "Entregar relatório",
      slug: "relatorio-final",
      notas: "cap. 2",
      dificuldade: "hard",
      data_limite: "2026-08-01",
      tags: ["trabalho"],
    });
    expect(preview.item.slug).toBe("relatorio-final");
    expect(preview.payload.alias).toBe("relatorio-final");
    expect(preview.payload.notes).toBe("cap. 2");
    expect(preview.payload.priority).toBe(2);
    expect(preview.payload.date).toBe("2026-08-01");
    expect(preview.payload.tags).toEqual(["trabalho"]);
  });

  it("remove marcador legado [slug:...] das notas", () => {
    const preview = buildTodoPreview({
      titulo: "Item",
      slug: "item",
      notas: "texto\n[slug:antigo]",
    });
    expect(preview.payload.notes).toBe("texto");
    expect(preview.payload.alias).toBe("item");
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
