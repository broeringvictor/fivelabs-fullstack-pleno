import { Sale } from "@/domain/entities/sale.js";
import { Money } from "@/domain/value-objects/money.js";
import type { ISaleRepository } from "@/application/ports/repositories/i-sale.repository.js";
import { type Result, ok, err } from "@/application/shared/result.js";
import { InvariantViolation } from "@/domain/errors/domain.error.js";
import type { IIDGenerator } from "@/application/ports/crypto/i-id-generator.js";

export type CreateSaleCommand = {
  salespersonId: string;
  productId: string;
  regionId: string;
  amount: number;
  currency: string;
  soldAt: Date;
};

export class CreateSaleUseCase {
  constructor(
    private readonly saleRepo: ISaleRepository,
    private readonly idGenerator: IIDGenerator
  ) {}

  async execute(command: CreateSaleCommand): Promise<Result<void, InvariantViolation>> {
    const moneyResult = Money.create(command.amount, command.currency);
    if (!moneyResult.ok) {
      return err(new InvariantViolation("Invalid amount or currency"));
    }

    const saleResult = Sale.create({
      id: this.idGenerator.generate(),
      salespersonId: command.salespersonId,
      productId: command.productId,
      regionId: command.regionId,
      amount: moneyResult.value,
      soldAt: new Date(command.soldAt),
    });

    if (!saleResult.ok) {
      return err(new InvariantViolation(saleResult.error.message));
    }

    await this.saleRepo.save(saleResult.value);
    return ok(undefined);
  }
}
