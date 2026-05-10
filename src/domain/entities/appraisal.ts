import { type Result, ok } from "../../application/shared/result.js";
import { InvariantViolation } from "../errors/domain.error.js";
import { BaseEntity } from "../shared/base.entity.js";
import { type AppraisalStatus } from "../enums/appraisal-status.js";

export interface AppraisalProps {
  id: string;
  triggeredById: string | null;
  status: AppraisalStatus;
  attempts: number;
  nextAttemptAt: Date;
  lastError: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Appraisal extends BaseEntity {
  readonly triggeredById: string | null;
  status: AppraisalStatus;
  attempts: number;
  nextAttemptAt: Date;
  lastError: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;

  private constructor(props: AppraisalProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.triggeredById = props.triggeredById;
    this.status = props.status;
    this.attempts = props.attempts;
    this.nextAttemptAt = props.nextAttemptAt;
    this.lastError = props.lastError;
    this.startedAt = props.startedAt;
    this.finishedAt = props.finishedAt;
  }

  static create(props: Omit<AppraisalProps, "status" | "attempts" | "nextAttemptAt" | "lastError" | "startedAt" | "finishedAt" | "createdAt" | "updatedAt"> & { createdAt?: Date; updatedAt?: Date }): Result<Appraisal, InvariantViolation> {
    const now = new Date();
    return ok(new Appraisal({
      ...props,
      status: "PENDING",
      attempts: 0,
      nextAttemptAt: now,
      lastError: null,
      startedAt: null,
      finishedAt: null,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    }));
  }

  static reconstruct(props: AppraisalProps): Appraisal {
    return new Appraisal(props);
  }
}
