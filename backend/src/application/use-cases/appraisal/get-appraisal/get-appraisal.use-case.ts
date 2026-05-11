import type { IAppraisalRepository } from "@/application/ports/repositories/i-appraisal.repository.js";
import type { IGoalRepository } from "@/application/ports/repositories/i-goal.repository.js";
import type { ISalespersonRepository } from "@/application/ports/repositories/i-salesperson.repository.js";
import { NotFound } from "@/domain/errors/domain.error.js";
import type { DomainError } from "@/domain/errors/domain.error.js";
import { ok, err, type Result } from "@/application/shared/result.js";
import type { GetAppraisalResponse, AppraisalResultItem } from "./get-appraisal.response.js";

export class GetAppraisalUseCase {
  constructor(
    private readonly appraisals: IAppraisalRepository,
    private readonly goals: IGoalRepository,
    private readonly salespersons: ISalespersonRepository,
  ) {}

  async execute(id: string): Promise<Result<GetAppraisalResponse, DomainError>> {
    const found = await this.appraisals.findById(id);
    if (!found) return err(new NotFound("Appraisal", id));

    const { appraisal, results } = found;

    const goalIds = [...new Set(results.map((r) => r.goalId))];
    const [goals, salespersonList] = await Promise.all([
      this.goals.findByIds(goalIds),
      this.salespersons.findAll(),
    ]);

    const goalMap = new Map(goals.map((g) => [g.id, g.name]));
    const salespersonMap = new Map(salespersonList.map((s) => [s.id, s.name]));

    const resultItems: AppraisalResultItem[] = results.map((r) => ({
      goalId: r.goalId,
      goalName: goalMap.get(r.goalId) ?? r.goalId,
      salespersonId: r.salespersonId,
      salespersonName: salespersonMap.get(r.salespersonId) ?? r.salespersonId,
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
