import type { ProductModel } from "../../../generated/prisma/models/Product.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { Product } from "@/domain/entities/product.js";

export type { ProductModel };

export const productMapper = {
  toDomain(row: ProductModel): Product {
    return Product.reconstruct({
      id: row.id,
      name: row.name,
      sku: row.sku,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toPersistence(entity: Product): Prisma.ProductCreateInput {
    return {
      id: entity.id,
      name: entity.name,
      sku: entity.sku,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  },
};
