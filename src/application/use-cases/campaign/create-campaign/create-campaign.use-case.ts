import type { ICampaignRepository } from "@/application/ports/repositories/i-campaign.repository.js";
import type { IClock } from "@/application/ports/clock/i-clock.js";
import type { IIDGenerator } from "@/application/ports/crypto/i-id-generator.js";
import { Campaign } from "@/domain/entities/campaign.js";
import { ok, err, type Result } from "@/application/shared/result.js";
import type { DomainError } from "@/domain/errors/domain.error.js";
import type { CreateCampaignResponse } from "./create-campaign.response.js";

type Req = { name: string; description: string; createdById: string };

export class CreateCampaignUseCase {
  constructor(
    private readonly campaigns: ICampaignRepository,
    private readonly clock: IClock,
    private readonly idGenerator: IIDGenerator,
  ) {}

  async execute(req: Req): Promise<Result<CreateCampaignResponse, DomainError>> {
    const result = Campaign.create({
      id: this.idGenerator.generate(),
      name: req.name,
      description: req.description,
      createdById: req.createdById,
      createdAt: this.clock.now(),
      updatedAt: this.clock.now(),
    });
    if (!result.ok) return err(result.error);
    await this.campaigns.save(result.value);
    const c = result.value;
    return ok({ id: c.id, name: c.name, description: c.description, createdById: c.createdById, createdAt: c.createdAt.toISOString() });
  }
}
