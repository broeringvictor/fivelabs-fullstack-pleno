import type { IGoalRepository, GoalWithTree } from "@/application/ports/repositories/i-goal.repository.js";
import type { Goal } from "@/domain/entities/goal.js";
import type { ConditionGroup } from "@/domain/entities/condition-group.js";
import type { Condition } from "@/domain/entities/condition.js";

export class InMemoryGoalRepository implements IGoalRepository {
  private store = new Map<string, GoalWithTree>();

  async saveWithConditions(goal: Goal, groups: ConditionGroup[], conditions: Condition[]): Promise<void> {
    this.store.set(goal.id, { goal, groups, conditions });
  }

  async findByCampaignId(campaignId: string): Promise<GoalWithTree[]> {
    return [...this.store.values()].filter(({ goal }) => goal.campaignId === campaignId);
  }

  async findActive(now: Date): Promise<GoalWithTree[]> {
    return [...this.store.values()].filter(
      ({ goal }) => goal.period.start <= now && now <= goal.period.end && !goal.deletedAt,
    );
  }

  async findByIds(ids: string[]): Promise<Goal[]> {
    return [...this.store.values()]
      .filter(({ goal }) => ids.includes(goal.id))
      .map(({ goal }) => goal);
  }
}
