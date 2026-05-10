import { type Result, ok, err } from "../../application/shared/result.js";
import { InvariantViolation } from "../errors/domain.error.js";
import { SoftDeletableEntity } from "../shared/base.entity.js";

export interface CampaignProps {
  id: string;
  name: string;
  description: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Campaign extends SoftDeletableEntity {
  readonly name: string;
  readonly description: string;
  readonly createdById: string;

  private constructor(props: CampaignProps) {
    super(props.id, props.createdAt, props.updatedAt, props.deletedAt);
    this.name = props.name;
    this.description = props.description;
    this.createdById = props.createdById;
  }

  static create(props: Omit<CampaignProps, "createdAt" | "updatedAt" | "deletedAt"> & { createdAt?: Date; updatedAt?: Date }): Result<Campaign, InvariantViolation> {
    if (!props.name.trim()) {
      return err(new InvariantViolation("Campaign name cannot be empty"));
    }
    const now = new Date();
    return ok(new Campaign({
      ...props,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
      deletedAt: null,
    }));
  }

  static reconstruct(props: CampaignProps): Campaign {
    return new Campaign(props);
  }
}
