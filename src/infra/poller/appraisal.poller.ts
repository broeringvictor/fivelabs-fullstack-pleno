import type { IAppraisalRepository } from "@/application/ports/repositories/i-appraisal.repository.js";
import type { ProcessAppraisalUseCase } from "@/application/use-cases/appraisal/process-appraisal/process-appraisal.use-case.js";

export class AppraisalPoller {
  private running = false;

  constructor(
    private readonly appraisals: IAppraisalRepository,
    private readonly processAppraisal: ProcessAppraisalUseCase,
    private readonly intervalMs = 2000,
  ) {}

  start(): void {
    this.running = true;
    this.tick();
  }

  stop(): void {
    this.running = false;
  }

  private async tick(): Promise<void> {
    if (!this.running) return;
    try {
      const appraisal = await this.appraisals.claimNextPending();
      if (appraisal) {
        await this.processAppraisal.execute(appraisal.id);
      }
    } catch (e) {
      console.error("[AppraisalPoller] erro inesperado:", e);
    }
    setTimeout(() => this.tick(), this.intervalMs);
  }
}
