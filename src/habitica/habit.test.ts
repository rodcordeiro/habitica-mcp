import { describe, expect, it } from "vitest";
import { buildHabitPreview, buildHabitUpdatePreview } from "./habit.js";

describe("buildHabitPreview", () => {
  it("monta payload válido com up/down default true e slug no alias", () => {
    const preview = buildHabitPreview({ titulo: "  Beber água  " });
    expect(preview.mode).toBe("preview");
    expect(preview.payload).toEqual({
      type: "habit",
      text: "Beber água",
      notes: "",
      alias: "beber-agua",
      priority: 1,
      up: true,
      down: true,
    });
    expect(preview.item.up).toBe(true);
    expect(preview.item.down).toBe(true);
  });

  it("respeita slug, notas, dificuldade e botões", () => {
    const preview = buildHabitPreview({
      titulo: "Exercício",
      slug: "exercicio-diario",
      notas: "30 min",
      dificuldade: "hard",
      up: true,
      down: false,
    });
    expect(preview.payload.alias).toBe("exercicio-diario");
    expect(preview.payload.notes).toBe("30 min");
    expect(preview.payload.priority).toBe(2);
    expect(preview.payload.up).toBe(true);
    expect(preview.payload.down).toBe(false);
  });

  it("remove marcador legado [slug:...] das notas", () => {
    const preview = buildHabitPreview({
      titulo: "Hábito",
      slug: "habito",
      notas: "texto\n[slug:antigo]",
    });
    expect(preview.payload.notes).toBe("texto");
    expect(preview.payload.alias).toBe("habito");
  });

  it("falha sem título", () => {
    expect(() => buildHabitPreview({ titulo: "  " })).toThrow(/titulo/);
  });

  it("falha se up e down forem ambos false", () => {
    expect(() => buildHabitPreview({ titulo: "x", up: false, down: false })).toThrow(
      /pelo menos um botão/i,
    );
  });

  it("falha com dificuldade inválida", () => {
    expect(() => buildHabitPreview({ titulo: "x", dificuldade: "extreme" })).toThrow(
      /Dificuldade inválida/,
    );
  });
});

describe("buildHabitUpdatePreview", () => {
  it("monta update parcial válido", () => {
    const preview = buildHabitUpdatePreview({
      id: "abc-123",
      titulo: "Novo título",
      dificuldade: "medium",
    });
    expect(preview.mode).toBe("preview");
    expect(preview.id).toBe("abc-123");
    expect(preview.payload).toEqual({
      text: "Novo título",
      priority: 1.5,
    });
  });

  it("exige up e down juntos ao alterar botões", () => {
    expect(() => buildHabitUpdatePreview({ id: "1", up: true })).toThrow(/up e down juntos/i);
  });

  it("falha sem campos mutáveis", () => {
    expect(() => buildHabitUpdatePreview({ id: "1" })).toThrow(/Nenhum campo para atualizar/);
  });

  it("falha sem id", () => {
    expect(() => buildHabitUpdatePreview({ id: " ", titulo: "x" })).toThrow(/id/);
  });
});
