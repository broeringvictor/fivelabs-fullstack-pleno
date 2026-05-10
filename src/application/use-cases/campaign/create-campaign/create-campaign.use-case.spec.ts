import { describe, it, expect } from "vitest";
import { CreateCampaignUseCase } from "./create-campaign.use-case.js";
import { InMemoryCampaignRepository } from "@/application/__tests__/fakes/in-memory-campaign.repository.js";
import { FakeClock } from "@/application/__tests__/fakes/fake-clock.js";
import { FakeIDGenerator } from "@/application/__tests__/fakes/fake-id-generator.js";

function make() {
  const repo = new InMemoryCampaignRepository();
  const useCase = new CreateCampaignUseCase(repo, new FakeClock(), new FakeIDGenerator());
  return { repo, useCase };
}

describe("CreateCampaignUseCase", () => {
  it("cria campanha e retorna dados", async () => {
    const { repo, useCase } = make();
    const result = await useCase.execute({
      name: "Black Friday",
      description: "Campanha de novembro",
      createdById: "user-1",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe("Black Friday");
    expect(repo.size).toBe(1);
  });

  it("rejeita nome vazio", async () => {
    const { useCase } = make();
    const result = await useCase.execute({ name: "", description: "...", createdById: "user-1" });
    expect(result.ok).toBe(false);
  });
});
