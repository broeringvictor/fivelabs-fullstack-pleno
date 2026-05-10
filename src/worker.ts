import { prisma } from "@/infra/database/client.js";
import { PrismaAppraisalRepository } from "@/infra/repositories/prisma-appraisal.repository.js";
import { PrismaGoalRepository } from "@/infra/repositories/prisma-goal.repository.js";
import { PrismaSaleRepository } from "@/infra/repositories/prisma-sale.repository.js";
import { PrismaSalespersonRepository } from "@/infra/repositories/prisma-salesperson.repository.js";
import { SystemClock } from "@/infra/service/clock/system-clock.js";
import { ProcessAppraisalUseCase } from "@/application/use-cases/appraisal/process-appraisal/process-appraisal.use-case.js";
import { FakeCurrencyConverter } from "@/application/__tests__/fakes/fake-currency-converter.js";
import { AppraisalPoller } from "@/infra/poller/appraisal.poller.js";

const appraisalRepo   = new PrismaAppraisalRepository(prisma);
const goalRepo        = new PrismaGoalRepository(prisma);
const saleRepo        = new PrismaSaleRepository(prisma);
const salespersonRepo = new PrismaSalespersonRepository(prisma);
const clock           = new SystemClock();
const currencyConverter = new FakeCurrencyConverter();

const processAppraisal = new ProcessAppraisalUseCase(
  appraisalRepo,
  goalRepo,
  saleRepo,
  salespersonRepo,
  clock,
  currencyConverter,
);

const poller = new AppraisalPoller(appraisalRepo, processAppraisal);
poller.start();
console.log("[worker] AppraisalPoller iniciado");

process.on("SIGTERM", () => { poller.stop(); prisma.$disconnect(); });
process.on("SIGINT",  () => { poller.stop(); prisma.$disconnect(); });
