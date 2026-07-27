import { describe, expect, it } from "vitest";
import { mapPriorityToDificuldade, mapTaskToItem } from "./mapper.js";

describe("mapPriorityToDificuldade", () => {
  it("mapeia prioridades conhecidas", () => {
    expect(mapPriorityToDificuldade(0.1)).toBe("trivial");
    expect(mapPriorityToDificuldade(1)).toBe("easy");
    expect(mapPriorityToDificuldade(1.5)).toBe("medium");
    expect(mapPriorityToDificuldade(2)).toBe("hard");
  });

  it("usa easy como fallback", () => {
    expect(mapPriorityToDificuldade(undefined)).toBe("easy");
    expect(mapPriorityToDificuldade(9)).toBe("easy");
  });
});

describe("mapTaskToItem", () => {
  it("mapeia task completa para item de execução", () => {
    const item = mapTaskToItem({
      id: "abc",
      type: "todo",
      text: "Estudar",
      notes: "cap. 3",
      priority: 1.5,
      completed: false,
    });
    expect(item).toEqual({
      id: "abc",
      tipo: "todo",
      titulo: "Estudar",
      notas: "cap. 3",
      dificuldade: "medium",
      ativo: true,
    });
  });

  it("marca concluído como inativo", () => {
    const item = mapTaskToItem({
      id: "x",
      type: "todo",
      text: "Feito",
      completed: true,
    });
    expect(item.ativo).toBe(false);
  });

  it("aceita _id quando id ausente", () => {
    const item = mapTaskToItem({ _id: "legacy", type: "habit", text: "Água" });
    expect(item.id).toBe("legacy");
  });

  it("falha sem id", () => {
    expect(() => mapTaskToItem({ type: "todo", text: "x" })).toThrow(/sem id/);
  });

  it("falha com tipo inválido", () => {
    expect(() => mapTaskToItem({ id: "1", type: "challenge", text: "x" })).toThrow(/não suportado/);
  });
});
