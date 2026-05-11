import { describe, it, expect } from "vitest";
import { GetAppraisalUseCase } from "./get-appraisal.use-case.js";
import { TriggerAppraisalUseCase } from "../trigger-appraisal/trigger-appraisal.use-case.js";
import { InMemoryAppraisalRepository } from "@/application/__tests__/fakes/in-memory-appraisal.repository.js";
import { InMemoryGoalRepository } from "@/application/__tests__/fakes/in-memory-goal.repository.js";
import { InMemorySalespersonRepository } from "@/application/__tests__/fakes/in-memory-salesperson.repository.js";
import { FakeClock } from "@/application/__tests__/fakes/fake-clock.js";
import { FakeIDGenerator } from "@/application/__tests__/fakes/fake-id-generator.js";
import { AppraisalResult } from "@/domain/entities/appraisal-result.js";
import { Money } from "@/domain/value-objects/money.js";
import { Goal } from "@/domain/entities/goal.js";
import { Salesperson } from "@/domain/entities/salesperson.js";
import { Period } from "@/domain/value-objects/period.js";
import { Compensation } from "@/domain/value-objects/compensation.js";
import { CompensationType } from "@/domain/enums/compensation-type.js";

function makeUseCase() {
  const appraisalRepo = new InMemoryAppraisalRepository();
  const goalRepo = new InMemoryGoalRepository();
  const salespersonRepo = new InMemorySalespersonRepository();
  const trigger = new TriggerAppraisalUseCase(appraisalRepo, new FakeClock(), new FakeIDGenerator());
  const get = new GetAppraisalUseCase(appraisalRepo, goalRepo, salespersonRepo);
  return { appraisalRepo, goalRepo, salespersonRepo, trigger, get };
}

describe("GetAppraisalUseCase", () => {
  it("retorna apuração com status PENDING recém criada", async () => {
    const { trigger, get } = makeUseCase();
    const { id } = await trigger.execute("user-1");

    const result = await get.execute(id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("PENDING");
    expect(result.value.results).toHaveLength(0);
  });

  it("retorna NOT_FOUND para id inexistente", async () => {
    const { get } = makeUseCase();
    const result = await get.execute("ghost");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_FOUND");
  });

  it("enriquece resultados com goalName e salespersonName quando entidades existem", async () => {
    const { appraisalRepo, goalRepo, salespersonRepo, trigger, get } = makeUseCase();

    const { id: appraisalId } = await trigger.execute("user-1");

    const goal = Goal.reconstruct({
      id: "goal-1",
      campaignId: "campaign-1",
      name: "Meta de Vendas",
      period: Period.reconstruct(new Date("2020-01-01"), new Date("2030-12-31")),
      compensation: Compensation.reconstruct(CompensationType.FIXED, 1000, "BRL"),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    await goalRepo.saveWithConditions(goal, [], []);

    const spResult = Salesperson.create({ id: "sp-1", name: "Alice Silva", document: "111" });
    if (!spResult.ok) throw new Error("salesperson creation failed");
    salespersonRepo.add(spResult.value);

    const result = AppraisalResult.create({
      id: "result-1",
      appraisalId,
      goalId: "goal-1",
      salespersonId: "sp-1",
      achievedValue: Money.reconstruct(6000, "BRL"),
      goalMet: true,
      payableAmount: Money.reconstruct(1000, "BRL"),
      evaluatedAt: new Date(),
    });
    if (!result.ok) throw new Error("result creation failed");
    await appraisalRepo.saveResults([result.value]);

    const response = await get.execute(appraisalId);
    expect(response.ok).toBe(true);
    if (!response.ok) return;

    expect(response.value.results).toHaveLength(1);
    expect(response.value.results[0]?.goalName).toBe("Meta de Vendas");
    expect(response.value.results[0]?.salespersonName).toBe("Alice Silva");
  });

  it("usa o ID como fallback quando goal ou salesperson não são encontrados", async () => {
    const { appraisalRepo, trigger, get } = makeUseCase();

    const { id: appraisalId } = await trigger.execute("user-1");

    const result = AppraisalResult.create({
      id: "result-2",
      appraisalId,
      goalId: "unknown-goal-id",
      salespersonId: "unknown-sp-id",
      achievedValue: Money.reconstruct(0, "BRL"),
      goalMet: false,
      payableAmount: Money.reconstruct(0, "BRL"),
      evaluatedAt: new Date(),
    });
    if (!result.ok) throw new Error("result creation failed");
    await appraisalRepo.saveResults([result.value]);

    const response = await get.execute(appraisalId);
    expect(response.ok).toBe(true);
    if (!response.ok) return;

    expect(response.value.results).toHaveLength(1);
    expect(response.value.results[0]?.goalName).toBe("unknown-goal-id");
    expect(response.value.results[0]?.salespersonName).toBe("unknown-sp-id");
  });
});
