import type { IAppraisalRepository } from "@/application/ports/repositories/i-appraisal.repository.js";
import type { IClock } from "@/application/ports/clock/i-clock.js";
import type { IIDGenerator } from "@/application/ports/crypto/i-id-generator.js";
import { Appraisal } from "@/domain/entities/appraisal.js";
import type { TriggerAppraisalResponse } from "./trigger-appraisal.response.js";

export class TriggerAppraisalUseCase {
  constructor(
    private readonly appraisals: IAppraisalRepository,
    private readonly clock: IClock,
    private readonly idGenerator: IIDGenerator,
  ) {}

  async execute(triggeredById: string | null): Promise<TriggerAppraisalResponse> {
    const now = this.clock.now();

    const appraisalResult = Appraisal.create({
      id: this.idGenerator.generate(),
      triggeredById,
      createdAt: now,
      updatedAt: now,
    });

    if (!appraisalResult.ok) throw new Error(appraisalResult.error.message);
    const appraisal = appraisalResult.value;
    await this.appraisals.save(appraisal);

    return {
      id: appraisal.id,
      status: appraisal.status,
      createdAt: appraisal.createdAt.toISOString(),
    };
  }
}
