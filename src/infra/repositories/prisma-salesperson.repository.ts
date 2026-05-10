import type { PrismaClient } from "../../../generated/prisma/client.js";
import type { ISalespersonRepository } from "@/application/ports/repositories/i-salesperson.repository.js";
import type { Salesperson } from "@/domain/entities/salesperson.js";
import { salespersonMapper } from "../mappers/salesperson.mapper.js";

export class PrismaSalespersonRepository implements ISalespersonRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Salesperson[]> {
    const rows = await this.prisma.salesperson.findMany({ orderBy: { name: "asc" } });
    return rows.map(salespersonMapper.toDomain);
  }
}
