import type { RegionModel } from "../../../generated/prisma/models/Region.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { Region } from "@/domain/entities/region.js";

export type { RegionModel };

export const regionMapper = {
  toDomain(row: RegionModel): Region {
    return Region.reconstruct({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toPersistence(entity: Region): Prisma.RegionCreateInput {
    return {
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  },
};
