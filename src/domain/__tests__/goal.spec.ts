import { describe, it, expect } from "vitest";
import { Goal } from "../entities/goal.js";
import { Compensation } from "../value-objects/compensation.js";
import { Period } from "../value-objects/period.js";
import { Money } from "../value-objects/money.js";

const period = Period.reconstruct(new Date("2026-01-01"), new Date("2026-12-31"));

function makeGoal(overrides?: Partial<Parameters<typeof Goal.create>[0]>) {
  return Goal.create({
    id: "g1",
    campaignId: "c1",
    name: "Q1 Sales",
    period,
    compensation: Compensation.reconstruct("FIXED", "500.00", "BRL"),
    ...overrides,
  });
}

describe("Goal.create", () => {
  it("creates with valid props", () => {
    expect(makeGoal().ok).toBe(true);
  });

  it("rejects empty name", () => {
    expect(makeGoal({ name: "   " }).ok).toBe(false);
  });
});

describe("Goal.calculateCompensation", () => {
  it("FIXED: returns the fixed amount regardless of achieved value", () => {
    const result = makeGoal({
      compensation: Compensation.reconstruct("FIXED", "500.00", "BRL"),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const payout = result.value.calculateCompensation(Money.reconstruct("1200.00", "BRL"));
    expect(payout.amount.equals("500.00")).toBe(true);
    expect(payout.currency).toBe("BRL");
  });

  it("FIXED: payout is independent of achieved value", () => {
    const result = makeGoal({
      compensation: Compensation.reconstruct("FIXED", "200.00", "BRL"),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const goal = result.value;
    const p1 = goal.calculateCompensation(Money.reconstruct("100.00", "BRL"));
    const p2 = goal.calculateCompensation(Money.reconstruct("9999.00", "BRL"));
    expect(p1.amount.equals(p2.amount)).toBe(true);
  });

  it("PERCENTAGE: returns percentage of achieved value", () => {
    const result = makeGoal({
      compensation: Compensation.reconstruct("PERCENTAGE", "10", null),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const payout = result.value.calculateCompensation(Money.reconstruct("1000.00", "BRL"));
    expect(payout.amount.equals("100.00")).toBe(true);
    expect(payout.currency).toBe("BRL");
  });

  it("PERCENTAGE 100%: returns the full achieved amount", () => {
    const result = makeGoal({
      compensation: Compensation.reconstruct("PERCENTAGE", "100", null),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const payout = result.value.calculateCompensation(Money.reconstruct("750.00", "BRL"));
    expect(payout.amount.equals("750.00")).toBe(true);
  });

  it("PERCENTAGE 0%: returns zero payout", () => {
    const result = makeGoal({
      compensation: Compensation.reconstruct("PERCENTAGE", "0", null),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const payout = result.value.calculateCompensation(Money.reconstruct("1000.00", "BRL"));
    expect(payout.amount.equals("0")).toBe(true);
  });
});
