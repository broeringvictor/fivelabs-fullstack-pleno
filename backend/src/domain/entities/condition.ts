import { type Result, ok, err } from "../../application/shared/result.js";
import { InvariantViolation } from "../errors/domain.error.js";
import { SoftDeletableEntity } from "../shared/base.entity.js";
import { type ConditionField } from "../enums/condition-field.js";
import { type ConditionOperator } from "../enums/condition-operator.js";
import { ConditionValue } from "../value-objects/condition-value.js";

export interface ConditionProps {
  id: string;
  groupId: string;
  field: ConditionField;
  operator: ConditionOperator;
  value: ConditionValue;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Condition extends SoftDeletableEntity {
  readonly groupId: string;
  readonly field: ConditionField;
  readonly operator: ConditionOperator;
  readonly value: ConditionValue;

  private constructor(props: ConditionProps) {
    super(props.id, props.createdAt, props.updatedAt, props.deletedAt);
    this.groupId = props.groupId;
    this.field = props.field;
    this.operator = props.operator;
    this.value = props.value;
  }

  static create(
    props: Omit<ConditionProps, "value" | "createdAt" | "updatedAt" | "deletedAt"> & {
      rawValue: unknown;
      createdAt?: Date;
      updatedAt?: Date;
    },
  ): Result<Condition, InvariantViolation> {
    const valueResult = ConditionValue.create(props.operator, props.rawValue);
    if (!valueResult.ok) return err(valueResult.error);

    const now = new Date();
    return ok(new Condition({
      id: props.id,
      groupId: props.groupId,
      field: props.field,
      operator: props.operator,
      value: valueResult.value,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
      deletedAt: null,
    }));
  }

  static reconstruct(props: ConditionProps): Condition {
    return new Condition(props);
  }
}
