import { env } from "./env.js";
import { prisma } from "@/infra/database/client.js";
import { PrismaUserRepository } from "@/infra/repositories/prisma-user.repository.js";
import { BcryptHasher } from "@/infra/service/auth/bcrypt-hasher.js";
import { JwtTokenIssuer } from "@/infra/service/auth/jwt-token-issuer.js";
import { SystemClock } from "@/infra/service/clock/system-clock.js";
import { SignUpUseCase } from "@/application/use-cases/auth/sign-up/sign-up.use-case.js";
import { SignInUseCase } from "@/application/use-cases/auth/sign-in/sign-in.use-case.js";
import { SignUpController } from "@/application/use-cases/auth/sign-up/sign-up.controller.js";
import { SignInController } from "@/application/use-cases/auth/sign-in/sign-in.controller.js";

const userRepo = new PrismaUserRepository(prisma);
const hasher = new BcryptHasher();
const tokenIssuer = new JwtTokenIssuer(env.JWT_SECRET, env.JWT_EXPIRES_IN);
const clock = new SystemClock();

export const container = {
  tokenIssuer,
  signUpController: new SignUpController(
    new SignUpUseCase(userRepo, hasher, tokenIssuer, clock),
  ),
  signInController: new SignInController(
    new SignInUseCase(userRepo, hasher, tokenIssuer),
  ),
};

export type Container = typeof container;
