import { type Result, ok, err } from "../../application/shared/result.js";
import { InvariantViolation } from "../errors/domain.error.js";
import { SoftDeletableEntity } from "../shared/base.entity.js";
import { type Compensation } from "../value-objects/compensation.js";
import { type Period } from "../value-objects/period.js";
import { Money } from "../value-objects/money.js";
import { CompensationType } from "../enums/compensation-type.js";

export interface GoalProps {
  id: string;
  campaignId: string;
  name: string;
  period: Period;
  compensation: Compensation;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Goal extends SoftDeletableEntity {
  readonly campaignId: string;
  readonly name: string;
  readonly period: Period;
  readonly compensation: Compensation;

  private constructor(props: GoalProps) {
    super(props.id, props.createdAt, props.updatedAt, props.deletedAt);
    this.campaignId = props.campaignId;
    this.name = props.name;
    this.period = props.period;
    this.compensation = props.compensation;
  }

  static create(props: Omit<GoalProps, "createdAt" | "updatedAt" | "deletedAt"> & { createdAt?: Date; updatedAt?: Date }): Result<Goal, InvariantViolation> {
    if (!props.name.trim()) {
      return err(new InvariantViolation("Goal name cannot be empty"));
    }
    const now = new Date();
    return ok(new Goal({
      ...props,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
      deletedAt: null,
    }));
  }

  static reconstruct(props: GoalProps): Goal {
    return new Goal(props);
  }

  calculateCompensation(achieved: Money): Money {
    const { type, value } = this.compensation;
    if (type === CompensationType.FIXED) {
      return Money.reconstruct(value, this.compensation.currency!);
    }
    return achieved.multiply(value.dividedBy(100));
  }
}
