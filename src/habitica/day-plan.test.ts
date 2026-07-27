import { describe, expect, it } from "vitest";
import { buildDayPlanPreview } from "./day-plan.js";

describe("buildDayPlanPreview", () => {
  it("gera lote com marcador de origem", () => {
    const preview = buildDayPlanPreview([
      { titulo: "Item A", origem: "obsidian", prioridade: "alta" },
      { titulo: "Item B", origem: "github" },
    ]);
    expect(preview.items).toHaveLength(2);
    expect(preview.items[0]?.payload.notes).toContain("[origem:obsidian]");
    expect(preview.items[0]?.payload.priority).toBe(2);
    expect(preview.rejected).toHaveLength(0);
  });

  it("rejeita duplicidade e item inválido", () => {
    const preview = buildDayPlanPreview([
      { titulo: "Mesmo", origem: "x" },
      { titulo: "Mesmo", origem: "x" },
      { titulo: "  " },
    ]);
    expect(preview.items).toHaveLength(1);
    expect(preview.rejected.length).toBeGreaterThanOrEqual(2);
  });

  it("respeita limite máximo", () => {
    const items = Array.from({ length: 16 }, (_, i) => ({ titulo: `T${i}` }));
    expect(() => buildDayPlanPreview(items)).toThrow(/Máximo/);
  });
});
