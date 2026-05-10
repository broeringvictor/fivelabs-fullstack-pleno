import { type Result, ok, err } from "../../application/shared/result.js";
import { InvariantViolation } from "../errors/domain.error.js";
import { BaseEntity } from "../shared/base.entity.js";
import { type Money } from "../value-objects/money.js";

export interface SaleProps {
  id: string;
  salespersonId: string;
  productId: string;
  regionId: string;
  amount: Money;
  soldAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Sale extends BaseEntity {
  readonly salespersonId: string;
  readonly productId: string;
  readonly regionId: string;
  readonly amount: Money;
  readonly soldAt: Date;

  private constructor(props: SaleProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.salespersonId = props.salespersonId;
    this.productId = props.productId;
    this.regionId = props.regionId;
    this.amount = props.amount;
    this.soldAt = props.soldAt;
  }

  static create(props: Omit<SaleProps, "createdAt" | "updatedAt"> & { createdAt?: Date; updatedAt?: Date }): Result<Sale, InvariantViolation> {
    const now = new Date();
    return ok(new Sale({
      ...props,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    }));
  }

  static reconstruct(props: SaleProps): Sale {
    return new Sale(props);
  }
}
