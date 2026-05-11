import { prisma } from "../src/infra/database/client.ts";
import Decimal from "decimal.js";
import { faker } from "@faker-js/faker";
import { v7 as uuid7 } from "uuid";


faker.seed(12345);

// Configuráveis via env
const NUM_SALESPERSONS = Number(process.env.SEED_SALESPERSONS) || 10;
const NUM_PRODUCTS = Number(process.env.SEED_PRODUCTS) || 10;
const NUM_REGIONS = Number(process.env.SEED_REGIONS) || 5;
const NUM_CAMPAIGNS = Number(process.env.SEED_CAMPAIGNS) || 6;
const GOALS_PER_CAMPAIGN = Number(process.env.SEED_GOALS_PER_CAMPAIGN) || 3; // => ~18 goals
const SALES_PER_SALESPERSON = Number(process.env.SEED_SALES_PER_SALESPERSON) || 10; // => ~100 sales

async function createRegions(): Promise<{ id: string; name: string }[]> {
  const names = ["Sudeste", "Sul", "Norte", "Nordeste", "Centro-Oeste"].slice(0, NUM_REGIONS);
  const created: { id: string; name: string }[] = [];
  for (const name of names) {
    const id = uuid7();
    const row = await prisma.region.upsert({
      where: { id },
      create: { id, name },
      update: { name },
    });
    created.push({ id: row.id, name: row.name });
  }
  return created;
}

async function createProducts(): Promise<{ id: string; sku: string }[]> {
  const prods: { id: string; sku: string }[] = [];
  for (let i = 0; i < NUM_PRODUCTS; i++) {
    const id = uuid7();
    const sku = `SKU-${String(i + 1).padStart(3, "0")}`;
    const name = faker.commerce.productName();
    const row = await prisma.product.upsert({
      where: { sku },
      create: { id, name, sku },
      update: { name },
    });
    prods.push({ id: row.id, sku: row.sku });
  }
  return prods;
}

async function createUsers(): Promise<{ id: string }[]> {
  const out: { id: string }[] = [];
  // create a few users (admins/managers)
  const roles = ["ADMIN", "MANAGER", "VIEWER"] as const;
  for (let i = 0; i < 4; i++) {
    const id = uuid7();
    const email = `user${i + 1}@example.com`;
    const name = faker.person.fullName();
    const passwordHash = faker.internet.password();
    const role = roles[i % roles.length];
    const row = await prisma.user.upsert({
      where: { email },
      create: { id, name, email, passwordHash, role },
      update: { name, passwordHash, role },
    });
    out.push({ id: row.id });
  }
  return out;
}

async function createSalespersons(): Promise<{ id: string; document: string }[]> {
  const out: { id: string; document: string }[] = [];
  for (let i = 0; i < NUM_SALESPERSONS; i++) {
    const id = uuid7();
    const name = faker.person.fullName();
    // make a CPF-like string (not real)
    const document = faker.string.numeric({ length: 11 });
    const formatted = `${document.slice(0, 3)}.${document.slice(3, 6)}.${document.slice(6, 9)}-${document.slice(9)}`;
    const row = await prisma.salesperson.upsert({
      where: { document: formatted },
      create: { id, name, document: formatted },
      update: { name },
    });
    out.push({ id: row.id, document: row.document });
  }
  return out;
}

async function createCampaignsAndGoals(userIds: string[]): Promise<{ id: string; goals: { id: string; validFrom: Date; validTo: Date; compensationType: string; compensationValue: Decimal }[] }[]> {
  const campaignsOut: { id: string; goals: any[] }[] = [];
  for (let i = 0; i < NUM_CAMPAIGNS; i++) {
    const id = uuid7();
    const name = `${faker.company.name()} Campaign ${i + 1}`;
    const description = faker.lorem.paragraph();
    const createdById = userIds[i % userIds.length];
    const camp = await prisma.campaign.create({ data: { id, name, description, createdById } });

    const goals: any[] = [];
    for (let g = 0; g < GOALS_PER_CAMPAIGN; g++) {
      const gid = uuid7();
      const now = new Date();
      const start = new Date(now.getTime() - faker.number.int({ min: 0, max: 100 }) * 24 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + (30 + faker.number.int({ min: 0, max: 90 })) * 24 * 60 * 60 * 1000);
      const compType = faker.helpers.arrayElement(["FIXED", "PERCENTAGE"]);
      const compValue = compType === "FIXED" ? new Decimal(faker.finance.amount({ min: 1000, max: 50000, dec: 2 })) : new Decimal(faker.number.int({ min: 5, max: 50 }));
      const compCurrency = "BRL";
      await prisma.goal.create({ data: {
        id: gid,
        campaignId: camp.id,
        name: `Goal ${i + 1}-${g + 1}`,
        validFrom: start,
        validTo: end,
        compensationType: compType,
        compensationValue: compValue.toFixed(4),
        compensationCurrency: compCurrency,
      }});
      goals.push({ id: gid, validFrom: start, validTo: end, compensationType: compType, compensationValue: compValue });
    }

    campaignsOut.push({ id: camp.id, goals });
  }
  return campaignsOut;
}

async function createConditionGroupsAndConditions(campaignsAndGoals: any[]) {
  // For each goal create a root group and some conditions
  for (const camp of campaignsAndGoals) {
    for (const goal of camp.goals) {
      const rootGroupId = uuid7();
      await prisma.conditionGroup.create({ data: { id: rootGroupId, goalId: goal.id, parentGroupId: null, logicalOperator: "AND" } });
      // create a few conditions: product IN, region IN, total_value GT
      const conds = [
        { field: "PRODUCT", operator: "IN", value: [faker.helpers.arrayElement(await getProductIds(3))] },
        { field: "REGION", operator: "IN", value: [faker.helpers.arrayElement(await getRegionIds(3))] },
        { field: "TOTAL_VALUE", operator: "GT", value: faker.number.int({ min: 10000, max: 1000000 }) },
      ];
      for (const c of conds) {
        await prisma.condition.create({ data: { id: uuid7(), groupId: rootGroupId, field: c.field, operator: c.operator, value: c.value } });
      }
    }
  }
}

async function getProductIds(limit = 10): Promise<string[]> {
  const rows: any[] = await prisma.product.findMany({ take: limit });
  return rows.map((r: any) => r.id);
}

async function getRegionIds(limit = 10): Promise<string[]> {
  const rows: any[] = await prisma.region.findMany({ take: limit });
  return rows.map((r: any) => r.id);
}

async function createSales(salespersons: { id: string }[], products: { id: string }[], regions: { id: string }[]) {
  const allSales = [] as any[];
  for (const sp of salespersons) {
    for (let i = 0; i < SALES_PER_SALESPERSON; i++) {
      const id = uuid7();
      const product = faker.helpers.arrayElement(products);
      const region = faker.helpers.arrayElement(regions);
      const amount = new Decimal(faker.finance.amount({ min: 100, max: 2_000_000, dec: 2 }));
      const soldAt = faker.date.between({ from: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), to: new Date() });
      allSales.push({ id, salespersonId: sp.id, productId: product.id, regionId: region.id, amount: amount.toFixed(2), currency: "BRL", soldAt });
    }
  }

  // insert in batches
  const batchSize = 50;
  for (let i = 0; i < allSales.length; i += batchSize) {
    const chunk = allSales.slice(i, i + batchSize);
    await prisma.sale.createMany({ data: chunk, skipDuplicates: true });
  }

  return allSales.length;
}

async function createAppraisalsAndResults(goals: any[], salespersons: { id: string }[]) {
  // create a few appraisals and for each create appraisalResults for subset of goals/salespersons
  const NUM_APPRAISALS = 6;
  for (let a = 0; a < NUM_APPRAISALS; a++) {
    const appraisalId = uuid7();
    const triggeredById = (await prisma.user.findFirst())?.id ?? null;
    await prisma.appraisal.create({ data: { id: appraisalId, triggeredById } });

    // for each goal pick random subset of salespersons
    for (const goal of goals) {
      const count = Math.max(1, Math.floor(salespersons.length / 3));
      const sampleSalespersons: any[] = faker.helpers.arrayElements(salespersons, count) as any[];
      for (const sp of sampleSalespersons) {
        const achieved = new Decimal(faker.finance.amount({ min: 0, max: 2_000_000, dec: 2 }));
        const goalMet = faker.datatype.boolean();
        const payable = goalMet ? (typeof goal.compensationValue === 'object' ? goal.compensationValue : new Decimal(goal.compensationValue || 0)).toFixed(2) : new Decimal(0).toFixed(2);
        await prisma.appraisalResult.create({ data: {
          id: uuid7(),
          appraisalId,
          goalId: goal.id,
          salespersonId: sp.id,
          achievedValue: achieved.toFixed(2),
          achievedCurrency: "BRL",
          goalMet,
          payableAmount: payable,
          payableCurrency: "BRL",
          evaluatedAt: new Date(),
        }});
      }
    }

    // mark appraisal done
    await prisma.appraisal.update({ where: { id: appraisalId }, data: { status: "DONE", finishedAt: new Date() } });
  }
}

async function main() {
  console.log("Seed starting...");

  // create regions
  const regions = await createRegions();
  console.log(`regions: ${regions.length}`);

  // create products
  const products = await createProducts();
  console.log(`products: ${products.length}`);

  // create users
  const users = await createUsers();
  console.log(`users: ${users.length}`);

  // create salespersons
  const salespersons = await createSalespersons();
  console.log(`salespersons: ${salespersons.length}`);

  // campaigns and goals
  const campaigns = await createCampaignsAndGoals(users.map(u => u.id));
  console.log(`campaigns: ${campaigns.length}`);

  // create simple condition groups/conditions for goals
  await createConditionGroupsAndConditions(campaigns);
  console.log(`conditions created`);

  // create sales
  const salesInserted = await createSales(salespersons, products, regions);
  console.log(`sales inserted: ${salesInserted}`);

  // collect all goals
  const allGoals = await prisma.goal.findMany();

  // create appraisals and results
  await createAppraisalsAndResults(allGoals, salespersons);

  console.log("Seed finished");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
