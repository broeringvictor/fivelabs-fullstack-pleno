import type { IProductRepository } from "@/application/ports/repositories/i-product.repository.js";
import type { ListProductsResponse } from "./list-products.response.js";

export class ListProductsUseCase {
  constructor(private readonly products: IProductRepository) {}

  async execute(): Promise<ListProductsResponse> {
    const all = await this.products.findAll();
    return all.map((p) => ({ id: p.id, name: p.name, sku: p.sku }));
  }
}
