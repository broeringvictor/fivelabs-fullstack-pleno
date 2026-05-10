import { prisma, disconnect } from "../src/infra/database/client.js";
import { User } from "../src/domain/entities/user.js";
import { Campaign } from "../src/domain/entities/campaign.js";
import { Goal } from "../src/domain/entities/goal.js";
import { ConditionGroup } from "../src/domain/entities/condition-group.js";
import { Condition } from "../src/domain/entities/condition.js";
import { Salesperson } from "../src/domain/entities/salesperson.js";
import { Product } from "../src/domain/entities/product.js";
import { Region } from "../src/domain/entities/region.js";
import { Sale } from "../src/domain/entities/sale.js";
import { Appraisal } from "../src/domain/entities/appraisal.js";
import { buildTree } from "../src/domain/entities/condition-tree.js";
import { Money } from "../src/domain/value-objects/money.js";
import { Period } from "../src/domain/value-objects/period.js";
import { Compensation } from "../src/domain/value-objects/compensation.js";
import { userMapper } from "../src/infra/mappers/user.mapper.js";
import { campaignMapper } from "../src/infra/mappers/campaign.mapper.js";
import { goalMapper } from "../src/infra/mappers/goal.mapper.js";
import { conditionGroupMapper } from "../src/infra/mappers/condition-group.mapper.js";
import { conditionMapper } from "../src/infra/mappers/condition.mapper.js";
import { salespersonMapper } from "../src/infra/mappers/salesperson.mapper.js";
import { productMapper } from "../src/infra/mappers/product.mapper.js";
import { regionMapper } from "../src/infra/mappers/region.mapper.js";
import { saleMapper } from "../src/infra/mappers/sale.mapper.js";
import { appraisalMapper } from "../src/infra/mappers/appraisal.mapper.js";

function must<T>(result: { ok: true; value: T } | { ok: false; error: unknown }, label: string): T {
  if (!result.ok) throw new Error(`${label} failed: ${String(result.error)}`);
  return result.value;
}

function uid(): string {
  return crypto.randomUUID();
}

async function run(): Promise<void> {
  console.log("▶ Smoke test start");

  // 1. User
  const user = must(
    User.create({ id: uid(), name: "Admin", email: `admin+${Date.now()}@example.com`, passwordHash: "hash", role: "ADMIN" }),
    "User.create",
  );
  await prisma.user.create({ data: userMapper.toPersistence(user) });
  console.log("✓ User:", user.id.slice(0, 8));

  // 2. Salesperson, Product, Regions (before conditions so we can use IDs in condition values)
  const sp = must(Salesperson.create({ id: uid(), name: "João Silva", document: `DOC-${Date.now()}` }), "Salesperson.create");
  await prisma.salesperson.create({ data: salespersonMapper.toPersistence(sp) });

  const product = must(Product.create({ id: uid(), name: "Widget", sku: `SKU-${Date.now()}` }), "Product.create");
  await prisma.product.create({ data: productMapper.toPersistence(product) });

  const regionSP = must(Region.create({ id: uid(), name: "SP" }), "Region(SP)");
  const regionRJ = must(Region.create({ id: uid(), name: "RJ" }), "Region(RJ)");
  const regionMG = must(Region.create({ id: uid(), name: "MG" }), "Region(MG)");
  await prisma.region.createMany({ data: [regionMapper.toPersistence(regionSP), regionMapper.toPersistence(regionRJ), regionMapper.toPersistence(regionMG)] });
  console.log("✓ Salesperson, Product, Regions created");

  // 3. Campaign + Goal
  const campaign = must(
    Campaign.create({ id: uid(), name: "Q1 2025", description: "First quarter", createdById: user.id }),
    "Campaign.create",
  );
  await prisma.campaign.create({ data: campaignMapper.toPersistence(campaign) });

  const period = must(Period.create(new Date("2025-01-01"), new Date("2025-12-31")), "Period.create");
  const compensation = must(Compensation.create("FIXED", "500.00", "BRL"), "Compensation.create");
  const goal = must(
    Goal.create({ id: uid(), campaignId: campaign.id, name: "Revenue Goal", period, compensation }),
    "Goal.create",
  );
  await prisma.goal.create({ data: goalMapper.toPersistence(goal) });
  console.log("✓ Campaign:", campaign.id.slice(0, 8), "/ Goal:", goal.id.slice(0, 8));

  // 4. ConditionTree: (TOTAL_VALUE > 1000) AND (REGION IN [SP_id, RJ_id])
  const rootGroup = must(
    ConditionGroup.create({ id: uid(), goalId: goal.id, parentGroupId: null, logicalOperator: "AND" }),
    "ConditionGroup.create",
  );
  await prisma.conditionGroup.create({ data: conditionGroupMapper.toPersistence(rootGroup) });

  const condValue = must(
    Condition.create({ id: uid(), groupId: rootGroup.id, field: "TOTAL_VALUE", operator: "GT", rawValue: 1000 }),
    "Condition(GT 1000)",
  );
  await prisma.condition.create({ data: conditionMapper.toPersistence(condValue) });

  // Use actual region IDs so ConditionTree can match against SaleSnapshot.regionId
  const condRegion = must(
    Condition.create({ id: uid(), groupId: rootGroup.id, field: "REGION", operator: "IN", rawValue: [regionSP.id, regionRJ.id] }),
    "Condition(REGION IN SP,RJ)",
  );
  await prisma.condition.create({ data: conditionMapper.toPersistence(condRegion) });
  console.log("✓ ConditionTree: (TOTAL_VALUE > 1000) AND (REGION IN [SP, RJ])");

  // 5. 3 Sales: sale1=match, sale2=low value, sale3=wrong region
  const sale1 = must(Sale.create({ id: uid(), salespersonId: sp.id, productId: product.id, regionId: regionSP.id, amount: must(Money.create("1500.00"), "Money"), soldAt: new Date("2025-06-01") }), "Sale1");
  const sale2 = must(Sale.create({ id: uid(), salespersonId: sp.id, productId: product.id, regionId: regionSP.id, amount: must(Money.create("500.00"), "Money"), soldAt: new Date("2025-06-02") }), "Sale2");
  const sale3 = must(Sale.create({ id: uid(), salespersonId: sp.id, productId: product.id, regionId: regionMG.id, amount: must(Money.create("1500.00"), "Money"), soldAt: new Date("2025-06-03") }), "Sale3");
  await prisma.sale.create({ data: saleMapper.toPersistence(sale1) });
  await prisma.sale.create({ data: saleMapper.toPersistence(sale2) });
  await prisma.sale.create({ data: saleMapper.toPersistence(sale3) });
  console.log("✓ 3 Sales created");

  // 6. Appraisal (PENDING)
  const appraisal = must(Appraisal.create({ id: uid(), triggeredById: user.id }), "Appraisal.create");
  await prisma.appraisal.create({ data: appraisalMapper.toPersistence(appraisal) });
  console.log("✓ Appraisal:", appraisal.id.slice(0, 8), "status=PENDING");

  // 7. Read back and verify ConditionTree
  const [dbGroups, dbConditions] = await Promise.all([
    prisma.conditionGroup.findMany({ where: { goalId: goal.id } }),
    prisma.condition.findMany({ where: { group: { goalId: goal.id } } }),
  ]);
  const tree = buildTree(
    dbGroups.map((g) => conditionGroupMapper.toDomain(g)),
    dbConditions.map((c) => conditionMapper.toDomain(c)),
  );

  const snapshots = [
    { label: "sale1 (1500 SP) expect=true",  snap: { salespersonId: sp.id, productId: product.id, regionId: regionSP.id, amount: "1500.00" } },
    { label: "sale2 (500 SP)  expect=false", snap: { salespersonId: sp.id, productId: product.id, regionId: regionSP.id, amount: "500.00" } },
    { label: "sale3 (1500 MG) expect=false", snap: { salespersonId: sp.id, productId: product.id, regionId: regionMG.id, amount: "1500.00" } },
  ] as const;

  console.log("\n▶ ConditionTree evaluation:");
  const expected = [true, false, false];
  for (let i = 0; i < snapshots.length; i++) {
    const { label, snap } = snapshots[i]!;
    const actual = tree.matches(snap);
    const ok = actual === expected[i];
    console.log(`  ${ok ? "✓" : "✗"} ${label} → got=${actual}`);
    if (!ok) throw new Error(`Mismatch on ${label}: expected ${String(expected[i])}, got ${actual}`);
  }

  console.log("\n✅ Smoke test passed — all entities/mappers/migration consistent");
}

run()
  .catch((e) => { console.error("\n❌ Smoke test failed:", e); process.exit(1); })
  .finally(() => disconnect());
