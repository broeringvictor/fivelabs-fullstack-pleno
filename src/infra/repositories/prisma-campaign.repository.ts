import type { PrismaClient } from "../../../generated/prisma/client.js";
import type { ICampaignRepository } from "@/application/ports/repositories/i-campaign.repository.js";
import type { Campaign } from "@/domain/entities/campaign.js";
import { campaignMapper } from "../mappers/campaign.mapper.js";

export class PrismaCampaignRepository implements ICampaignRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(campaign: Campaign): Promise<void> {
    const data = campaignMapper.toPersistence(campaign);
    await this.prisma.campaign.upsert({
      where: { id: campaign.id },
      create: data,
      update: {
        name: campaign.name,
        description: campaign.description,
        updatedAt: campaign.updatedAt,
        deletedAt: campaign.deletedAt,
      },
    });
  }

  async findById(id: string): Promise<Campaign | null> {
    const row = await this.prisma.campaign.findUnique({ where: { id } });
    return row ? campaignMapper.toDomain(row) : null;
  }

  async findAll(): Promise<Campaign[]> {
    const rows = await this.prisma.campaign.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } });
    return rows.map(campaignMapper.toDomain);
  }
}
