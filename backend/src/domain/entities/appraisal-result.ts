import { type Result, ok } from "../../application/shared/result.js";
import { InvariantViolation } from "../errors/domain.error.js";
import { BaseEntity } from "../shared/base.entity.js";
import { type Money } from "../value-objects/money.js";

export interface AppraisalResultProps {
  id: string;
  appraisalId: string;
  goalId: string;
  salespersonId: string;
  achievedValue: Money;
  goalMet: boolean;
  payableAmount: Money;
  evaluatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class AppraisalResult extends BaseEntity {
  readonly appraisalId: string;
  readonly goalId: string;
  readonly salespersonId: string;
  readonly achievedValue: Money;
  readonly goalMet: boolean;
  readonly payableAmount: Money;
  readonly evaluatedAt: Date;

  private constructor(props: AppraisalResultProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.appraisalId = props.appraisalId;
    this.goalId = props.goalId;
    this.salespersonId = props.salespersonId;
    this.achievedValue = props.achievedValue;
    this.goalMet = props.goalMet;
    this.payableAmount = props.payableAmount;
    this.evaluatedAt = props.evaluatedAt;
  }

  static create(props: Omit<AppraisalResultProps, "createdAt" | "updatedAt"> & { createdAt?: Date; updatedAt?: Date }): Result<AppraisalResult, InvariantViolation> {
    const now = new Date();
    return ok(new AppraisalResult({
      ...props,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    }));
  }

  static reconstruct(props: AppraisalResultProps): AppraisalResult {
    return new AppraisalResult(props);
  }
}
