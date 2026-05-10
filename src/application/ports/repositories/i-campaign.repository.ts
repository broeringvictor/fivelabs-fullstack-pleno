import type { Campaign } from "@/domain/entities/campaign.js";

export interface ICampaignRepository {
  save(campaign: Campaign): Promise<void>;
  findById(id: string): Promise<Campaign | null>;
  findAll(): Promise<Campaign[]>;
}
