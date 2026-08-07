import type { Dificuldade } from "../types.js";
import { dificuldadeToPriority, parseDificuldade } from "./difficulty.js";
import { optionalString, requireNonEmptyString, resolveSlug, stripSlugMarkers } from "./todo.js";

const MAX_TITULO = 200;
const MAX_NOTAS = 2000;

export type DailyFrequencia = "daily" | "weekly";

export interface DailyInput {
  titulo: string;
  slug?: string;
  notas?: string;
  dificuldade?: Dificuldade | string;
  /** Default: daily. Recorrência mínima (daily|weekly + every_x). */
  frequencia?: DailyFrequencia | string;
  /** Intervalo da frequência. Default: 1, mínimo: 1. */
  every_x?: number;
}

/** Payload Habitica para criar uma diária (recorrência mínima). */
export interface HabiticaDailyCreatePayload {
  type: "daily";
  text: string;
  notes: string;
  alias: string;
  priority: number;
  frequency: DailyFrequencia;
  everyX: number;
}

export interface DailyPreviewResult {
  mode: "preview";
  payload: HabiticaDailyCreatePayload;
  item: {
    tipo: "daily";
    titulo: string;
    slug: string;
    notas: string;
    dificuldade: Dificuldade;
    frequencia: DailyFrequencia;
    every_x: number;
  };
  /** Limite documentado: sem days/startDate/checklist neste corte. */
  limits: string;
}

export interface DailyUpdateInput {
  id: string;
  titulo?: string;
  slug?: string;
  notas?: string;
  dificuldade?: Dificuldade | string;
  frequencia?: DailyFrequencia | string;
  every_x?: number;
}

export interface HabiticaDailyUpdatePayload {
  text?: string;
  notes?: string;
  alias?: string;
  priority?: number;
  frequency?: DailyFrequencia;
  everyX?: number;
}

export interface DailyUpdatePreviewResult {
  mode: "preview";
  id: string;
  payload: HabiticaDailyUpdatePayload;
  item: {
    tipo: "daily";
    id: string;
    titulo?: string;
    slug?: string;
    notas?: string;
    dificuldade?: Dificuldade;
    frequencia?: DailyFrequencia;
    every_x?: number;
  };
  limits: string;
}

const RECURRENCE_LIMIT =
  "Recorrência mínima: apenas frequency (daily|weekly) e everyX. Sem days/startDate/checklist neste corte.";

/**
 * Valida campos de diária e monta o payload Habitica (sem chamar a API).
 */
export function buildDailyPreview(input: DailyInput): DailyPreviewResult {
  const titulo = requireNonEmptyString(input.titulo, "titulo", MAX_TITULO);
  const slug = resolveSlug(titulo, input.slug);
  const notasBase = optionalString(input.notas, "notas", MAX_NOTAS) ?? "";
  const notas = stripSlugMarkers(notasBase);
  if (notas.length > MAX_NOTAS) {
    throw new Error(`Campo notas excede ${MAX_NOTAS} caracteres.`);
  }
  const dificuldade = parseDificuldade(input.dificuldade ?? "easy");
  const frequencia = parseFrequencia(input.frequencia ?? "daily");
  const everyX = parseEveryX(input.every_x ?? 1);

  const payload: HabiticaDailyCreatePayload = {
    type: "daily",
    text: titulo,
    notes: notas,
    alias: slug,
    priority: dificuldadeToPriority(dificuldade),
    frequency: frequencia,
    everyX,
  };

  return {
    mode: "preview",
    payload,
    item: {
      tipo: "daily",
      titulo,
      slug,
      notas,
      dificuldade,
      frequencia,
      every_x: everyX,
    },
    limits: RECURRENCE_LIMIT,
  };
}

/**
 * Valida update parcial de diária (exige id + pelo menos um campo mutável).
 */
export function buildDailyUpdatePreview(input: DailyUpdateInput): DailyUpdatePreviewResult {
  const id = requireNonEmptyString(input.id, "id", 100);
  const payload: HabiticaDailyUpdatePayload = {};
  const item: DailyUpdatePreviewResult["item"] = { tipo: "daily", id };

  if (input.titulo !== undefined) {
    const titulo = requireNonEmptyString(input.titulo, "titulo", MAX_TITULO);
    payload.text = titulo;
    item.titulo = titulo;
  }

  if (input.slug !== undefined) {
    const baseTitulo = item.titulo ?? "item";
    const slug = resolveSlug(baseTitulo, input.slug);
    payload.alias = slug;
    item.slug = slug;
  }

  if (input.notas !== undefined) {
    const notasBase = optionalString(input.notas, "notas", MAX_NOTAS) ?? "";
    const notas = stripSlugMarkers(notasBase);
    if (notas.length > MAX_NOTAS) {
      throw new Error(`Campo notas excede ${MAX_NOTAS} caracteres.`);
    }
    payload.notes = notas;
    item.notas = notas;
  }

  if (input.dificuldade !== undefined) {
    const dificuldade = parseDificuldade(input.dificuldade);
    payload.priority = dificuldadeToPriority(dificuldade);
    item.dificuldade = dificuldade;
  }

  if (input.frequencia !== undefined) {
    const frequencia = parseFrequencia(input.frequencia);
    payload.frequency = frequencia;
    item.frequencia = frequencia;
  }

  if (input.every_x !== undefined) {
    const everyX = parseEveryX(input.every_x);
    payload.everyX = everyX;
    item.every_x = everyX;
  }

  if (Object.keys(payload).length === 0) {
    throw new Error(
      "Nenhum campo para atualizar. Informe titulo, slug, notas, dificuldade, frequencia e/ou every_x.",
    );
  }

  return { mode: "preview", id, payload, item, limits: RECURRENCE_LIMIT };
}

function parseFrequencia(value: unknown): DailyFrequencia {
  if (value === "daily" || value === "weekly") {
    return value;
  }
  throw new Error(`Frequência inválida: ${String(value)}. Use daily|weekly.`);
}

function parseEveryX(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error("Campo every_x deve ser um inteiro >= 1.");
  }
  return value;
}
