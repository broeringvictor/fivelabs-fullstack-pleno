import { type Result, ok, err } from "../../application/shared/result.js";
import { InvariantViolation } from "../errors/domain.error.js";
import { BaseEntity } from "../shared/base.entity.js";

export interface RegionProps {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Region extends BaseEntity {
  readonly name: string;

  private constructor(props: RegionProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
  }

  static create(props: Omit<RegionProps, "createdAt" | "updatedAt"> & { createdAt?: Date; updatedAt?: Date }): Result<Region, InvariantViolation> {
    if (!props.name.trim()) {
      return err(new InvariantViolation("Region name cannot be empty"));
    }
    const now = new Date();
    return ok(new Region({
      ...props,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    }));
  }

  static reconstruct(props: RegionProps): Region {
    return new Region(props);
  }
}
