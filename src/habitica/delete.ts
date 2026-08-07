import type { ItemExecucao, ItemTipo } from "../types.js";
import { requireNonEmptyString } from "./todo.js";

export type DeleteTipo = "habit" | "daily" | "todo";

const ALLOWED: ReadonlySet<string> = new Set(["habit", "daily", "todo"]);

export interface DeletePreviewResult {
  mode: "preview";
  id: string;
  tipo: DeleteTipo;
  item: {
    id: string;
    tipo: ItemTipo;
    titulo: string;
    ativo: boolean;
  };
  risk: string;
  message: string;
}

/**
 * Valida que o tipo esperado é removível e coincide com o item buscado.
 */
export function buildDeletePreview(
  idInput: string,
  tipoEsperado: string,
  item: ItemExecucao,
): DeletePreviewResult {
  const id = requireNonEmptyString(idInput, "id", 100);
  const tipo = parseDeleteTipo(tipoEsperado);

  if (item.id !== id) {
    throw new Error(`ID inconsistente: esperado ${id}, item retornou ${item.id}.`);
  }
  if (item.tipo !== tipo) {
    throw new Error(
      `Tipo informado (${tipo}) não coincide com o item (${item.tipo}). Remoção abortada.`,
    );
  }

  return {
    mode: "preview",
    id,
    tipo,
    item: {
      id: item.id,
      tipo: item.tipo,
      titulo: item.titulo,
      ativo: item.ativo,
    },
    risk: "Remoção irreversível na API Habitica (DELETE /tasks/:id). Não use remoção no lugar de concluir/pontuar.",
    message: "Nenhuma remoção executada. Passe confirm=true para excluir permanentemente.",
  };
}

export function parseDeleteTipo(value: unknown): DeleteTipo {
  if (typeof value !== "string" || !ALLOWED.has(value)) {
    throw new Error(
      `Tipo inválido para remoção: ${String(value)}. Permitidos: habit|daily|todo (reward fora de escopo).`,
    );
  }
  return value as DeleteTipo;
}
