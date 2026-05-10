import type { PrismaClient } from "../../../generated/prisma/client.js";
import type { IGoalRepository, GoalWithTree } from "@/application/ports/repositories/i-goal.repository.js";
import type { Goal } from "@/domain/entities/goal.js";
import type { ConditionGroup } from "@/domain/entities/condition-group.js";
import type { Condition } from "@/domain/entities/condition.js";
import { goalMapper } from "../mappers/goal.mapper.js";
import { conditionGroupMapper } from "../mappers/condition-group.mapper.js";
import { conditionMapper } from "../mappers/condition.mapper.js";

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveWithConditions(goal: Goal, groups: ConditionGroup[], conditions: Condition[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.goal.upsert({
        where: { id: goal.id },
        create: goalMapper.toPersistence(goal),
        update: goalMapper.toPersistence(goal),
      }),
      // Limpa a árvore anterior para evitar registros órfãos em caso de atualização de estrutura
      this.prisma.condition.deleteMany({ where: { group: { goalId: goal.id } } }),
      this.prisma.conditionGroup.deleteMany({ where: { goalId: goal.id } }),

      // Insere a nova árvore (a ordem no array garante pais antes de filhos)
      ...groups.map(g =>
        this.prisma.conditionGroup.create({
          data: conditionGroupMapper.toPersistence(g),
        }),
      ),
      ...conditions.map(c =>
        this.prisma.condition.create({
          data: conditionMapper.toPersistence(c),
        }),
      ),
    ]);
  }

  async findByCampaignId(campaignId: string): Promise<GoalWithTree[]> {
    const rows = await this.prisma.goal.findMany({
      where: { campaignId, deletedAt: null },
      include: { conditionGroups: { include: { conditions: true } } },
    });
    return rows.map(row => this.rowToGoalWithTree(row));
  }

  async findActive(now: Date): Promise<GoalWithTree[]> {
    const rows = await this.prisma.goal.findMany({
      where: { validFrom: { lte: now }, validTo: { gte: now }, deletedAt: null },
      include: { conditionGroups: { include: { conditions: true } } },
    });
    return rows.map(row => this.rowToGoalWithTree(row));
  }

  private rowToGoalWithTree(row: any): GoalWithTree {
    const groups = row.conditionGroups.map((g: any) => conditionGroupMapper.toDomain(g));
    const conditions = row.conditionGroups.flatMap((g: any) =>
      g.conditions.map((c: any) => conditionMapper.toDomain(c)),
    );
    return { goal: goalMapper.toDomain(row), groups, conditions };
  }
}
