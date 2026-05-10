import type { ConditionModel } from "../../../generated/prisma/models/Condition.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { Condition } from "@/domain/entities/condition.js";
import { ConditionValue, type ConditionValueRaw } from "@/domain/value-objects/condition-value.js";
import { type ConditionField } from "@/domain/enums/condition-field.js";
import { type ConditionOperator } from "@/domain/enums/condition-operator.js";

export type { ConditionModel };

export const conditionMapper = {
  toDomain(row: ConditionModel): Condition {
    return Condition.reconstruct({
      id: row.id,
      groupId: row.groupId,
      field: row.field as ConditionField,
      operator: row.operator as ConditionOperator,
      value: ConditionValue.reconstruct(row.value as ConditionValueRaw),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  },

  toPersistence(entity: Condition): Prisma.ConditionCreateInput {
    return {
      id: entity.id,
      group: { connect: { id: entity.groupId } },
      field: entity.field,
      operator: entity.operator,
      value: entity.value.value as Prisma.InputJsonValue,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  },
};
