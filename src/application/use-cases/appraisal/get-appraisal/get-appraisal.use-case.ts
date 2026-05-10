import type { IAppraisalRepository } from "@/application/ports/repositories/i-appraisal.repository.js";
import { NotFound } from "@/domain/errors/domain.error.js";
import type { DomainError } from "@/domain/errors/domain.error.js";
import { ok, err, type Result } from "@/application/shared/result.js";
import type { GetAppraisalResponse, AppraisalResultItem } from "./get-appraisal.response.js";

export class GetAppraisalUseCase {
  constructor(private readonly appraisals: IAppraisalRepository) {}

  async execute(id: string): Promise<Result<GetAppraisalResponse, DomainError>> {
    const found = await this.appraisals.findById(id);
    if (!found) return err(new NotFound("Appraisal", id));

    const { appraisal, results } = found;

    const resultItems: AppraisalResultItem[] = results.map((r) => ({
      goalId: r.goalId,
      salespersonId: r.salespersonId,
      achievedValue: r.achievedValue.amount.toFixed(2),
      achievedCurrency: r.achievedValue.currency,
      goalMet: r.goalMet,
      payableAmount: r.payableAmount.amount.toFixed(2),
      payableCurrency: r.payableAmount.currency,
    }));

    return ok({
      id: appraisal.id,
      status: appraisal.status,
      createdAt: appraisal.createdAt.toISOString(),
      finishedAt: appraisal.finishedAt?.toISOString() ?? null,
      results: resultItems,
    });
  }
}
