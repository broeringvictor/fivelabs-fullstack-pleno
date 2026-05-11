import { describe, it, expect } from "vitest";
import { CreateGoalUseCase } from "./create-goal.use-case.js";
import { InMemoryGoalRepository } from "@/application/__tests__/fakes/in-memory-goal.repository.js";
import { InMemoryCampaignRepository } from "@/application/__tests__/fakes/in-memory-campaign.repository.js";
import { CreateCampaignUseCase } from "@/application/use-cases/campaign/create-campaign/create-campaign.use-case.js";
import { FakeClock } from "@/application/__tests__/fakes/fake-clock.js";
import { FakeIDGenerator } from "@/application/__tests__/fakes/fake-id-generator.js";
import type { CreateGoalRequest } from "./create-goal.request.js";

async function makeWithCampaign() {
  const campaignRepo = new InMemoryCampaignRepository();
  const goalRepo = new InMemoryGoalRepository();
  const clock = new FakeClock();
  const idGen = new FakeIDGenerator();

  const createCampaign = new CreateCampaignUseCase(campaignRepo, clock, idGen);
  const campaign = await createCampaign.execute({ name: "C1", description: "d", createdById: "u1" });
  if (!campaign.ok) throw new Error();

  const useCase = new CreateGoalUseCase(goalRepo, campaignRepo, clock, idGen);
  return { useCase, goalRepo, campaignId: campaign.value.id };
}

const validTree = {
  logicalOperator: "AND" as const,
  conditions: [
    { field: "TOTAL_VALUE" as const, operator: "GT" as const, value: 1000000 },
    { field: "TOTAL_VALUE" as const, operator: "LT" as const, value: 1500000 },
  ],
  children: [],
};

describe("CreateGoalUseCase", () => {
  it("cria meta com condition tree e persiste grupos e condições", async () => {
    const { useCase, goalRepo, campaignId } = await makeWithCampaign();

    const req: CreateGoalRequest = {
      campaignId,
      name: "Meta Q1",
      validFrom: "2024-01-01",
      validTo: "2024-03-31",
      compensationType: "FIXED",
      compensationValue: 5000,
      compensationCurrency: "BRL",
      conditionTree: validTree,
    };

    const result = await useCase.execute(req);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const stored = await goalRepo.findByCampaignId(campaignId);
    expect(stored).toHaveLength(1);
    expect(stored[0]!.groups).toHaveLength(1);
    expect(stored[0]!.conditions).toHaveLength(2);
  });

  it("suporta condition tree aninhada", async () => {
    const { useCase, goalRepo, campaignId } = await makeWithCampaign();

    const nestedTree = {
      logicalOperator: "AND" as const,
      conditions: [{ field: "TOTAL_VALUE" as const, operator: "GT" as const, value: 500000 }],
      children: [
        {
          logicalOperator: "OR" as const,
          conditions: [
            { field: "REGION" as const, operator: "EQ" as const, value: "region-id-1" },
            { field: "REGION" as const, operator: "EQ" as const, value: "region-id-2" },
          ],
          children: [],
        },
      ],
    };

    const req: CreateGoalRequest = {
      campaignId,
      name: "Meta Aninhada",
      validFrom: "2024-01-01",
      validTo: "2024-12-31",
      compensationType: "PERCENTAGE",
      compensationValue: 10,
      conditionTree: nestedTree,
    };

    const result = await useCase.execute(req);
    expect(result.ok).toBe(true);
    const stored = await goalRepo.findByCampaignId(campaignId);
    expect(stored[0]!.groups).toHaveLength(2);
    expect(stored[0]!.conditions).toHaveLength(3);
  });

  it("rejeita campanha inexistente com NOT_FOUND", async () => {
    const goalRepo = new InMemoryGoalRepository();
    const campaignRepo = new InMemoryCampaignRepository();
    const useCase = new CreateGoalUseCase(goalRepo, campaignRepo, new FakeClock(), new FakeIDGenerator());

    const result = await useCase.execute({
      campaignId: "ghost",
      name: "Meta",
      validFrom: "2024-01-01",
      validTo: "2024-12-31",
      compensationType: "FIXED",
      compensationValue: 100,
      compensationCurrency: "BRL",
      conditionTree: validTree,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_FOUND");
  });
});
