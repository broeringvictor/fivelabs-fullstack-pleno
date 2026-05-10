import type { Sale } from "@/domain/entities/sale.js";

export interface ISaleRepository {
  findByPeriodAndSalesperson(from: Date, to: Date, salespersonId: string): Promise<Sale[]>;
  findByPeriod(from: Date, to: Date): Promise<Sale[]>;
}
