import { type Result, ok, err } from "../../application/shared/result.js";
import { InvariantViolation } from "../errors/domain.error.js";
import { BaseEntity } from "../shared/base.entity.js";

export interface SalespersonProps {
  id: string;
  name: string;
  document: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Salesperson extends BaseEntity {
  readonly name: string;
  readonly document: string;

  private constructor(props: SalespersonProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.document = props.document;
  }

  static create(props: Omit<SalespersonProps, "createdAt" | "updatedAt"> & { createdAt?: Date; updatedAt?: Date }): Result<Salesperson, InvariantViolation> {
    if (!props.name.trim()) {
      return err(new InvariantViolation("Salesperson name cannot be empty"));
    }
    if (!props.document.trim()) {
      return err(new InvariantViolation("Salesperson document cannot be empty"));
    }
    const now = new Date();
    return ok(new Salesperson({
      ...props,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    }));
  }

  static reconstruct(props: SalespersonProps): Salesperson {
    return new Salesperson(props);
  }
}
