import type { AppraisalResultModel } from "../../../generated/prisma/models/AppraisalResult.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { AppraisalResult } from "@/domain/entities/appraisal-result.js";
import { Money } from "@/domain/value-objects/money.js";

export type { AppraisalResultModel };

export const appraisalResultMapper = {
  toDomain(row: AppraisalResultModel): AppraisalResult {
    const achievedValue = Money.reconstruct(row.achievedValue, row.achievedCurrency);
    const payableAmount = Money.reconstruct(row.payableAmount, row.payableCurrency);
    return AppraisalResult.reconstruct({
      id: row.id,
      appraisalId: row.appraisalId,
      goalId: row.goalId,
      salespersonId: row.salespersonId,
      achievedValue,
      goalMet: row.goalMet,
      payableAmount,
      evaluatedAt: row.evaluatedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toPersistence(entity: AppraisalResult): Prisma.AppraisalResultCreateInput {
    return {
      id: entity.id,
      appraisal: { connect: { id: entity.appraisalId } },
      goal: { connect: { id: entity.goalId } },
      salesperson: { connect: { id: entity.salespersonId } },
      achievedValue: entity.achievedValue.amount.toString(),
      achievedCurrency: entity.achievedValue.currency,
      goalMet: entity.goalMet,
      payableAmount: entity.payableAmount.amount.toString(),
      payableCurrency: entity.payableAmount.currency,
      evaluatedAt: entity.evaluatedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  },
};
