import { describe, it, expect } from "vitest";
import { ProcessAppraisalUseCase } from "./process-appraisal.use-case.js";
import { TriggerAppraisalUseCase } from "../trigger-appraisal/trigger-appraisal.use-case.js";
import { CreateGoalUseCase } from "@/application/use-cases/goal/create-goal/create-goal.use-case.js";
import { CreateCampaignUseCase } from "@/application/use-cases/campaign/create-campaign/create-campaign.use-case.js";
import { InMemoryAppraisalRepository } from "@/application/__tests__/fakes/in-memory-appraisal.repository.js";
import { InMemoryGoalRepository } from "@/application/__tests__/fakes/in-memory-goal.repository.js";
import { InMemoryCampaignRepository } from "@/application/__tests__/fakes/in-memory-campaign.repository.js";
import { InMemorySaleRepository } from "@/application/__tests__/fakes/in-memory-sale.repository.js";
import { InMemorySalespersonRepository } from "@/application/__tests__/fakes/in-memory-salesperson.repository.js";
import { FakeClock } from "@/application/__tests__/fakes/fake-clock.js";
import { FakeIDGenerator } from "@/application/__tests__/fakes/fake-id-generator.js";
import { FakeCurrencyConverter } from "@/application/__tests__/fakes/fake-currency-converter.js";
import { AppraisalStatus } from "@/domain/enums/appraisal-status.js";
import { Salesperson } from "@/domain/entities/salesperson.js";
import { Sale } from "@/domain/entities/sale.js";
import { Money } from "@/domain/value-objects/money.js";

describe("ProcessAppraisalUseCase", () => {
  it("calcula compensação FIXED para vendedor que bate a meta", async () => {
    const clock = new FakeClock();
    const idGen = new FakeIDGenerator();
    const appraisalRepo = new InMemoryAppraisalRepository();
    const goalRepo = new InMemoryGoalRepository();
    const campaignRepo = new InMemoryCampaignRepository();
    const saleRepo = new InMemorySaleRepository();
    const salespersonRepo = new InMemorySalespersonRepository();

    // Campaign + goal: TOTAL_VALUE > 5000, compensation FIXED 1000 BRL
    const campaign = await new CreateCampaignUseCase(campaignRepo, clock, idGen)
      .execute({ name: "C", description: "d", createdById: "u1" });
    if (!campaign.ok) throw new Error("campaign failed");

    await new CreateGoalUseCase(goalRepo, campaignRepo, clock, idGen).execute({
      campaignId: campaign.value.id,
      name: "Meta",
      validFrom: "2020-01-01",
      validTo: "2030-12-31",
      compensationType: "FIXED",
      compensationValue: 1000,
      compensationCurrency: "BRL",
      conditionTree: {
        logicalOperator: "AND",
        conditions: [{ field: "TOTAL_VALUE", operator: "GT", value: 5000 }],
        children: [],
      },
    });

    // sp-1 has sale of 6000 (meets condition), sp-2 has sale of 3000 (doesn't)
    const sp1Result = Salesperson.create({ id: "sp-1", name: "Alice", document: "111" });
    const sp2Result = Salesperson.create({ id: "sp-2", name: "Bob", document: "222" });
    if (!sp1Result.ok) throw new Error("sp1 failed");
    if (!sp2Result.ok) throw new Error("sp2 failed");

    salespersonRepo.add(sp1Result.value);
    salespersonRepo.add(sp2Result.value);

    const moneyBig = Money.reconstruct(6000, "BRL");
    const moneySmall = Money.reconstruct(3000, "BRL");
    const now = clock.now();

    const sale1Result = Sale.create({
      id: "sale-1",
      salespersonId: "sp-1",
      productId: "prod-1",
      regionId: "region-1",
      amount: moneyBig,
      soldAt: now,
    });
    const sale2Result = Sale.create({
      id: "sale-2",
      salespersonId: "sp-2",
      productId: "prod-1",
      regionId: "region-1",
      amount: moneySmall,
      soldAt: now,
    });
    if (!sale1Result.ok) throw new Error("sale1 failed");
    if (!sale2Result.ok) throw new Error("sale2 failed");

    saleRepo.add(sale1Result.value);
    saleRepo.add(sale2Result.value);

    // Trigger + process
    const triggered = await new TriggerAppraisalUseCase(appraisalRepo, clock, idGen).execute(null);
    await new ProcessAppraisalUseCase(appraisalRepo, goalRepo, saleRepo, salespersonRepo, clock, new FakeCurrencyConverter())
      .execute(triggered.id);

    const stored = await appraisalRepo.findById(triggered.id);
    expect(stored?.appraisal.status).toBe(AppraisalStatus.DONE);
    expect(stored?.results).toHaveLength(2);

    const sp1Result2 = stored?.results.find((r) => r.salespersonId === "sp-1");
    expect(sp1Result2?.goalMet).toBe(true);
    expect(sp1Result2?.payableAmount.amount.toFixed(2)).toBe("1000.00"); // FIXED compensation

    const sp2Result2 = stored?.results.find((r) => r.salespersonId === "sp-2");
    expect(sp2Result2?.goalMet).toBe(false);
    expect(sp2Result2?.payableAmount.amount.toFixed(2)).toBe("0.00");
  });
});
