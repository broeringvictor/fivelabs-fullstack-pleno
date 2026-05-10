import type { Appraisal } from "@/domain/entities/appraisal.js";
import type { AppraisalResult } from "@/domain/entities/appraisal-result.js";

export type AppraisalWithResults = {
  appraisal: Appraisal;
  results: AppraisalResult[];
};

export interface IAppraisalRepository {
  save(appraisal: Appraisal): Promise<void>;
  findById(id: string): Promise<AppraisalWithResults | null>;
  claimNextPending(): Promise<Appraisal | null>;
  saveResults(results: AppraisalResult[]): Promise<void>;
  markDone(id: string, finishedAt: Date): Promise<void>;
  markFailed(id: string, error: string, nextAttemptAt: Date): Promise<void>;
}
