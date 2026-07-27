import { describe, expect, it } from "vitest";
import { HabiticaApiError } from "./client.js";

describe("HabiticaApiError", () => {
  it("carrega status e código", () => {
    const err = new HabiticaApiError("auth fail", 401, "auth");
    expect(err.message).toBe("auth fail");
    expect(err.status).toBe(401);
    expect(err.code).toBe("auth");
    expect(err.name).toBe("HabiticaApiError");
  });
});
