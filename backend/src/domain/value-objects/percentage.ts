import { Decimal } from "decimal.js";
import { type Result, ok, err } from "../../application/shared/result.js";
import { InvariantViolation } from "../errors/domain.error.js";

export class Percentage {
  private constructor(readonly value: Decimal) {}

  static create(value: Decimal.Value): Result<Percentage, InvariantViolation> {
    let parsed: Decimal;
    try {
      parsed = new Decimal(value);
    } catch {
      return err(new InvariantViolation("Percentage must be a finite number"));
    }
    if (!parsed.isFinite()) {
      return err(new InvariantViolation("Percentage must be a finite number"));
    }
    if (parsed.lessThan(0) || parsed.greaterThan(100)) {
      return err(new InvariantViolation(`Percentage must be between 0 and 100, got ${parsed.toString()}`));
    }
    return ok(new Percentage(parsed));
  }

  static reconstruct(value: Decimal.Value): Percentage {
    return new Percentage(new Decimal(value));
  }

  toString(): string {
    return this.value.toFixed(2);
  }
}
