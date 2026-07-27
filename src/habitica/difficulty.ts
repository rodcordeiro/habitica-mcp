import type { Dificuldade } from "../types.js";

const DIFICULDADE_TO_PRIORITY: Record<Dificuldade, number> = {
  trivial: 0.1,
  easy: 1,
  medium: 1.5,
  hard: 2,
};

const PRIORITY_TO_DIFICULDADE: Record<number, Dificuldade> = {
  0.1: "trivial",
  1: "easy",
  1.5: "medium",
  2: "hard",
};

export function dificuldadeToPriority(dificuldade: Dificuldade): number {
  return DIFICULDADE_TO_PRIORITY[dificuldade];
}

export function priorityToDificuldade(priority: unknown): Dificuldade {
  if (typeof priority === "number" && priority in PRIORITY_TO_DIFICULDADE) {
    return PRIORITY_TO_DIFICULDADE[priority];
  }
  return "easy";
}

export function parseDificuldade(value: unknown): Dificuldade {
  if (value === "trivial" || value === "easy" || value === "medium" || value === "hard") {
    return value;
  }
  throw new Error(`Dificuldade inválida: ${String(value)}. Use trivial|easy|medium|hard.`);
}
