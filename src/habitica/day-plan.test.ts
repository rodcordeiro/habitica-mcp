import { describe, expect, it } from "vitest";
import { buildDayPlanPreview, resolveDayPlanDate } from "./day-plan.js";

describe("resolveDayPlanDate", () => {
  it("prioriza data do item, depois do plano, depois da origem", () => {
    expect(resolveDayPlanDate("planejamento-diario-2026-08-07", "2026-08-01", "2026-08-02")).toBe(
      "2026-08-01",
    );
    expect(resolveDayPlanDate("planejamento-diario-2026-08-07", undefined, "2026-08-02")).toBe(
      "2026-08-02",
    );
    expect(resolveDayPlanDate("planejamento-diario-2026-08-07")).toBe("2026-08-07");
  });
});

describe("buildDayPlanPreview", () => {
  it("gera lote com origem nas notas, slug no alias e prazo no dia", () => {
    const preview = buildDayPlanPreview(
      [
        {
          titulo: "Item A",
          origem: "planejamento-diario-2026-08-07",
          prioridade: "alta",
        },
        { titulo: "Item B", origem: "github" },
      ],
      { data: "2026-08-07" },
    );
    expect(preview.items).toHaveLength(2);
    expect(preview.data).toBe("2026-08-07");
    expect(preview.items[0]?.slug).toBe("item-a");
    expect(preview.items[0]?.payload.alias).toBe("item-a");
    expect(preview.items[0]?.payload.notes).toContain("[origem:planejamento-diario-2026-08-07]");
    expect(preview.items[0]?.payload.notes).not.toContain("[slug:");
    expect(preview.items[0]?.payload.date).toBe("2026-08-07");
    expect(preview.items[0]?.payload.priority).toBe(2);
    expect(preview.items[1]?.payload.date).toBe("2026-08-07");
    expect(preview.rejected).toHaveLength(0);
  });

  it("extrai data da origem quando o plano não informa data", () => {
    const preview = buildDayPlanPreview([
      { titulo: "Abrir RDMs", origem: "planejamento-diario-2026-08-07" },
    ]);
    expect(preview.items[0]?.payload.date).toBe("2026-08-07");
    expect(preview.items[0]?.data_limite).toBe("2026-08-07");
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
