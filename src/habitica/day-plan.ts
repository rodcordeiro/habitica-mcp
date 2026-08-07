import {
  buildTodoPreview,
  extractIsoDateFromText,
  todayLocalIsoDate,
  type HabiticaTodoCreatePayload,
} from "./todo.js";

const MAX_DAY_PLAN_ITEMS = 15;

export interface DayPlanItemInput {
  titulo: string;
  slug?: string;
  notas?: string;
  origem?: string;
  prioridade?: "baixa" | "media" | "alta";
  /** Data limite do item (YYYY-MM-DD). Se omitida, usa data do plano / origem / hoje. */
  data?: string;
}

export interface DayPlanPreviewOptions {
  /** Dia do planejamento (YYYY-MM-DD). Default: hoje (local). */
  data?: string;
}

export interface DayPlanPreviewItem {
  titulo: string;
  slug: string;
  notas: string;
  origem: string;
  prioridade: "baixa" | "media" | "alta";
  data_limite: string;
  payload: HabiticaTodoCreatePayload;
}

export interface DayPlanPreviewResult {
  mode: "preview";
  data: string;
  items: DayPlanPreviewItem[];
  rejected: Array<{ index: number; error: string }>;
  limit: number;
}

/**
 * Resolve a data do plano do dia: argumento explícito, data na origem, ou hoje local.
 */
export function resolveDayPlanDate(origem: string, itemData?: string, planData?: string): string {
  if (itemData !== undefined && itemData !== null && String(itemData).trim() !== "") {
    return requireIsoDate(String(itemData).trim(), "data do item");
  }
  if (planData !== undefined && planData !== null && String(planData).trim() !== "") {
    return requireIsoDate(String(planData).trim(), "data do plano");
  }
  const fromOrigem = extractIsoDateFromText(origem);
  if (fromOrigem) {
    return fromOrigem;
  }
  return todayLocalIsoDate();
}

/**
 * Monta preview de um lote de afazeres do plano do dia (sem escrita).
 * Cada item recebe prazo no dia do planejamento e slug no alias Habitica.
 */
export function buildDayPlanPreview(
  items: DayPlanItemInput[],
  options: DayPlanPreviewOptions = {},
): DayPlanPreviewResult {
  if (!Array.isArray(items)) {
    throw new Error("Campo items deve ser um array.");
  }
  if (items.length === 0) {
    throw new Error("Informe ao menos um item no plano do dia.");
  }
  if (items.length > MAX_DAY_PLAN_ITEMS) {
    throw new Error(`Máximo de ${MAX_DAY_PLAN_ITEMS} itens por chamada.`);
  }

  const planData = options.data?.trim() || undefined;
  if (planData) {
    requireIsoDate(planData, "data do plano");
  }

  const accepted: DayPlanPreviewItem[] = [];
  const rejected: Array<{ index: number; error: string }> = [];
  const seen = new Set<string>();
  let resolvedPlanData = planData ?? todayLocalIsoDate();

  items.forEach((raw, index) => {
    try {
      const origem = (raw.origem ?? "day-plan").trim() || "day-plan";
      const prioridade = raw.prioridade ?? "media";
      if (prioridade !== "baixa" && prioridade !== "media" && prioridade !== "alta") {
        throw new Error("prioridade inválida (use baixa|media|alta).");
      }
      const dataLimite = resolveDayPlanDate(origem, raw.data, planData);
      if (!planData && index === 0) {
        resolvedPlanData = dataLimite;
      }
      const notasBase = raw.notas?.trim() ?? "";
      const notas = [notasBase, `[origem:${origem}]`].filter(Boolean).join("\n");
      const dificuldade =
        prioridade === "alta" ? "hard" : prioridade === "baixa" ? "trivial" : "easy";
      const preview = buildTodoPreview({
        titulo: raw.titulo,
        slug: raw.slug,
        notas,
        dificuldade,
        data_limite: dataLimite,
      });
      const key = `${preview.item.titulo.toLowerCase()}::${origem.toLowerCase()}`;
      if (seen.has(key)) {
        throw new Error("Duplicidade no lote (mesmo título + origem).");
      }
      seen.add(key);
      accepted.push({
        titulo: preview.item.titulo,
        slug: preview.item.slug,
        notas: preview.item.notas,
        origem,
        prioridade,
        data_limite: dataLimite,
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
    data: resolvedPlanData,
    items: accepted,
    rejected,
    limit: MAX_DAY_PLAN_ITEMS,
  };
}

function requireIsoDate(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isNaN(Date.parse(value))) {
    throw new Error(`Campo ${field} inválido. Use YYYY-MM-DD ou ISO datetime.`);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Campo ${field} inválido. Use YYYY-MM-DD ou ISO datetime.`);
  }
  return todayLocalIsoDate(parsed);
}

export { MAX_DAY_PLAN_ITEMS };
