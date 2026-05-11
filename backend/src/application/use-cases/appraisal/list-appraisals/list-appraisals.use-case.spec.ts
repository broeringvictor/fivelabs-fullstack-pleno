import { describe, it, expect } from "vitest";
import { ListAppraisalsUseCase } from "./list-appraisals.use-case.js";
import { TriggerAppraisalUseCase } from "../trigger-appraisal/trigger-appraisal.use-case.js";
import { InMemoryAppraisalRepository } from "@/application/__tests__/fakes/in-memory-appraisal.repository.js";
import { FakeClock } from "@/application/__tests__/fakes/fake-clock.js";
import { FakeIDGenerator } from "@/application/__tests__/fakes/fake-id-generator.js";

describe("ListAppraisalsUseCase", () => {
  it("retorna apurações em ordem decrescente de criação", async () => {
    const repo = new InMemoryAppraisalRepository();
    const clock = new FakeClock();
    const idGen = new FakeIDGenerator();
    const trigger = new TriggerAppraisalUseCase(repo, clock, idGen);

    await trigger.execute("user-1");
    await trigger.execute("user-1");

    const list = new ListAppraisalsUseCase(repo);
    const result = await list.execute();

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("status", "PENDING");
    expect(result[0]).toHaveProperty("createdAt");
    expect(result[0]).toHaveProperty("finishedAt", null);
  });

  it("retorna lista vazia quando não há apurações", async () => {
    const repo = new InMemoryAppraisalRepository();
    const result = await new ListAppraisalsUseCase(repo).execute();
    expect(result).toHaveLength(0);
  });
});
