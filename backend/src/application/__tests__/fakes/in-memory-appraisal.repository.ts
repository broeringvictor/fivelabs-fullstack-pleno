import type { IAppraisalRepository, AppraisalWithResults } from "@/application/ports/repositories/i-appraisal.repository.js";
import { Appraisal } from "@/domain/entities/appraisal.js";
import type { AppraisalResult } from "@/domain/entities/appraisal-result.js";
import { AppraisalStatus } from "@/domain/enums/appraisal-status.js";

export class InMemoryAppraisalRepository implements IAppraisalRepository {
  private appraisals = new Map<string, Appraisal>();
  private results = new Map<string, AppraisalResult[]>();

  async save(appraisal: Appraisal): Promise<void> {
    this.appraisals.set(appraisal.id, appraisal);
  }

  async findById(id: string): Promise<AppraisalWithResults | null> {
    const appraisal = this.appraisals.get(id);
    if (!appraisal) return null;
    return { appraisal, results: this.results.get(id) ?? [] };
  }

  async findLatestCompleted(): Promise<AppraisalWithResults | null> {
    const completed = [...this.appraisals.values()]
      .filter((a) => a.status === AppraisalStatus.DONE)
      .sort((a, b) => (b.finishedAt?.getTime() ?? 0) - (a.finishedAt?.getTime() ?? 0));
    const latest = completed[0];
    if (!latest) return null;
    return { appraisal: latest, results: this.results.get(latest.id) ?? [] };
  }

  async findLatest(): Promise<Appraisal | null> {
    return (
      [...this.appraisals.values()].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )[0] ?? null
    );
  }

  async claimNextPending(): Promise<Appraisal | null> {
    return (
      [...this.appraisals.values()].find(
        (a) => a.status === AppraisalStatus.PENDING,
      ) ?? null
    );
  }

  async saveResults(results: AppraisalResult[]): Promise<void> {
    for (const r of results) {
      const list = this.results.get(r.appraisalId) ?? [];
      list.push(r);
      this.results.set(r.appraisalId, list);
    }
  }

  async markDone(id: string, finishedAt: Date): Promise<void> {
    const a = this.appraisals.get(id);
    if (!a) return;
    this.appraisals.set(
      id,
      Appraisal.reconstruct({
        id: a.id,
        triggeredById: a.triggeredById,
        status: AppraisalStatus.DONE,
        attempts: a.attempts,
        nextAttemptAt: a.nextAttemptAt,
        lastError: a.lastError,
        startedAt: a.startedAt,
        finishedAt,
        createdAt: a.createdAt,
        updatedAt: new Date(),
      }),
    );
  }

  async markFailed(id: string, error: string, nextAttemptAt: Date): Promise<void> {
    const a = this.appraisals.get(id);
    if (!a) return;
    this.appraisals.set(
      id,
      Appraisal.reconstruct({
        id: a.id,
        triggeredById: a.triggeredById,
        status: AppraisalStatus.FAILED,
        attempts: a.attempts + 1,
        nextAttemptAt,
        lastError: error,
        startedAt: a.startedAt,
        finishedAt: a.finishedAt,
        createdAt: a.createdAt,
        updatedAt: new Date(),
      }),
    );
  }
}
