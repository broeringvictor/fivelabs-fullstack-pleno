import type { ICampaignRepository } from "@/application/ports/repositories/i-campaign.repository.js";
import type { Campaign } from "@/domain/entities/campaign.js";

export class InMemoryCampaignRepository implements ICampaignRepository {
  private store = new Map<string, Campaign>();

  async save(campaign: Campaign): Promise<void> {
    this.store.set(campaign.id, campaign);
  }

  async findById(id: string): Promise<Campaign | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<Campaign[]> {
    return [...this.store.values()];
  }

  get size(): number {
    return this.store.size;
  }
}
