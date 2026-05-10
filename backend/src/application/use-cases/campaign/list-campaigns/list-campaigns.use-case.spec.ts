import { describe, it, expect } from "vitest";
import { ListCampaignsUseCase } from "./list-campaigns.use-case.js";
import { CreateCampaignUseCase } from "../create-campaign/create-campaign.use-case.js";
import { InMemoryCampaignRepository } from "@/application/__tests__/fakes/in-memory-campaign.repository.js";
import { FakeClock } from "@/application/__tests__/fakes/fake-clock.js";
import { FakeIDGenerator } from "@/application/__tests__/fakes/fake-id-generator.js";

describe("ListCampaignsUseCase", () => {
  it("retorna todas as campanhas", async () => {
    const repo = new InMemoryCampaignRepository();
    const create = new CreateCampaignUseCase(repo, new FakeClock(), new FakeIDGenerator());
    await create.execute({ name: "C1", description: "d1", createdById: "u1" });
    await create.execute({ name: "C2", description: "d2", createdById: "u1" });

    const list = new ListCampaignsUseCase(repo);
    const result = await list.execute();
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe("C1");
  });
});
