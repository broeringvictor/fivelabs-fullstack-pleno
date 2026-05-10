import type { PrismaClient } from "../../../generated/prisma/client.js";
import type { ISaleRepository } from "@/application/ports/repositories/i-sale.repository.js";
import type { Sale } from "@/domain/entities/sale.js";
import { saleMapper } from "../mappers/sale.mapper.js";

export class PrismaSaleRepository implements ISaleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByPeriodAndSalesperson(from: Date, to: Date, salespersonId: string): Promise<Sale[]> {
    const rows = await this.prisma.sale.findMany({
      where: { salespersonId, soldAt: { gte: from, lte: to } },
    });
    return rows.map(saleMapper.toDomain);
  }

  async findByPeriod(from: Date, to: Date): Promise<Sale[]> {
    const rows = await this.prisma.sale.findMany({
      where: { soldAt: { gte: from, lte: to } },
    });
    return rows.map(saleMapper.toDomain);
  }
}
