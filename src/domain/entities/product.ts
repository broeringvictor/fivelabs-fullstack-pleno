import { type Result, ok, err } from "../../application/shared/result.js";
import { InvariantViolation } from "../errors/domain.error.js";
import { BaseEntity } from "../shared/base.entity.js";

export interface ProductProps {
  id: string;
  name: string;
  sku: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Product extends BaseEntity {
  readonly name: string;
  readonly sku: string;

  private constructor(props: ProductProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.sku = props.sku;
  }

  static create(props: Omit<ProductProps, "createdAt" | "updatedAt"> & { createdAt?: Date; updatedAt?: Date }): Result<Product, InvariantViolation> {
    if (!props.name.trim()) {
      return err(new InvariantViolation("Product name cannot be empty"));
    }
    if (!props.sku.trim()) {
      return err(new InvariantViolation("Product SKU cannot be empty"));
    }
    const now = new Date();
    return ok(new Product({
      ...props,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    }));
  }

  static reconstruct(props: ProductProps): Product {
    return new Product(props);
  }
}
