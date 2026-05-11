import type { Product } from "@/domain/entities/product.js";

export interface IProductRepository {
  findAll(): Promise<Product[]>;
}
