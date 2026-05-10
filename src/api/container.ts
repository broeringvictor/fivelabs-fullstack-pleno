import { env } from "./env.js";
import { prisma } from "@/infra/database/client.js";
import { PrismaUserRepository } from "@/infra/repositories/prisma-user.repository.js";
import { BcryptHasher } from "@/infra/service/auth/bcrypt-hasher.js";
import { JwtTokenIssuer } from "@/infra/service/auth/jwt-token-issuer.js";
import { SystemClock } from "@/infra/service/clock/system-clock.js";
import { UuidGenerator } from "@/infra/service/auth/uuid-generator.js";
import { SignUpUseCase } from "@/application/use-cases/auth/sign-up/sign-up.use-case.js";
import { SignInUseCase } from "@/application/use-cases/auth/sign-in/sign-in.use-case.js";

const userRepo = new PrismaUserRepository(prisma);
const hasher = new BcryptHasher(env.BCRYPT_ROUNDS);
const tokenIssuer = new JwtTokenIssuer(env.JWT_SECRET, env.JWT_EXPIRES_IN);
const clock = new SystemClock();
const idGenerator = new UuidGenerator();

export const container = {
  tokenIssuer,
  signUpUseCase: new SignUpUseCase(userRepo, hasher, tokenIssuer, clock, idGenerator),
  signInUseCase: new SignInUseCase(userRepo, hasher, tokenIssuer),
};

export type Container = typeof container;
