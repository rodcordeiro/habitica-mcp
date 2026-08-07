import type { Dificuldade } from "../types.js";
import { dificuldadeToPriority, parseDificuldade } from "./difficulty.js";
import { optionalString, requireNonEmptyString, resolveSlug, stripSlugMarkers } from "./todo.js";

const MAX_TITULO = 200;
const MAX_NOTAS = 2000;

export interface HabitInput {
  titulo: string;
  slug?: string;
  notas?: string;
  dificuldade?: Dificuldade | string;
  /** Default true. */
  up?: boolean;
  /** Default true. */
  down?: boolean;
}

/** Payload Habitica para criar um hábito. */
export interface HabiticaHabitCreatePayload {
  type: "habit";
  text: string;
  notes: string;
  alias: string;
  priority: number;
  up: boolean;
  down: boolean;
}

export interface HabitPreviewResult {
  mode: "preview";
  payload: HabiticaHabitCreatePayload;
  item: {
    tipo: "habit";
    titulo: string;
    slug: string;
    notas: string;
    dificuldade: Dificuldade;
    up: boolean;
    down: boolean;
  };
}

export interface HabitUpdateInput {
  id: string;
  titulo?: string;
  slug?: string;
  notas?: string;
  dificuldade?: Dificuldade | string;
  up?: boolean;
  down?: boolean;
}

/** Campos enviados no PUT de hábito (parcial). */
export interface HabiticaHabitUpdatePayload {
  text?: string;
  notes?: string;
  alias?: string;
  priority?: number;
  up?: boolean;
  down?: boolean;
}

export interface HabitUpdatePreviewResult {
  mode: "preview";
  id: string;
  payload: HabiticaHabitUpdatePayload;
  item: {
    tipo: "habit";
    id: string;
    titulo?: string;
    slug?: string;
    notas?: string;
    dificuldade?: Dificuldade;
    up?: boolean;
    down?: boolean;
  };
}

/**
 * Valida campos de hábito e monta o payload Habitica (sem chamar a API).
 * `up` e `down` default true; pelo menos um deve ser true.
 */
export function buildHabitPreview(input: HabitInput): HabitPreviewResult {
  const titulo = requireNonEmptyString(input.titulo, "titulo", MAX_TITULO);
  const slug = resolveSlug(titulo, input.slug);
  const notasBase = optionalString(input.notas, "notas", MAX_NOTAS) ?? "";
  const notas = stripSlugMarkers(notasBase);
  if (notas.length > MAX_NOTAS) {
    throw new Error(`Campo notas excede ${MAX_NOTAS} caracteres.`);
  }
  const dificuldade = parseDificuldade(input.dificuldade ?? "easy");
  const { up, down } = resolveUpDown(input.up, input.down);

  const payload: HabiticaHabitCreatePayload = {
    type: "habit",
    text: titulo,
    notes: notas,
    alias: slug,
    priority: dificuldadeToPriority(dificuldade),
    up,
    down,
  };

  return {
    mode: "preview",
    payload,
    item: {
      tipo: "habit",
      titulo,
      slug,
      notas,
      dificuldade,
      up,
      down,
    },
  };
}

/**
 * Valida update parcial de hábito (exige id + pelo menos um campo mutável).
 */
export function buildHabitUpdatePreview(input: HabitUpdateInput): HabitUpdatePreviewResult {
  const id = requireNonEmptyString(input.id, "id", 100);
  const payload: HabiticaHabitUpdatePayload = {};
  const item: HabitUpdatePreviewResult["item"] = { tipo: "habit", id };

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

  if (input.up !== undefined || input.down !== undefined) {
    if (input.up === undefined || input.down === undefined) {
      throw new Error(
        "Ao alterar botões do hábito, informe up e down juntos (pelo menos um deve ser true).",
      );
    }
    const { up, down } = resolveUpDown(input.up, input.down);
    payload.up = up;
    payload.down = down;
    item.up = up;
    item.down = down;
  }

  if (Object.keys(payload).length === 0) {
    throw new Error(
      "Nenhum campo para atualizar. Informe titulo, slug, notas, dificuldade e/ou up+down.",
    );
  }

  return { mode: "preview", id, payload, item };
}

function resolveUpDown(upInput?: boolean, downInput?: boolean): { up: boolean; down: boolean } {
  const up = upInput === undefined ? true : requireBoolean(upInput, "up");
  const down = downInput === undefined ? true : requireBoolean(downInput, "down");
  if (!up && !down) {
    throw new Error("Hábito precisa de pelo menos um botão ativo (up ou down).");
  }
  return { up, down };
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Campo ${field} deve ser boolean.`);
  }
  return value;
}
