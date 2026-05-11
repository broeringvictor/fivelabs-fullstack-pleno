import type { IAppraisalRepository } from "@/application/ports/repositories/i-appraisal.repository.js";
import type { ListAppraisalsResponse } from "./list-appraisals.response.js";

export class ListAppraisalsUseCase {
  constructor(private readonly appraisals: IAppraisalRepository) {}

  async execute(): Promise<ListAppraisalsResponse> {
    const all = await this.appraisals.findAll();
    return all.map((a) => ({
      id: a.id,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
      finishedAt: a.finishedAt?.toISOString() ?? null,
    }));
  }
}
