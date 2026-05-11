import type { IAppraisalRepository } from "@/application/ports/repositories/i-appraisal.repository.js";
import type { IGoalRepository } from "@/application/ports/repositories/i-goal.repository.js";
import type { ISaleRepository } from "@/application/ports/repositories/i-sale.repository.js";
import type { ISalespersonRepository } from "@/application/ports/repositories/i-salesperson.repository.js";
import type { ICurrencyConverter } from "@/application/ports/currency/i-currency-converter.js";
import type { IClock } from "@/application/ports/clock/i-clock.js";
import type { IIDGenerator } from "@/application/ports/crypto/i-id-generator.js";
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
    private readonly currencyConverter: ICurrencyConverter,
    private readonly idGenerator: IIDGenerator,
  ) {}

  async execute(appraisalId: string): Promise<void> {
    const now = this.clock.now();

    const found = await this.appraisals.findById(appraisalId);
    if (!found) return;

    // Se já estiver concluído, não reprocessa
    if (found.appraisal.status === AppraisalStatus.DONE) return;

    try {
      const activeGoals = await this.goals.findActive(now);
      const allSalespersons = await this.salespersons.findAll();

      const results: AppraisalResult[] = [];

      for (const { goal, groups, conditions } of activeGoals) {
        const tree = buildTree(groups, conditions);
        
        // Batch fetch all sales for this goal's period (Optimizes N+1)
        const allPeriodSales = await this.sales.findByPeriod(goal.period.start, goal.period.end);

        for (const salesperson of allSalespersons) {
          const salespersonSales = allPeriodSales.filter(s => s.salespersonId === salesperson.id);

          const matchingSales = salespersonSales.filter((s) =>
            tree.matches({
              salespersonId: s.salespersonId,
              productId: s.productId,
              regionId: s.regionId,
              amount: s.amount.amount.toString(),
            }),
          );

          const goalMet = matchingSales.length > 0;

          // Soma os valores convertendo moedas se necessário
          const defaultCurrency = goal.compensation.currency ?? "BRL";
          let achievedValue = Money.reconstruct(0, defaultCurrency);

          for (const sale of matchingSales) {
            const saleAmount = sale.amount;
            const valueToAdd = saleAmount.currency === defaultCurrency
              ? saleAmount.amount
              : await this.currencyConverter.convert(saleAmount.amount, saleAmount.currency, defaultCurrency);
            
            achievedValue = achievedValue.add(Money.reconstruct(valueToAdd, defaultCurrency));
          }

          const payable = goalMet
            ? goal.calculateCompensation(achievedValue)
            : Money.reconstruct(0, defaultCurrency);

          const resultOrError = AppraisalResult.create({
            id: this.idGenerator.generate(),
            appraisalId,
            goalId: goal.id,
            salespersonId: salesperson.id,
            achievedValue,
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
