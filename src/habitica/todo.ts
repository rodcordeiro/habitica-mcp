import type { Dificuldade } from "../types.js";
import { dificuldadeToPriority, parseDificuldade } from "./difficulty.js";

const MAX_TITULO = 200;
const MAX_NOTAS = 2000;
const MAX_TAGS = 20;
const MAX_TAG_LEN = 50;
const MAX_SLUG = 80;
const SLUG_MARKER_RE = /\[slug:[^\]]+\]/g;

export interface TodoInput {
  titulo: string;
  slug?: string;
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
  /** Alias da tarefa no Habitica (preenchido com o slug). */
  alias: string;
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
    slug: string;
    notas: string;
    dificuldade: Dificuldade;
    data_limite: string | null;
    tags: string[];
  };
}

/**
 * Gera slug kebab-case a partir de um título (ASCII, sem acentos).
 */
export function slugifyTitulo(titulo: string): string {
  const base = titulo
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, MAX_SLUG)
    .replace(/-+$/g, "");
  return base.length > 0 ? base : "item";
}

/**
 * Valida slug informado ou gera a partir do título.
 */
export function resolveSlug(titulo: string, slug?: string): string {
  if (slug === undefined || slug === null || String(slug).trim() === "") {
    return slugifyTitulo(titulo);
  }
  const trimmed = String(slug).trim().toLowerCase();
  if (trimmed.length > MAX_SLUG) {
    throw new Error(`Campo slug excede ${MAX_SLUG} caracteres.`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
    throw new Error("Campo slug inválido. Use kebab-case (a-z, 0-9 e hífens), sem acentos.");
  }
  return trimmed;
}

/**
 * Remove marcadores legados [slug:...] das notas (slug passa a ir no alias).
 */
export function stripSlugMarkers(notas: string): string {
  return notas
    .replace(SLUG_MARKER_RE, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/**
 * Extrai slug do marcador legado nas notas, se existir.
 */
export function extractSlugFromNotas(notas: string): string | null {
  const match = notas.match(/\[slug:([^\]]+)\]/);
  return match?.[1] ?? null;
}

/**
 * Data local atual no formato YYYY-MM-DD.
 */
export function todayLocalIsoDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Extrai a primeira data YYYY-MM-DD embutida em um texto (ex.: origem do plano).
 */
export function extractIsoDateFromText(text: string): string | null {
  const match = text.match(/\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? null;
}

/**
 * Valida campos de afazer e monta o payload Habitica (sem chamar a API).
 * O slug vira o `alias` da tarefa; não é mais escrito nas notas.
 */
export function buildTodoPreview(input: TodoInput): TodoPreviewResult {
  const titulo = requireNonEmptyString(input.titulo, "titulo", MAX_TITULO);
  const slug = resolveSlug(titulo, input.slug);
  const notasBase = optionalString(input.notas, "notas", MAX_NOTAS) ?? "";
  const notas = stripSlugMarkers(notasBase);
  if (notas.length > MAX_NOTAS) {
    throw new Error(`Campo notas excede ${MAX_NOTAS} caracteres.`);
  }
  const dificuldade = parseDificuldade(input.dificuldade ?? "easy");
  const dataLimite = optionalDate(input.data_limite);
  const tags = optionalTags(input.tags);

  const payload: HabiticaTodoCreatePayload = {
    type: "todo",
    text: titulo,
    notes: notas,
    alias: slug,
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
      slug,
      notas,
      dificuldade,
      data_limite: dataLimite ?? null,
      tags: tags ?? [],
    },
  };
}

/** String obrigatória não vazia, com limite de tamanho. */
export function requireNonEmptyString(value: unknown, field: string, max: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Campo obrigatório ausente ou vazio: ${field}.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new Error(`Campo ${field} excede ${max} caracteres.`);
  }
  return trimmed;
}

/** String opcional; vazio/null → undefined. */
export function optionalString(value: unknown, field: string, max: number): string | undefined {
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
