import type { IAppraisalRepository } from "@/application/ports/repositories/i-appraisal.repository.js";
import { AppraisalStatus } from "@/domain/enums/appraisal-status.js";
import { ok, type Result } from "@/application/shared/result.js";
import type { DomainError } from "@/domain/errors/domain.error.js";
import type { DashboardReportResponse } from "./get-dashboard-report.response.js";
import { Decimal } from "decimal.js";

export class GetDashboardReportUseCase {
  constructor(
    private readonly appraisals: IAppraisalRepository,
  ) {}

  async execute(): Promise<Result<DashboardReportResponse, DomainError>> {
    const latest = await this.appraisals.findLatest();
    const latestCompleted = await this.appraisals.findLatestCompleted();
    
    const isProcessing = latest?.status === AppraisalStatus.PROCESSING;

    if (!latestCompleted) {
      return ok({
        kpis: {
          totalCommissions: "0.00",
          goalsMetPercentage: 0,
          activeSalespersons: 0,
          volumeProcessed: "0.00",
          currency: "BRL",
        },
        latestResults: [],
        lastAppraisal: latest ? {
          id: latest.id,
          status: latest.status,
          lastError: latest.lastError,
          updatedAt: latest.updatedAt.toISOString(),
        } : null,
        isProcessing,
      });
    }

    const { results } = latestCompleted;
    
    let totalPayable = new Decimal(0);
    let totalVolume = new Decimal(0);
    let goalsMetCount = 0;
    const activeSalespersonsSet = new Set<string>();

    results.forEach(r => {
      totalPayable = totalPayable.plus(r.payableAmount.amount);
      totalVolume = totalVolume.plus(r.achievedValue.amount);
      if (r.goalMet) {
        goalsMetCount++;
      }
      activeSalespersonsSet.add(r.salespersonId);
    });

    const goalsMetPercentage = results.length > 0 
      ? Math.round((goalsMetCount / results.length) * 100) 
      : 0;

    return ok({
      kpis: {
        totalCommissions: totalPayable.toFixed(2),
        goalsMetPercentage,
        activeSalespersons: activeSalespersonsSet.size,
        volumeProcessed: totalVolume.toFixed(2),
        currency: results[0]?.payableAmount.currency ?? "BRL",
      },
      latestResults: results.slice(0, 10).map(r => ({
        id: `${r.appraisalId}-${r.goalId}-${r.salespersonId}`,
        salespersonName: r.salespersonId, // Idealmente aqui buscaríamos o nome
        goalName: r.goalId, // Idealmente aqui buscaríamos o nome
        status: r.goalMet ? "MET" : "NOT_MET",
        value: r.achievedValue.amount.toFixed(2),
        payable: r.payableAmount.amount.toFixed(2),
      })),
      lastAppraisal: latest ? {
        id: latest.id,
        status: latest.status,
        lastError: latest.lastError,
        updatedAt: latest.updatedAt.toISOString(),
      } : null,
      isProcessing,
    });
  }
}
