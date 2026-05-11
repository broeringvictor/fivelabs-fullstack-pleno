import type { PrismaClient } from "../../../generated/prisma/client.js";
import type { IProductRepository } from "@/application/ports/repositories/i-product.repository.js";
import type { Product } from "@/domain/entities/product.js";
import { productMapper } from "../mappers/product.mapper.js";

export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({ orderBy: { name: "asc" } });
    return rows.map(productMapper.toDomain);
  }
}
