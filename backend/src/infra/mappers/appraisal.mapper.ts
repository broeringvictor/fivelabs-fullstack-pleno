import type { AppraisalModel } from "../../../generated/prisma/models/Appraisal.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { Appraisal } from "@/domain/entities/appraisal.js";
import { type AppraisalStatus } from "@/domain/enums/appraisal-status.js";

export type { AppraisalModel };

export const appraisalMapper = {
  toDomain(row: AppraisalModel): Appraisal {
    return Appraisal.reconstruct({
      id: row.id,
      triggeredById: row.triggeredById,
      status: row.status as AppraisalStatus,
      attempts: row.attempts,
      nextAttemptAt: row.nextAttemptAt,
      lastError: row.lastError,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toPersistence(entity: Appraisal): Prisma.AppraisalCreateInput {
    return {
      id: entity.id,
      ...(entity.triggeredById ? { triggeredBy: { connect: { id: entity.triggeredById } } } : {}),
      status: entity.status,
      attempts: entity.attempts,
      nextAttemptAt: entity.nextAttemptAt,
      lastError: entity.lastError,
      startedAt: entity.startedAt,
      finishedAt: entity.finishedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  },
};
