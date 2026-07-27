import type { HabiticaTask, ItemExecucao, ItemTipo } from "../types.js";
import { priorityToDificuldade } from "./difficulty.js";

const TIPOS: ReadonlySet<string> = new Set(["habit", "daily", "todo", "reward"]);

/** @deprecated use priorityToDificuldade — mantido para testes existentes */
export function mapPriorityToDificuldade(priority: unknown) {
  return priorityToDificuldade(priority);
}

/**
 * Mapeia Task do Habitica → Item de execução.
 */
export function mapTaskToItem(task: HabiticaTask): ItemExecucao {
  const id = task.id ?? task._id;
  if (!id) {
    throw new Error("Task do Habitica sem id.");
  }

  const rawType = task.type ?? "";
  if (!TIPOS.has(rawType)) {
    throw new Error(`Tipo de task Habitica não suportado: ${rawType || "(vazio)"}`);
  }

  const completed = task.completed === true;
  const ativo = !completed;

  return {
    id,
    tipo: rawType as ItemTipo,
    titulo: typeof task.text === "string" ? task.text : "",
    notas: typeof task.notes === "string" ? task.notes : "",
    dificuldade: priorityToDificuldade(task.priority),
    ativo,
  };
}

export function mapTasksToItems(tasks: HabiticaTask[]): ItemExecucao[] {
  return tasks.map(mapTaskToItem);
}
