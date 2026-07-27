import type { Dificuldade } from "../types.js";
import { dificuldadeToPriority, parseDificuldade } from "./difficulty.js";

const MAX_TITULO = 200;
const MAX_NOTAS = 2000;
const MAX_TAGS = 20;
const MAX_TAG_LEN = 50;

export interface TodoInput {
  titulo: string;
  notas?: string;
  dificuldade?: Dificuldade | string;
  data_limite?: string;
  tags?: string[];
}

/** Payload que seria enviado à API Habitica para criar um todo. */
export interface HabiticaTodoCreatePayload {
  type: "todo";
  text: string;
  notes: string;
  priority: number;
  date?: string;
  tags?: string[];
}

export interface TodoPreviewResult {
  mode: "preview";
  payload: HabiticaTodoCreatePayload;
  item: {
    tipo: "todo";
    titulo: string;
    notas: string;
    dificuldade: Dificuldade;
    data_limite: string | null;
    tags: string[];
  };
}

/**
 * Valida campos de afazer e monta o payload Habitica (sem chamar a API).
 */
export function buildTodoPreview(input: TodoInput): TodoPreviewResult {
  const titulo = requireNonEmptyString(input.titulo, "titulo", MAX_TITULO);
  const notas = optionalString(input.notas, "notas", MAX_NOTAS) ?? "";
  const dificuldade = parseDificuldade(input.dificuldade ?? "easy");
  const dataLimite = optionalDate(input.data_limite);
  const tags = optionalTags(input.tags);

  const payload: HabiticaTodoCreatePayload = {
    type: "todo",
    text: titulo,
    notes: notas,
    priority: dificuldadeToPriority(dificuldade),
  };
  if (dataLimite) {
    payload.date = dataLimite;
  }
  if (tags && tags.length > 0) {
    payload.tags = tags;
  }

  return {
    mode: "preview",
    payload,
    item: {
      tipo: "todo",
      titulo,
      notas,
      dificuldade,
      data_limite: dataLimite ?? null,
      tags: tags ?? [],
    },
  };
}

function requireNonEmptyString(value: unknown, field: string, max: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Campo obrigatório ausente ou vazio: ${field}.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new Error(`Campo ${field} excede ${max} caracteres.`);
  }
  return trimmed;
}

function optionalString(value: unknown, field: string, max: number): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error(`Campo ${field} deve ser string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new Error(`Campo ${field} excede ${max} caracteres.`);
  }
  return trimmed;
}

function optionalDate(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error("Campo data_limite deve ser string ISO (YYYY-MM-DD).");
  }
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) && Number.isNaN(Date.parse(trimmed))) {
    throw new Error("Campo data_limite inválido. Use YYYY-MM-DD ou ISO datetime.");
  }
  return trimmed;
}

function optionalTags(value: unknown): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error("Campo tags deve ser um array de strings.");
  }
  if (value.length > MAX_TAGS) {
    throw new Error(`Máximo de ${MAX_TAGS} tags.`);
  }
  return value.map((tag, i) => {
    if (typeof tag !== "string" || tag.trim().length === 0) {
      throw new Error(`Tag inválida no índice ${i}.`);
    }
    const t = tag.trim();
    if (t.length > MAX_TAG_LEN) {
      throw new Error(`Tag no índice ${i} excede ${MAX_TAG_LEN} caracteres.`);
    }
    return t;
  });
}
