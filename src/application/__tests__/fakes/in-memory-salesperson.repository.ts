import type { ISalespersonRepository } from "@/application/ports/repositories/i-salesperson.repository.js";
import type { Salesperson } from "@/domain/entities/salesperson.js";

export class InMemorySalespersonRepository implements ISalespersonRepository {
  private store: Salesperson[] = [];

  add(s: Salesperson): void {
    this.store.push(s);
  }

  async findAll(): Promise<Salesperson[]> {
    return [...this.store];
  }
}
