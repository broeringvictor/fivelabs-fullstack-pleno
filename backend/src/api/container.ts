import { env } from "./env.js";
import { prisma } from "@/infra/database/client.js";
import { PrismaUserRepository } from "@/infra/repositories/prisma-user.repository.js";
import { PrismaCampaignRepository } from "@/infra/repositories/prisma-campaign.repository.js";
import { PrismaGoalRepository } from "@/infra/repositories/prisma-goal.repository.js";
import { PrismaAppraisalRepository } from "@/infra/repositories/prisma-appraisal.repository.js";
import { PrismaSaleRepository } from "@/infra/repositories/prisma-sale.repository.js";
import { PrismaSalespersonRepository } from "@/infra/repositories/prisma-salesperson.repository.js";
import { BcryptHasher } from "@/infra/service/auth/bcrypt-hasher.js";
import { JwtTokenIssuer } from "@/infra/service/auth/jwt-token-issuer.js";
import { SystemClock } from "@/infra/service/clock/system-clock.js";
import { UuidGenerator } from "@/infra/service/auth/uuid-generator.js";
import { SignUpUseCase } from "@/application/use-cases/auth/sign-up/sign-up.use-case.js";
import { SignInUseCase } from "@/application/use-cases/auth/sign-in/sign-in.use-case.js";
import { CreateCampaignUseCase } from "@/application/use-cases/campaign/create-campaign/create-campaign.use-case.js";
import { ListCampaignsUseCase } from "@/application/use-cases/campaign/list-campaigns/list-campaigns.use-case.js";
import { UpdateCampaignUseCase } from "@/application/use-cases/campaign/update-campaign/update-campaign.use-case.js";
import { CreateGoalUseCase } from "@/application/use-cases/goal/create-goal/create-goal.use-case.js";
import { ListGoalsUseCase } from "@/application/use-cases/goal/list-goals/list-goals.use-case.js";
import { TriggerAppraisalUseCase } from "@/application/use-cases/appraisal/trigger-appraisal/trigger-appraisal.use-case.js";
import { GetAppraisalUseCase } from "@/application/use-cases/appraisal/get-appraisal/get-appraisal.use-case.js";
import { ProcessAppraisalUseCase } from "@/application/use-cases/appraisal/process-appraisal/process-appraisal.use-case.js";
import { FakeCurrencyConverter } from "@/application/__tests__/fakes/fake-currency-converter.js";

// ── infra ─────────────────────────────────────────────────────────────────────
const userRepo        = new PrismaUserRepository(prisma);
const campaignRepo    = new PrismaCampaignRepository(prisma);
const goalRepo        = new PrismaGoalRepository(prisma);
const appraisalRepo   = new PrismaAppraisalRepository(prisma);
const saleRepo        = new PrismaSaleRepository(prisma);
const salespersonRepo = new PrismaSalespersonRepository(prisma);
const hasher          = new BcryptHasher(env.BCRYPT_ROUNDS);
const tokenIssuer     = new JwtTokenIssuer(env.JWT_SECRET, env.JWT_EXPIRES_IN);
const clock           = new SystemClock();
const idGenerator     = new UuidGenerator();
const currencyConverter = new FakeCurrencyConverter();

// ── use cases ─────────────────────────────────────────────────────────────────
export const container = {
  tokenIssuer,
  // auth
  signUpUseCase:           new SignUpUseCase(userRepo, hasher, tokenIssuer, clock, idGenerator),
  signInUseCase:           new SignInUseCase(userRepo, hasher, tokenIssuer),
  // campaign
  createCampaignUseCase:   new CreateCampaignUseCase(campaignRepo, clock, idGenerator),
  listCampaignsUseCase:    new ListCampaignsUseCase(campaignRepo),
  updateCampaignUseCase:   new UpdateCampaignUseCase(campaignRepo, clock),
  // goal
  createGoalUseCase:       new CreateGoalUseCase(goalRepo, campaignRepo, clock, idGenerator),
  listGoalsUseCase:        new ListGoalsUseCase(goalRepo),
  // appraisal
  triggerAppraisalUseCase: new TriggerAppraisalUseCase(appraisalRepo, clock, idGenerator),
  getAppraisalUseCase:     new GetAppraisalUseCase(appraisalRepo),
  processAppraisalUseCase: new ProcessAppraisalUseCase(appraisalRepo, goalRepo, saleRepo, salespersonRepo, clock, currencyConverter),
};

export type Container = typeof container;
