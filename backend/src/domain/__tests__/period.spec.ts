import { describe, it, expect } from "vitest";
import { Period } from "../value-objects/period.js";

describe("Period", () => {
  it("creates with valid start and end", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-12-31");
    const result = Period.create(start, end);
    expect(result.ok).toBe(true);
  });

  it("allows equal start and end (single day)", () => {
    const d = new Date("2025-06-01");
    expect(Period.create(d, d).ok).toBe(true);
  });

  it("rejects end before start", () => {
    const result = Period.create(new Date("2025-12-31"), new Date("2025-01-01"));
    expect(result.ok).toBe(false);
  });
});
