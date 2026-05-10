import { type Result, ok, err } from "../../application/shared/result.js";
import { InvariantViolation } from "../errors/domain.error.js";
import { SoftDeletableEntity } from "../shared/base.entity.js";
import { type LogicalOperator } from "../enums/logical-operator.js";

export interface ConditionGroupProps {
  id: string;
  goalId: string;
  parentGroupId: string | null;
  logicalOperator: LogicalOperator;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class ConditionGroup extends SoftDeletableEntity {
  readonly goalId: string;
  readonly parentGroupId: string | null;
  readonly logicalOperator: LogicalOperator;

  private constructor(props: ConditionGroupProps) {
    super(props.id, props.createdAt, props.updatedAt, props.deletedAt);
    this.goalId = props.goalId;
    this.parentGroupId = props.parentGroupId;
    this.logicalOperator = props.logicalOperator;
  }

  static create(props: Omit<ConditionGroupProps, "createdAt" | "updatedAt" | "deletedAt"> & { createdAt?: Date; updatedAt?: Date }): Result<ConditionGroup, InvariantViolation> {
    const now = new Date();
    return ok(new ConditionGroup({
      ...props,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
      deletedAt: null,
    }));
  }

  static reconstruct(props: ConditionGroupProps): ConditionGroup {
    return new ConditionGroup(props);
  }

  get isRoot(): boolean {
    return this.parentGroupId === null;
  }
}
