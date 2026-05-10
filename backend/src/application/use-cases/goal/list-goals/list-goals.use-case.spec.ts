import { describe, it, expect } from "vitest";
import { ListGoalsUseCase } from "./list-goals.use-case.js";
import { CreateGoalUseCase } from "../create-goal/create-goal.use-case.js";
import { CreateCampaignUseCase } from "@/application/use-cases/campaign/create-campaign/create-campaign.use-case.js";
import { InMemoryGoalRepository } from "@/application/__tests__/fakes/in-memory-goal.repository.js";
import { InMemoryCampaignRepository } from "@/application/__tests__/fakes/in-memory-campaign.repository.js";
import { FakeClock } from "@/application/__tests__/fakes/fake-clock.js";
import { FakeIDGenerator } from "@/application/__tests__/fakes/fake-id-generator.js";

describe("ListGoalsUseCase", () => {
  it("retorna metas de uma campanha", async () => {
    const campaignRepo = new InMemoryCampaignRepository();
    const goalRepo = new InMemoryGoalRepository();
    const clock = new FakeClock();
    const idGen = new FakeIDGenerator();

    const campaign = await new CreateCampaignUseCase(campaignRepo, clock, idGen).execute({ name: "C", description: "d", createdById: "u1" });
    if (!campaign.ok) throw new Error();

    await new CreateGoalUseCase(goalRepo, campaignRepo, clock, idGen).execute({
      campaignId: campaign.value.id,
      name: "Meta 1",
      validFrom: "2024-01-01",
      validTo: "2024-12-31",
      compensationType: "FIXED",
      compensationValue: 1000,
      compensationCurrency: "BRL",
      conditionTree: { logicalOperator: "AND", conditions: [], children: [] },
    });

    const result = await new ListGoalsUseCase(goalRepo).execute(campaign.value.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0]!.name).toBe("Meta 1");
  });
});
