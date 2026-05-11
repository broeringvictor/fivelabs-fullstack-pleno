import type { PrismaClient } from "../../../generated/prisma/client.js";
import type { IAppraisalRepository, AppraisalWithResults } from "@/application/ports/repositories/i-appraisal.repository.js";
import type { Appraisal } from "@/domain/entities/appraisal.js";
import type { AppraisalResult } from "@/domain/entities/appraisal-result.js";
import { appraisalMapper } from "../mappers/appraisal.mapper.js";
import { appraisalResultMapper } from "../mappers/appraisal-result.mapper.js";
import { AppraisalStatus } from "@/domain/enums/appraisal-status.js";

export class PrismaAppraisalRepository implements IAppraisalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(appraisal: Appraisal): Promise<void> {
    await this.prisma.appraisal.upsert({
      where: { id: appraisal.id },
      create: appraisalMapper.toPersistence(appraisal),
      update: appraisalMapper.toPersistence(appraisal),
    });
  }

  async findById(id: string): Promise<AppraisalWithResults | null> {
    const row = await this.prisma.appraisal.findUnique({
      where: { id },
      include: { appraisalResults: true },
    });
    if (!row) return null;
    return {
      appraisal: appraisalMapper.toDomain(row),
      results: row.appraisalResults.map(appraisalResultMapper.toDomain),
    };
  }

  async findLatestCompleted(): Promise<AppraisalWithResults | null> {
    const row = await this.prisma.appraisal.findFirst({
      where: { status: AppraisalStatus.DONE },
      orderBy: { finishedAt: "desc" },
      include: { appraisalResults: true },
    });
    if (!row) return null;
    return {
      appraisal: appraisalMapper.toDomain(row),
      results: row.appraisalResults.map(appraisalResultMapper.toDomain),
    };
  }

  async findLatest(): Promise<Appraisal | null> {
    const row = await this.prisma.appraisal.findFirst({
      orderBy: { createdAt: "desc" },
    });
    return row ? appraisalMapper.toDomain(row) : null;
  }

  async findAll(): Promise<Appraisal[]> {
    const rows = await this.prisma.appraisal.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map(appraisalMapper.toDomain);
  }

  async claimNextPending(): Promise<Appraisal | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      UPDATE "Appraisal"
      SET status = 'PROCESSING', "startedAt" = NOW(), attempts = attempts + 1, "updatedAt" = NOW()
      WHERE id = (
        SELECT id FROM "Appraisal"
        WHERE status = 'PENDING' AND "nextAttemptAt" <= NOW()
        ORDER BY "createdAt"
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING *
    `;
    return rows[0] ? appraisalMapper.toDomain(rows[0]) : null;
  }

  async saveResults(results: AppraisalResult[]): Promise<void> {
    if (results.length === 0) return;
    await this.prisma.$transaction(
      results.map(r =>
        this.prisma.appraisalResult.upsert({
          where: {
            appraisalId_goalId_salespersonId: {
              appraisalId: r.appraisalId,
              goalId: r.goalId,
              salespersonId: r.salespersonId,
            },
          },
          create: appraisalResultMapper.toPersistence(r),
          update: appraisalResultMapper.toPersistence(r),
        }),
      ),
    );
  }

  async markDone(id: string, finishedAt: Date): Promise<void> {
    await this.prisma.appraisal.update({
      where: { id },
      data: { status: AppraisalStatus.DONE, finishedAt, updatedAt: new Date() },
    });
  }

  async markFailed(id: string, error: string, nextAttemptAt: Date): Promise<void> {
    await this.prisma.appraisal.update({
      where: { id },
      data: { status: AppraisalStatus.FAILED, lastError: error, nextAttemptAt, updatedAt: new Date() },
    });
  }
}
