/** Tipos internos do MCP (linguagem de domínio). */

export type ItemTipo = "habit" | "daily" | "todo" | "reward";

export type Dificuldade = "trivial" | "easy" | "medium" | "hard";

/** Item de execução — unidade manipulada pelo MCP. */
export interface ItemExecucao {
  id: string;
  tipo: ItemTipo;
  titulo: string;
  notas: string;
  dificuldade: Dificuldade;
  ativo: boolean;
}

/** Task do Habitica — objeto externo da API (campos usados no mapeamento). */
export interface HabiticaTask {
  id?: string;
  _id?: string;
  type?: string;
  text?: string;
  notes?: string;
  priority?: number;
  completed?: boolean;
  attribute?: string;
}
