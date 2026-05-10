import type { GoalModel } from "../../../generated/prisma/models/Goal.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { Goal } from "@/domain/entities/goal.js";
import { Compensation } from "@/domain/value-objects/compensation.js";
import { Period } from "@/domain/value-objects/period.js";
import { type CompensationType } from "@/domain/enums/compensation-type.js";

export type { GoalModel };

export const goalMapper = {
  toDomain(row: GoalModel): Goal {
    const period = Period.reconstruct(row.validFrom, row.validTo);
    const compensation = Compensation.reconstruct(
      row.compensationType as CompensationType,
      row.compensationValue,
      row.compensationCurrency,
    );
    return Goal.reconstruct({
      id: row.id,
      campaignId: row.campaignId,
      name: row.name,
      period,
      compensation,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  },

  toPersistence(entity: Goal): Prisma.GoalCreateInput {
    return {
      id: entity.id,
      campaign: { connect: { id: entity.campaignId } },
      name: entity.name,
      validFrom: entity.period.start,
      validTo: entity.period.end,
      compensationType: entity.compensation.type,
      compensationValue: entity.compensation.value,
      compensationCurrency: entity.compensation.currency,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  },
};
