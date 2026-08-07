import { describe, expect, it } from "vitest";
import { buildDailyPreview, buildDailyUpdatePreview } from "./daily.js";

describe("buildDailyPreview", () => {
  it("monta payload válido com frequency daily e everyX 1", () => {
    const preview = buildDailyPreview({ titulo: "  Meditar  " });
    expect(preview.mode).toBe("preview");
    expect(preview.payload).toEqual({
      type: "daily",
      text: "Meditar",
      notes: "",
      alias: "meditar",
      priority: 1,
      frequency: "daily",
      everyX: 1,
    });
    expect(preview.limits).toMatch(/Recorrência mínima/);
  });

  it("respeita slug, weekly e every_x", () => {
    const preview = buildDailyPreview({
      titulo: "Revisão",
      slug: "revisao-semanal",
      notas: "timebox",
      dificuldade: "medium",
      frequencia: "weekly",
      every_x: 2,
    });
    expect(preview.payload.alias).toBe("revisao-semanal");
    expect(preview.payload.frequency).toBe("weekly");
    expect(preview.payload.everyX).toBe(2);
    expect(preview.payload.priority).toBe(1.5);
    expect(preview.payload.notes).toBe("timebox");
  });

  it("remove marcador legado [slug:...] das notas", () => {
    const preview = buildDailyPreview({
      titulo: "Diária",
      slug: "diaria",
      notas: "ok\n[slug:velho]",
    });
    expect(preview.payload.notes).toBe("ok");
  });

  it("falha sem título", () => {
    expect(() => buildDailyPreview({ titulo: "" })).toThrow(/titulo/);
  });

  it("falha com frequência inválida", () => {
    expect(() => buildDailyPreview({ titulo: "x", frequencia: "monthly" })).toThrow(
      /Frequência inválida/,
    );
  });

  it("falha com every_x < 1", () => {
    expect(() => buildDailyPreview({ titulo: "x", every_x: 0 })).toThrow(/every_x/);
  });
});

describe("buildDailyUpdatePreview", () => {
  it("monta update parcial válido", () => {
    const preview = buildDailyUpdatePreview({
      id: "d-1",
      frequencia: "weekly",
      every_x: 3,
    });
    expect(preview.payload).toEqual({ frequency: "weekly", everyX: 3 });
    expect(preview.limits).toMatch(/Recorrência mínima/);
  });

  it("falha sem campos mutáveis", () => {
    expect(() => buildDailyUpdatePreview({ id: "d-1" })).toThrow(/Nenhum campo para atualizar/);
  });

  it("falha sem id", () => {
    expect(() => buildDailyUpdatePreview({ id: "  ", titulo: "x" })).toThrow(/id/);
  });
});
