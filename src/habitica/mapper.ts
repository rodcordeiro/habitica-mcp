import type { Dificuldade, HabiticaTask, ItemExecucao, ItemTipo } from "../types.js";

const PRIORITY_TO_DIFICULDADE: Record<number, Dificuldade> = {
  0.1: "trivial",
  1: "easy",
  1.5: "medium",
  2: "hard",
};

const TIPOS: ReadonlySet<string> = new Set(["habit", "daily", "todo", "reward"]);

/**
 * Converte prioridade numérica da API Habitica para dificuldade do domínio.
 */
export function mapPriorityToDificuldade(priority: unknown): Dificuldade {
  if (typeof priority === "number" && priority in PRIORITY_TO_DIFICULDADE) {
    return PRIORITY_TO_DIFICULDADE[priority];
  }
  return "easy";
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
  // Recompensas e hábitos ativos: não usam completed da mesma forma; tratado como ativo se não completed.
  const ativo = !completed;

  return {
    id,
    tipo: rawType as ItemTipo,
    titulo: typeof task.text === "string" ? task.text : "",
    notas: typeof task.notes === "string" ? task.notes : "",
    dificuldade: mapPriorityToDificuldade(task.priority),
    ativo,
  };
}

export function mapTasksToItems(tasks: HabiticaTask[]): ItemExecucao[] {
  return tasks.map(mapTaskToItem);
}
