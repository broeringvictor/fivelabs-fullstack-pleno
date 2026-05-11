import type { IRegionRepository } from "@/application/ports/repositories/i-region.repository.js";
import type { ListRegionsResponse } from "./list-regions.response.js";

export class ListRegionsUseCase {
  constructor(private readonly regions: IRegionRepository) {}

  async execute(): Promise<ListRegionsResponse> {
    const all = await this.regions.findAll();
    return all.map((r) => ({ id: r.id, name: r.name }));
  }
}
