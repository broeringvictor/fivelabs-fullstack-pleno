import { describe, it, expect } from "vitest";
import { ListSalespersonsUseCase } from "./list-salespersons.use-case.js";
import { InMemorySalespersonRepository } from "@/application/__tests__/fakes/in-memory-salesperson.repository.js";
import { Salesperson } from "@/domain/entities/salesperson.js";

describe("ListSalespersonsUseCase", () => {
  it("retorna todos os vendedores mapeados para o response type", async () => {
    const repo = new InMemorySalespersonRepository();
    const s1 = Salesperson.reconstruct({ id: "id-1", name: "Zara Silva", document: "111", createdAt: new Date(), updatedAt: new Date() });
    const s2 = Salesperson.reconstruct({ id: "id-2", name: "Ana Costa", document: "222", createdAt: new Date(), updatedAt: new Date() });
    repo.add(s1);
    repo.add(s2);

    const useCase = new ListSalespersonsUseCase(repo);
    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    const names = result.map((r) => r.name);
    expect(names).toContain("Ana Costa");
    expect(names).toContain("Zara Silva");
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("document");
  });

  it("retorna lista vazia quando não há vendedores", async () => {
    const repo = new InMemorySalespersonRepository();
    const useCase = new ListSalespersonsUseCase(repo);
    const result = await useCase.execute();
    expect(result).toHaveLength(0);
  });
});
