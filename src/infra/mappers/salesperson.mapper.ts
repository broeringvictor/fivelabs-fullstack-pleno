import type { SalespersonModel } from "../../../generated/prisma/models/Salesperson.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { Salesperson } from "@/domain/entities/salesperson.js";

export type { SalespersonModel };

export const salespersonMapper = {
  toDomain(row: SalespersonModel): Salesperson {
    return Salesperson.reconstruct({
      id: row.id,
      name: row.name,
      document: row.document,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toPersistence(entity: Salesperson): Prisma.SalespersonCreateInput {
    return {
      id: entity.id,
      name: entity.name,
      document: entity.document,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  },
};
