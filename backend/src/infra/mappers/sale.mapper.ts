import type { SaleModel } from "../../../generated/prisma/models/Sale.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { Sale } from "@/domain/entities/sale.js";
import { Money } from "@/domain/value-objects/money.js";

export type { SaleModel };

export const saleMapper = {
  toDomain(row: SaleModel): Sale {
    const amount = Money.reconstruct(row.amount, row.currency);
    return Sale.reconstruct({
      id: row.id,
      salespersonId: row.salespersonId,
      productId: row.productId,
      regionId: row.regionId,
      amount,
      soldAt: row.soldAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toPersistence(entity: Sale): Prisma.SaleCreateInput {
    return {
      id: entity.id,
      salesperson: { connect: { id: entity.salespersonId } },
      product: { connect: { id: entity.productId } },
      region: { connect: { id: entity.regionId } },
      amount: entity.amount.amount.toString(),
      currency: entity.amount.currency,
      soldAt: entity.soldAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  },
};
