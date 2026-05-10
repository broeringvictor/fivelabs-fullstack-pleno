import type { ICampaignRepository } from "@/application/ports/repositories/i-campaign.repository.js";
import type { IClock } from "@/application/ports/clock/i-clock.js";
import { Campaign } from "@/domain/entities/campaign.js";
import { NotFound } from "@/domain/errors/domain.error.js";
import { ok, err, type Result } from "@/application/shared/result.js";
import type { DomainError } from "@/domain/errors/domain.error.js";
import type { UpdateCampaignResponse } from "./update-campaign.response.js";
import type { UpdateCampaignRequest } from "./update-campaign.request.js";

export class UpdateCampaignUseCase {
  constructor(
    private readonly campaigns: ICampaignRepository,
    private readonly clock: IClock,
  ) {}

  async execute(id: string, req: UpdateCampaignRequest): Promise<Result<UpdateCampaignResponse, DomainError>> {
    const existing = await this.campaigns.findById(id);
    if (!existing) return err(new NotFound("Campaign", id));

    const updated = Campaign.reconstruct({
      id: existing.id,
      name: req.name ?? existing.name,
      description: req.description ?? existing.description,
      createdById: existing.createdById,
      createdAt: existing.createdAt,
      updatedAt: this.clock.now(),
      deletedAt: existing.deletedAt,
    });

    await this.campaigns.save(updated);
    return ok({ id: updated.id, name: updated.name, description: updated.description, updatedAt: updated.updatedAt.toISOString() });
  }
}
