import type { ICampaignRepository } from "@/application/ports/repositories/i-campaign.repository.js";
import type { ListCampaignsResponse } from "./list-campaigns.response.js";

export class ListCampaignsUseCase {
  constructor(private readonly campaigns: ICampaignRepository) {}

  async execute(): Promise<ListCampaignsResponse> {
    const all = await this.campaigns.findAll();
    return all.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      createdById: c.createdById,
      createdAt: c.createdAt.toISOString(),
    }));
  }
}
