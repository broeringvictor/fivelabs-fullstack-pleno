import { describe, it, expect } from "vitest";
import { Compensation } from "../value-objects/compensation.js";

describe("Compensation", () => {
  it("creates FIXED with currency", () => {
    const r = Compensation.create("FIXED", "500.00", "BRL");
    expect(r.ok).toBe(true);
  });

  it("rejects FIXED without currency", () => {
    expect(Compensation.create("FIXED", "500.00").ok).toBe(false);
  });

  it("creates PERCENTAGE without currency", () => {
    expect(Compensation.create("PERCENTAGE", "10.00").ok).toBe(true);
  });

  it("rejects PERCENTAGE > 100", () => {
    expect(Compensation.create("PERCENTAGE", "101").ok).toBe(false);
  });

  it("rejects negative value", () => {
    expect(Compensation.create("FIXED", "-1", "BRL").ok).toBe(false);
  });
});
