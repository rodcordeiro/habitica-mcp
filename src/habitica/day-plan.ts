import { buildTodoPreview, type HabiticaTodoCreatePayload } from "./todo.js";

const MAX_DAY_PLAN_ITEMS = 15;

export interface DayPlanItemInput {
  titulo: string;
  notas?: string;
  origem?: string;
  prioridade?: "baixa" | "media" | "alta";
}

export interface DayPlanPreviewItem {
  titulo: string;
  notas: string;
  origem: string;
  prioridade: "baixa" | "media" | "alta";
  payload: HabiticaTodoCreatePayload;
}

export interface DayPlanPreviewResult {
  mode: "preview";
  items: DayPlanPreviewItem[];
  rejected: Array<{ index: number; error: string }>;
  limit: number;
}

/**
 * Monta preview de um lote de afazeres do plano do dia (sem escrita).
 */
export function buildDayPlanPreview(items: DayPlanItemInput[]): DayPlanPreviewResult {
  if (!Array.isArray(items)) {
    throw new Error("Campo items deve ser um array.");
  }
  if (items.length === 0) {
    throw new Error("Informe ao menos um item no plano do dia.");
  }
  if (items.length > MAX_DAY_PLAN_ITEMS) {
    throw new Error(`Máximo de ${MAX_DAY_PLAN_ITEMS} itens por chamada.`);
  }

  const accepted: DayPlanPreviewItem[] = [];
  const rejected: Array<{ index: number; error: string }> = [];
  const seen = new Set<string>();

  items.forEach((raw, index) => {
    try {
      const origem = (raw.origem ?? "day-plan").trim() || "day-plan";
      const prioridade = raw.prioridade ?? "media";
      if (prioridade !== "baixa" && prioridade !== "media" && prioridade !== "alta") {
        throw new Error("prioridade inválida (use baixa|media|alta).");
      }
      const notasBase = raw.notas?.trim() ?? "";
      const notas = [notasBase, `[origem:${origem}]`].filter(Boolean).join("\n");
      const dificuldade =
        prioridade === "alta" ? "hard" : prioridade === "baixa" ? "trivial" : "easy";
      const preview = buildTodoPreview({
        titulo: raw.titulo,
        notas,
        dificuldade,
      });
      const key = `${preview.item.titulo.toLowerCase()}::${origem.toLowerCase()}`;
      if (seen.has(key)) {
        throw new Error("Duplicidade no lote (mesmo título + origem).");
      }
      seen.add(key);
      accepted.push({
        titulo: preview.item.titulo,
        notas: preview.item.notas,
        origem,
        prioridade,
        payload: preview.payload,
      });
    } catch (err) {
      rejected.push({
        index,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  return {
    mode: "preview",
    items: accepted,
    rejected,
    limit: MAX_DAY_PLAN_ITEMS,
  };
}

export { MAX_DAY_PLAN_ITEMS };
