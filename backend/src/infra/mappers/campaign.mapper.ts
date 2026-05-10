import type { CampaignModel } from "../../../generated/prisma/models/Campaign.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { Campaign } from "@/domain/entities/campaign.js";

export type { CampaignModel };

export const campaignMapper = {
  toDomain(row: CampaignModel): Campaign {
    return Campaign.reconstruct({
      id: row.id,
      name: row.name,
      description: row.description,
      createdById: row.createdById,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  },

  toPersistence(entity: Campaign): Prisma.CampaignCreateInput {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdBy: { connect: { id: entity.createdById } },
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  },
};
