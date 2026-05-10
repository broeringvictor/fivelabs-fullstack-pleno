import { PrismaClient } from "../generated/prisma/index.js";
import Decimal from "decimal.js";

const prisma = new PrismaClient();

async function main() {
  // Regions
  await Promise.all([
    prisma.region.upsert({
      where: { id: "r-sudeste" },
      create: { id: "r-sudeste", name: "Sudeste" },
      update: {},
    }),
    prisma.region.upsert({
      where: { id: "r-sul" },
      create: { id: "r-sul", name: "Sul" },
      update: {},
    }),
    prisma.region.upsert({
      where: { id: "r-norte" },
      create: { id: "r-norte", name: "Norte" },
      update: {},
    }),
  ]);

  // Products
  await Promise.all([
    prisma.product.upsert({
      where: { sku: "REMUNERA-PRO" },
      create: { id: "p-1", name: "Remunera.ai Pro", sku: "REMUNERA-PRO" },
      update: {},
    }),
    prisma.product.upsert({
      where: { sku: "REMUNERA-LITE" },
      create: { id: "p-2", name: "Remunera.ai Lite", sku: "REMUNERA-LITE" },
      update: {},
    }),
  ]);

  // Salespersons
  await Promise.all([
    prisma.salesperson.upsert({
      where: { document: "111.111.111-11" },
      create: { id: "sp-1", name: "Ana Lima", document: "111.111.111-11" },
      update: {},
    }),
    prisma.salesperson.upsert({
      where: { document: "222.222.222-22" },
      create: { id: "sp-2", name: "Bruno Melo", document: "222.222.222-22" },
      update: {},
    }),
    prisma.salesperson.upsert({
      where: { document: "333.333.333-33" },
      create: { id: "sp-3", name: "Carla Souza", document: "333.333.333-33" },
      update: {},
    }),
  ]);

  // Sales (varied amounts to demonstrate condition matching)
  const sales = [
    {
      id: "sale-1",
      salespersonId: "sp-1",
      productId: "p-1",
      regionId: "r-sudeste",
      amount: new Decimal("1200000.00"),
      soldAt: new Date("2024-03-15"),
    },
    {
      id: "sale-2",
      salespersonId: "sp-1",
      productId: "p-2",
      regionId: "r-sudeste",
      amount: new Decimal("300000.00"),
      soldAt: new Date("2024-06-20"),
    },
    {
      id: "sale-3",
      salespersonId: "sp-2",
      productId: "p-1",
      regionId: "r-sul",
      amount: new Decimal("850000.00"),
      soldAt: new Date("2024-04-10"),
    },
    {
      id: "sale-4",
      salespersonId: "sp-2",
      productId: "p-1",
      regionId: "r-sul",
      amount: new Decimal("200000.00"),
      soldAt: new Date("2024-07-05"),
    },
    {
      id: "sale-5",
      salespersonId: "sp-3",
      productId: "p-2",
      regionId: "r-norte",
      amount: new Decimal("400000.00"),
      soldAt: new Date("2024-05-01"),
    },
  ];

  for (const s of sales) {
    await prisma.sale.upsert({
      where: { id: s.id },
      create: { ...s, currency: "BRL" },
      update: {},
    });
  }

  console.log("Seed concluído:", {
    regions: 3,
    products: 2,
    salespersons: 3,
    sales: sales.length,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
