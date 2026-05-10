import { Decimal } from "decimal.js";
import { type Result, ok, err } from "../../application/shared/result.js";
import { InvariantViolation } from "../errors/domain.error.js";

const ISO4217 = /^[A-Z]{3}$/;

export class Money {
  private constructor(
    readonly amount: Decimal,
    readonly currency: string,
  ) {}

  static create(amount: Decimal.Value, currency = "BRL"): Result<Money, InvariantViolation> {
    let parsed: Decimal;
    try {
      parsed = new Decimal(amount);
    } catch {
      return err(new InvariantViolation("Money amount must be a finite number"));
    }
    if (!parsed.isFinite()) {
      return err(new InvariantViolation("Money amount must be a finite number"));
    }
    if (!ISO4217.test(currency)) {
      return err(new InvariantViolation(`Currency must be ISO-4217 (3 uppercase letters), got "${currency}"`));
    }
    return ok(new Money(parsed, currency));
  }

  static reconstruct(amount: Decimal.Value, currency: string): Money {
    return new Money(new Decimal(amount), currency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(`Cannot add Money with different currencies: ${this.currency} vs ${other.currency}`);
    }
    return new Money(this.amount.plus(other.amount), this.currency);
  }

  multiply(factor: Decimal.Value): Money {
    return new Money(this.amount.times(factor), this.currency);
  }

  greaterThan(other: Money): boolean {
    return this.amount.greaterThan(other.amount);
  }

  toString(): string {
    return this.amount.toFixed(2);
  }
}
