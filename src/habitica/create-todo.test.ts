import { describe, expect, it } from "vitest";
import { buildTodoPreview } from "./todo.js";

describe("habitica_create_todo confirm gate", () => {
  it("preview é reutilizável antes da confirmação", () => {
    const preview = buildTodoPreview({ titulo: "Teste create" });
    expect(preview.payload.type).toBe("todo");
    expect(preview.mode).toBe("preview");
  });
});
