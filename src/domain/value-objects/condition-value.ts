import { type Result, ok, err } from "../../application/shared/result.js";
import { InvariantViolation } from "../errors/domain.error.js";
import { type ConditionOperator, scalarOperators, collectionOperators } from "../enums/condition-operator.js";

export type ConditionValuePrimitive = string | number | boolean;
export type ConditionValueRaw = ConditionValuePrimitive | ConditionValuePrimitive[];

export class ConditionValue {
  private constructor(readonly value: ConditionValueRaw) {}

  static create(
    operator: ConditionOperator,
    value: unknown,
  ): Result<ConditionValue, InvariantViolation> {
    if (collectionOperators.has(operator)) {
      if (!Array.isArray(value) || value.length === 0) {
        return err(new InvariantViolation(`Operator ${operator} requires a non-empty array value`));
      }
      return ok(new ConditionValue(value as ConditionValuePrimitive[]));
    }
    if (scalarOperators.has(operator)) {
      if (Array.isArray(value)) {
        return err(new InvariantViolation(`Operator ${operator} requires a scalar value, not an array`));
      }
      if (value === null || value === undefined) {
        return err(new InvariantViolation(`Operator ${operator} requires a non-null scalar value`));
      }
      return ok(new ConditionValue(value as ConditionValuePrimitive));
    }
    return err(new InvariantViolation(`Unknown operator: ${String(operator)}`));
  }

  static reconstruct(value: ConditionValueRaw): ConditionValue {
    return new ConditionValue(value);
  }
}
