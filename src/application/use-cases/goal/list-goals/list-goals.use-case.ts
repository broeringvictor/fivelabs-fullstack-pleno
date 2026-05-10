import type { IGoalRepository } from "@/application/ports/repositories/i-goal.repository.js";
import { ok, type Result } from "@/application/shared/result.js";
import type { DomainError } from "@/domain/errors/domain.error.js";
import type { ListGoalsResponse } from "./list-goals.response.js";

export class ListGoalsUseCase {
  constructor(private readonly goals: IGoalRepository) {}

  async execute(campaignId: string): Promise<Result<ListGoalsResponse, DomainError>> {
    const items = await this.goals.findByCampaignId(campaignId);
    return ok(items.map(({ goal: g }) => ({
      id: g.id,
      campaignId: g.campaignId,
      name: g.name,
      validFrom: g.period.start.toISOString(),
      validTo: g.period.end.toISOString(),
      compensationType: g.compensation.type,
      compensationValue: g.compensation.value.toString(),
      compensationCurrency: g.compensation.currency,
    })));
  }
}
