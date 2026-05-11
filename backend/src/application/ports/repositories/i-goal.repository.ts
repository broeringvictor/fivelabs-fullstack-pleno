import type { Goal } from "@/domain/entities/goal.js";
import type { ConditionGroup } from "@/domain/entities/condition-group.js";
import type { Condition } from "@/domain/entities/condition.js";

export type GoalWithTree = {
  goal: Goal;
  groups: ConditionGroup[];
  conditions: Condition[];
};

export interface IGoalRepository {
  saveWithConditions(goal: Goal, groups: ConditionGroup[], conditions: Condition[]): Promise<void>;
  findByCampaignId(campaignId: string): Promise<GoalWithTree[]>;
  findActive(now: Date): Promise<GoalWithTree[]>;
  findByIds(ids: string[]): Promise<Goal[]>;
}
