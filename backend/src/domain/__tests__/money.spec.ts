import { Decimal } from "decimal.js";
import { describe, it, expect } from "vitest";
import { Money } from "../value-objects/money.js";

describe("Money", () => {
  it("creates with valid amount and default currency", () => {
    const result = Money.create("100.00");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.amount.equals("100.00")).toBe(true);
      expect(result.value.currency).toBe("BRL");
    }
  });

  it("rejects invalid currency", () => {
    expect(Money.create("100", "BR").ok).toBe(false);
  });

  it("rejects non-numeric amount", () => {
    expect(Money.create("abc").ok).toBe(false);
  });

  it("allows negative amounts (refund/estorno)", () => {
    expect(Money.create("-50.00").ok).toBe(true);
  });

  it("add is precise — no floating point drift", () => {
    const a = Money.reconstruct("0.1", "BRL");
    const b = Money.reconstruct("0.2", "BRL");
    expect(a.add(b).amount.equals(new Decimal("0.3"))).toBe(true);
  });

  it("multiply scales amount precisely", () => {
    const m = Money.reconstruct("1000.00", "BRL");
    expect(m.multiply("0.1").amount.equals(new Decimal("100.00"))).toBe(true);
  });
});
