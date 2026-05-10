import type { IUserRepository } from "@/application/ports/repositories/i-user.repository.js";
import type { IHasher } from "@/application/ports/crypto/i-hasher.js";
import type { ITokenIssuer } from "@/application/ports/token/i-token-issuer.js";
import { NotFound, InvariantViolation } from "@/domain/errors/domain.error.js";
import { ok, err, type Result } from "@/application/shared/result.js";
import type { DomainError } from "@/domain/errors/domain.error.js";
import type { SignInRequest } from "./sign-in.request.js";
import type { SignInResponse } from "./sign-in.response.js";

export class SignInUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IHasher,
    private readonly tokenIssuer: ITokenIssuer,
  ) {}

  async execute(req: SignInRequest): Promise<Result<SignInResponse, DomainError>> {
    const user = await this.users.findByEmail(req.email);
    if (!user) return err(new NotFound("Usuário", req.email));

    const valid = await this.hasher.compare(req.password, user.passwordHash);
    if (!valid) return err(new InvariantViolation("Credenciais inválidas"));

    const token = this.tokenIssuer.sign({ sub: user.id, name: user.name, role: user.role });

    return ok({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }
}
