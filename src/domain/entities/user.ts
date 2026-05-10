import { type Result, ok, err } from "../../application/shared/result.js";
import { InvariantViolation } from "../errors/domain.error.js";
import { SoftDeletableEntity } from "../shared/base.entity.js";
import { type Role } from "../enums/role.js";

export interface UserProps {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class User extends SoftDeletableEntity {
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: Role;

  private constructor(props: UserProps) {
    super(props.id, props.createdAt, props.updatedAt, props.deletedAt);
    this.name = props.name;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
  }

  static create(props: Omit<UserProps, "createdAt" | "updatedAt" | "deletedAt"> & { createdAt?: Date; updatedAt?: Date }): Result<User, InvariantViolation> {
    if (!props.name.trim()) {
      return err(new InvariantViolation("User name cannot be empty"));
    }
    if (!props.email.includes("@")) {
      return err(new InvariantViolation("User email is invalid"));
    }
    const now = new Date();
    return ok(new User({
      ...props,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
      deletedAt: null,
    }));
  }

  static reconstruct(props: UserProps): User {
    return new User(props);
  }
}
