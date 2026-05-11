import { describe, it, expect } from "vitest";
import { ListRegionsUseCase } from "./list-regions.use-case.js";
import { InMemoryRegionRepository } from "@/application/__tests__/fakes/in-memory-region.repository.js";
import { Region } from "@/domain/entities/region.js";

describe("ListRegionsUseCase", () => {
  it("retorna lista de regiões ordenada por nome", async () => {
    const repo = new InMemoryRegionRepository();
    repo.add(Region.reconstruct({ id: "r1", name: "Sul", createdAt: new Date(), updatedAt: new Date() }));
    repo.add(Region.reconstruct({ id: "r2", name: "Norte", createdAt: new Date(), updatedAt: new Date() }));

    const result = await new ListRegionsUseCase(repo).execute();

    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe("Norte");
    expect(result[1]?.name).toBe("Sul");
  });

  it("retorna lista vazia quando não há regiões", async () => {
    const result = await new ListRegionsUseCase(new InMemoryRegionRepository()).execute();
    expect(result).toHaveLength(0);
  });
});
