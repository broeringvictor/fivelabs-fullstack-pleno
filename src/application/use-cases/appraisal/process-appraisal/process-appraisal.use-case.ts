import type { IAppraisalRepository } from "@/application/ports/repositories/i-appraisal.repository.js";
import type { IGoalRepository } from "@/application/ports/repositories/i-goal.repository.js";
import type { ISaleRepository } from "@/application/ports/repositories/i-sale.repository.js";
import type { ISalespersonRepository } from "@/application/ports/repositories/i-salesperson.repository.js";
import type { IClock } from "@/application/ports/clock/i-clock.js";
import { AppraisalResult } from "@/domain/entities/appraisal-result.js";
import { AppraisalStatus } from "@/domain/enums/appraisal-status.js";
import { Money } from "@/domain/value-objects/money.js";
import { buildTree } from "@/domain/entities/condition-tree.js";

export class ProcessAppraisalUseCase {
  constructor(
    private readonly appraisals: IAppraisalRepository,
    private readonly goals: IGoalRepository,
    private readonly sales: ISaleRepository,
    private readonly salespersons: ISalespersonRepository,
    private readonly clock: IClock,
  ) {}

  async execute(appraisalId: string): Promise<void> {
    const now = this.clock.now();

    const found = await this.appraisals.findById(appraisalId);
    if (!found || found.appraisal.status !== AppraisalStatus.PENDING) return;

    try {
      const activeGoals = await this.goals.findActive(now);
      const allSalespersons = await this.salespersons.findAll();

      const results: AppraisalResult[] = [];

      for (const { goal, groups, conditions } of activeGoals) {
        const tree = buildTree(groups, conditions);

        for (const salesperson of allSalespersons) {
          const salespersonSales = await this.sales.findByPeriodAndSalesperson(
            goal.period.start,
            goal.period.end,
            salesperson.id,
          );

          const matchingSales = salespersonSales.filter((s) =>
            tree.matches({
              salespersonId: s.salespersonId,
              productId: s.productId,
              regionId: s.regionId,
              amount: s.amount.amount.toString(),
            }),
          );

          const goalMet = matchingSales.length > 0;

          const defaultCurrency = goal.compensation.currency ?? "BRL";
          const achievedCurrency = matchingSales[0]?.amount.currency ?? defaultCurrency;
          const zeroMoney = Money.reconstruct(0, achievedCurrency);

          const achieved = matchingSales.reduce((acc, s) => {
            const saleAmount = Money.reconstruct(s.amount.amount, s.amount.currency);
            if (acc.currency !== saleAmount.currency) {
              console.warn(`[ProcessAppraisal] skipping sale ${s.id} — currency mismatch (${s.amount.currency} vs ${acc.currency})`);
              return acc;
            }
            return acc.add(saleAmount);
          }, zeroMoney);

          const payable = goalMet
            ? goal.calculateCompensation(achieved)
            : Money.reconstruct(0, defaultCurrency);

          const resultOrError = AppraisalResult.create({
            id: `${appraisalId}-${goal.id}-${salesperson.id}`,
            appraisalId,
            goalId: goal.id,
            salespersonId: salesperson.id,
            achievedValue: achieved,
            goalMet,
            payableAmount: payable,
            evaluatedAt: now,
          });

          if (resultOrError.ok) {
            results.push(resultOrError.value);
          }
        }
      }

      await this.appraisals.saveResults(results);
      await this.appraisals.markDone(appraisalId, now);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const nextAttemptAt = new Date(now.getTime() + 60_000);
      await this.appraisals.markFailed(appraisalId, message, nextAttemptAt);
    }
  }
}
