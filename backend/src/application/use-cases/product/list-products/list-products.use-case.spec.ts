import { describe, it, expect } from "vitest";
import { ListProductsUseCase } from "./list-products.use-case.js";
import { InMemoryProductRepository } from "@/application/__tests__/fakes/in-memory-product.repository.js";
import { Product } from "@/domain/entities/product.js";

describe("ListProductsUseCase", () => {
  it("retorna lista de produtos ordenada por nome", async () => {
    const repo = new InMemoryProductRepository();
    repo.add(Product.reconstruct({ id: "p1", name: "Seguro Vida", sku: "SV-001", createdAt: new Date(), updatedAt: new Date() }));
    repo.add(Product.reconstruct({ id: "p2", name: "Automóvel", sku: "AUTO-001", createdAt: new Date(), updatedAt: new Date() }));

    const result = await new ListProductsUseCase(repo).execute();

    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe("Automóvel");
    expect(result[1]?.name).toBe("Seguro Vida");
  });

  it("retorna lista vazia quando não há produtos", async () => {
    const result = await new ListProductsUseCase(new InMemoryProductRepository()).execute();
    expect(result).toHaveLength(0);
  });
});
