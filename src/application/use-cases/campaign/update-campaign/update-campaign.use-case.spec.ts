import { describe, it, expect } from "vitest";
import { UpdateCampaignUseCase } from "./update-campaign.use-case.js";
import { CreateCampaignUseCase } from "../create-campaign/create-campaign.use-case.js";
import { InMemoryCampaignRepository } from "@/application/__tests__/fakes/in-memory-campaign.repository.js";
import { FakeClock } from "@/application/__tests__/fakes/fake-clock.js";
import { FakeIDGenerator } from "@/application/__tests__/fakes/fake-id-generator.js";

describe("UpdateCampaignUseCase", () => {
  it("atualiza nome e mantém descrição original", async () => {
    const repo = new InMemoryCampaignRepository();
    const create = new CreateCampaignUseCase(repo, new FakeClock(), new FakeIDGenerator());
    const created = await create.execute({ name: "Old", description: "old desc", createdById: "u1" });
    if (!created.ok) throw new Error();

    const update = new UpdateCampaignUseCase(repo, new FakeClock());
    const result = await update.execute(created.value.id, { name: "New" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe("New");
    expect(result.value.description).toBe("old desc");
  });

  it("retorna NOT_FOUND para id inexistente", async () => {
    const update = new UpdateCampaignUseCase(new InMemoryCampaignRepository(), new FakeClock());
    const result = await update.execute("ghost-id", { name: "X" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_FOUND");
  });
});
