import type { IProductRepository } from "@/application/ports/repositories/i-product.repository.js";
import type { Product } from "@/domain/entities/product.js";

export class InMemoryProductRepository implements IProductRepository {
  private store: Product[] = [];

  add(p: Product): void {
    this.store.push(p);
  }

  async findAll(): Promise<Product[]> {
    return [...this.store].sort((a, b) => a.name.localeCompare(b.name));
  }
}
