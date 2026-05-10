import { describe, it, expect } from "vitest";
import { TriggerAppraisalUseCase } from "./trigger-appraisal.use-case.js";
import { InMemoryAppraisalRepository } from "@/application/__tests__/fakes/in-memory-appraisal.repository.js";
import { FakeClock } from "@/application/__tests__/fakes/fake-clock.js";
import { FakeIDGenerator } from "@/application/__tests__/fakes/fake-id-generator.js";

describe("TriggerAppraisalUseCase", () => {
  it("cria apuração com status PENDING", async () => {
    const repo = new InMemoryAppraisalRepository();
    const useCase = new TriggerAppraisalUseCase(repo, new FakeClock(), new FakeIDGenerator());
    const result = await useCase.execute("user-1");
    expect(result.status).toBe("PENDING");
    expect(result.id).toBeTruthy();
  });
});
