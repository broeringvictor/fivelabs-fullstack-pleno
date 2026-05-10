import type { ISaleRepository } from "@/application/ports/repositories/i-sale.repository.js";
import type { Sale } from "@/domain/entities/sale.js";

export class InMemorySaleRepository implements ISaleRepository {
  private store: Sale[] = [];

  add(sale: Sale): void {
    this.store.push(sale);
  }

  async findByPeriodAndSalesperson(from: Date, to: Date, salespersonId: string): Promise<Sale[]> {
    return this.store.filter(
      (s) => s.salespersonId === salespersonId && s.soldAt >= from && s.soldAt <= to,
    );
  }
}
