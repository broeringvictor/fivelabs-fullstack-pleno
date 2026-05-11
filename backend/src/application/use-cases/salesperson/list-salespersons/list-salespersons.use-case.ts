import type { ISalespersonRepository } from "@/application/ports/repositories/i-salesperson.repository.js";
import type { ListSalespersonsResponse } from "./list-salespersons.response.js";

export class ListSalespersonsUseCase {
  constructor(private readonly salespersons: ISalespersonRepository) {}

  async execute(): Promise<ListSalespersonsResponse> {
    const all = await this.salespersons.findAll();
    return all.map((s) => ({
      id: s.id,
      name: s.name,
      document: s.document,
    }));
  }
}
