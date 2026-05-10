import { describe, it, expect } from "vitest";
import { SignUpUseCase } from "./sign-up.use-case.js";
import { InMemoryUserRepository } from "@/application/__tests__/fakes/in-memory-user.repository.js";
import { FakeHasher } from "@/application/__tests__/fakes/fake-hasher.js";
import { FakeTokenIssuer } from "@/application/__tests__/fakes/fake-token-issuer.js";
import { FakeClock } from "@/application/__tests__/fakes/fake-clock.js";

const validReq = { name: "Alice", email: "alice@example.com", password: "secret123" };

function make() {
  const userRepo = new InMemoryUserRepository();
  const hasher = new FakeHasher();
  const tokenIssuer = new FakeTokenIssuer();
  const clock = new FakeClock();
  const useCase = new SignUpUseCase(userRepo, hasher, tokenIssuer, clock);
  return { userRepo, useCase };
}

describe("SignUpUseCase", () => {
  it("cria usuário e retorna token + informações", async () => {
    const { useCase, userRepo } = make();
    const result = await useCase.execute(validReq);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.token).toBeTruthy();
    expect(result.value.user.email).toBe("alice@example.com");
    expect(result.value.user.role).toBe("VIEWER");
    expect(userRepo.size).toBe(1);
  });

  it("rejeita e-mail duplicado com CONFLICT", async () => {
    const { useCase } = make();
    await useCase.execute(validReq);
    const second = await useCase.execute(validReq);
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe("CONFLICT");
  });

  it("armazena senha hasheada, não em texto plano", async () => {
    const { useCase, userRepo } = make();
    await useCase.execute(validReq);
    const user = await userRepo.findByEmail(validReq.email);
    expect(user?.passwordHash).toBe("hashed:secret123");
    expect(user?.passwordHash).not.toBe(validReq.password);
  });
});
