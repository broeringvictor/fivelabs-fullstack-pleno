import type { ConditionGroupModel } from "../../../generated/prisma/models/ConditionGroup.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { ConditionGroup } from "@/domain/entities/condition-group.js";
import { type LogicalOperator } from "@/domain/enums/logical-operator.js";

export type { ConditionGroupModel };

export const conditionGroupMapper = {
  toDomain(row: ConditionGroupModel): ConditionGroup {
    return ConditionGroup.reconstruct({
      id: row.id,
      goalId: row.goalId,
      parentGroupId: row.parentGroupId,
      logicalOperator: row.logicalOperator as LogicalOperator,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  },

  toPersistence(entity: ConditionGroup): Prisma.ConditionGroupCreateInput {
    return {
      id: entity.id,
      goal: { connect: { id: entity.goalId } },
      ...(entity.parentGroupId ? { parent: { connect: { id: entity.parentGroupId } } } : {}),
      logicalOperator: entity.logicalOperator,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  },
};
