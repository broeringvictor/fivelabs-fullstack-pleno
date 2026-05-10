import type { IUserRepository } from "@/application/ports/repositories/i-user.repository.js";
import type { IHasher } from "@/application/ports/crypto/i-hasher.js";
import type { ITokenIssuer } from "@/application/ports/token/i-token-issuer.js";
import type { IClock } from "@/application/ports/clock/i-clock.js";
import type { IIDGenerator } from "@/application/ports/crypto/i-id-generator.js";
import { User } from "@/domain/entities/user.js";
import { Conflict } from "@/domain/errors/domain.error.js";
import { ok, err, type Result } from "@/application/shared/result.js";
import type { DomainError } from "@/domain/errors/domain.error.js";
import type { SignUpRequest } from "./sign-up.request.js";
import type { SignUpResponse } from "./sign-up.response.js";

export class SignUpUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IHasher,
    private readonly tokenIssuer: ITokenIssuer,
    private readonly clock: IClock,
    private readonly idGenerator: IIDGenerator,
  ) {}

  async execute(req: SignUpRequest): Promise<Result<SignUpResponse, DomainError>> {
    const existing = await this.users.findByEmail(req.email);
    if (existing) return err(new Conflict(`E-mail já em uso: ${req.email}`));

    const passwordHash = await this.hasher.hash(req.password);
    const now = this.clock.now();

    const userResult = User.create({
      id: this.idGenerator.generate(),
      name: req.name,
      email: req.email,
      passwordHash,
      role: "VIEWER",
      createdAt: now,
      updatedAt: now,
    });
    if (!userResult.ok) return err(userResult.error);

    await this.users.save(userResult.value);

    const token = this.tokenIssuer.sign({
      sub: userResult.value.id,
      role: userResult.value.role,
    });

    return ok({
      token,
      user: {
        id: userResult.value.id,
        name: userResult.value.name,
        email: userResult.value.email,
        role: userResult.value.role,
      },
    });
  }
}
