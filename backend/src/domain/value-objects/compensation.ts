import { Decimal } from "decimal.js";
import { type Result, ok, err } from "../../application/shared/result.js";
import { InvariantViolation } from "../errors/domain.error.js";
import { type CompensationType, CompensationType as CT } from "../enums/compensation-type.js";

const ISO4217 = /^[A-Z]{3}$/;

export class Compensation {
  private constructor(
    readonly type: CompensationType,
    readonly value: Decimal,
    readonly currency: string | null,
  ) {}

  static create(
    type: CompensationType,
    value: Decimal.Value,
    currency?: string,
  ): Result<Compensation, InvariantViolation> {
    let parsed: Decimal;
    try {
      parsed = new Decimal(value);
    } catch {
      return err(new InvariantViolation("Compensation value must be a finite number"));
    }
    if (!parsed.isFinite()) {
      return err(new InvariantViolation("Compensation value must be a finite number"));
    }
    if (parsed.lessThan(0)) {
      return err(new InvariantViolation("Compensation value must be >= 0"));
    }
    if (type === CT.PERCENTAGE && parsed.greaterThan(100)) {
      return err(new InvariantViolation("PERCENTAGE compensation value must be <= 100"));
    }
    if (type === CT.FIXED) {
      if (!currency) {
        return err(new InvariantViolation("FIXED compensation requires a currency"));
      }
      if (!ISO4217.test(currency)) {
        return err(new InvariantViolation(`Currency must be ISO-4217, got "${currency}"`));
      }
    }
    return ok(new Compensation(type, parsed, currency ?? null));
  }

  static reconstruct(type: CompensationType, value: Decimal.Value, currency: string | null): Compensation {
    return new Compensation(type, new Decimal(value), currency);
  }
}
