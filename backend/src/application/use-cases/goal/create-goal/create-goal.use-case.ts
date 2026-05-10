import type { IGoalRepository } from "@/application/ports/repositories/i-goal.repository.js";
import type { ICampaignRepository } from "@/application/ports/repositories/i-campaign.repository.js";
import type { IClock } from "@/application/ports/clock/i-clock.js";
import type { IIDGenerator } from "@/application/ports/crypto/i-id-generator.js";
import { Goal } from "@/domain/entities/goal.js";
import { ConditionGroup } from "@/domain/entities/condition-group.js";
import { Condition } from "@/domain/entities/condition.js";
import { Compensation } from "@/domain/value-objects/compensation.js";
import { Period } from "@/domain/value-objects/period.js";
import { NotFound } from "@/domain/errors/domain.error.js";
import { ok, err, type Result } from "@/application/shared/result.js";
import type { DomainError } from "@/domain/errors/domain.error.js";
import type { CreateGoalRequest, ConditionGroupInput } from "./create-goal.request.js";
import type { CreateGoalResponse } from "./create-goal.response.js";

export class CreateGoalUseCase {
  constructor(
    private readonly goals: IGoalRepository,
    private readonly campaigns: ICampaignRepository,
    private readonly clock: IClock,
    private readonly idGenerator: IIDGenerator,
  ) {}

  async execute(req: CreateGoalRequest): Promise<Result<CreateGoalResponse, DomainError>> {
    const campaign = await this.campaigns.findById(req.campaignId);
    if (!campaign) return err(new NotFound("Campaign", req.campaignId));

    const now = this.clock.now();

    const periodResult = Period.create(new Date(req.validFrom), new Date(req.validTo));
    if (!periodResult.ok) return err(periodResult.error);

    const compensationResult = Compensation.create(
      req.compensationType,
      req.compensationValue,
      req.compensationCurrency,
    );
    if (!compensationResult.ok) return err(compensationResult.error);

    const goalResult = Goal.create({
      id: this.idGenerator.generate(),
      campaignId: req.campaignId,
      name: req.name,
      period: periodResult.value,
      compensation: compensationResult.value,
      createdAt: now,
      updatedAt: now,
    });
    if (!goalResult.ok) return err(goalResult.error);

    const groups: ConditionGroup[] = [];
    const conditions: Condition[] = [];

    this.flattenTree(req.conditionTree, goalResult.value.id, null, groups, conditions);

    await this.goals.saveWithConditions(goalResult.value, groups, conditions);

    const g = goalResult.value;
    return ok({
      id: g.id,
      campaignId: g.campaignId,
      name: g.name,
      validFrom: g.period.start.toISOString(),
      validTo: g.period.end.toISOString(),
      compensationType: g.compensation.type,
      compensationValue: g.compensation.value.toString(),
      compensationCurrency: g.compensation.currency,
    });
  }

  private flattenTree(
    input: ConditionGroupInput,
    goalId: string,
    parentGroupId: string | null,
    groups: ConditionGroup[],
    conditions: Condition[],
  ): string {
    const groupId = this.idGenerator.generate();
    const now = this.clock.now();

    const groupResult = ConditionGroup.create({
      id: groupId,
      goalId,
      parentGroupId,
      logicalOperator: input.logicalOperator,
      createdAt: now,
      updatedAt: now,
    });
    if (!groupResult.ok) throw new Error(groupResult.error.message);
    groups.push(groupResult.value);

    for (const c of input.conditions) {
      const condResult = Condition.create({
        id: this.idGenerator.generate(),
        groupId,
        field: c.field,
        operator: c.operator,
        rawValue: c.value,
        createdAt: now,
        updatedAt: now,
      });
      if (!condResult.ok) throw new Error(condResult.error.message);
      conditions.push(condResult.value);
    }

    for (const child of input.children) {
      this.flattenTree(child, goalId, groupId, groups, conditions);
    }

    return groupId;
  }
}
