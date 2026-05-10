import type { UserModel } from "../../../generated/prisma/models/User.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { User } from "@/domain/entities/user.js";
import { type Role } from "@/domain/enums/role.js";

export type { UserModel };

export const userMapper = {
  toDomain(row: UserModel): User {
    return User.reconstruct({
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role as Role,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  },

  toPersistence(entity: User): Prisma.UserCreateInput {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      passwordHash: entity.passwordHash,
      role: entity.role,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  },
};
