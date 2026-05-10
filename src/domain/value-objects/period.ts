import { type Result, ok, err } from "../../application/shared/result.js";
import { InvariantViolation } from "../errors/domain.error.js";

export class Period {
  private constructor(
    readonly start: Date,
    readonly end: Date,
  ) {}

  static create(start: Date, end: Date): Result<Period, InvariantViolation> {
    if (end < start) {
      return err(new InvariantViolation("Period end must be >= start"));
    }
    return ok(new Period(start, end));
  }

  static reconstruct(start: Date, end: Date): Period {
    return new Period(start, end);
  }

  contains(date: Date): boolean {
    return date >= this.start && date <= this.end;
  }
}
