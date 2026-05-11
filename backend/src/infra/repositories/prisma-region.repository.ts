import type { PrismaClient } from "../../../generated/prisma/client.js";
import type { IRegionRepository } from "@/application/ports/repositories/i-region.repository.js";
import type { Region } from "@/domain/entities/region.js";
import { regionMapper } from "../mappers/region.mapper.js";

export class PrismaRegionRepository implements IRegionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Region[]> {
    const rows = await this.prisma.region.findMany({ orderBy: { name: "asc" } });
    return rows.map(regionMapper.toDomain);
  }
}
