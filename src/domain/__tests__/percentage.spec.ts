import { describe, it, expect } from "vitest";
import { Percentage } from "../value-objects/percentage.js";

describe("Percentage", () => {
  it("creates with value in range", () => {
    const r = Percentage.create("50.00");
    expect(r.ok).toBe(true);
  });

  it("rejects value > 100", () => {
    expect(Percentage.create("100.01").ok).toBe(false);
  });

  it("rejects negative value", () => {
    expect(Percentage.create("-1").ok).toBe(false);
  });
});
