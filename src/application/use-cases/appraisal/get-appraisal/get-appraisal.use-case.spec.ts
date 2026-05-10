import { describe, it, expect } from "vitest";
import { GetAppraisalUseCase } from "./get-appraisal.use-case.js";
import { TriggerAppraisalUseCase } from "../trigger-appraisal/trigger-appraisal.use-case.js";
import { InMemoryAppraisalRepository } from "@/application/__tests__/fakes/in-memory-appraisal.repository.js";
import { FakeClock } from "@/application/__tests__/fakes/fake-clock.js";
import { FakeIDGenerator } from "@/application/__tests__/fakes/fake-id-generator.js";

describe("GetAppraisalUseCase", () => {
  it("retorna apuração com status PENDING recém criada", async () => {
    const repo = new InMemoryAppraisalRepository();
    const trigger = new TriggerAppraisalUseCase(repo, new FakeClock(), new FakeIDGenerator());
    const { id } = await trigger.execute("user-1");

    const get = new GetAppraisalUseCase(repo);
    const result = await get.execute(id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("PENDING");
    expect(result.value.results).toHaveLength(0);
  });

  it("retorna NOT_FOUND para id inexistente", async () => {
    const get = new GetAppraisalUseCase(new InMemoryAppraisalRepository());
    const result = await get.execute("ghost");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_FOUND");
  });
});
