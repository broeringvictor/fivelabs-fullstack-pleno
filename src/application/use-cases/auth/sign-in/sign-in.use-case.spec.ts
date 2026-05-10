import { describe, it, expect } from "vitest";
import { SignInUseCase } from "./sign-in.use-case.js";
import { SignUpUseCase } from "../sign-up/sign-up.use-case.js";
import { InMemoryUserRepository } from "@/application/__tests__/fakes/in-memory-user.repository.js";
import { FakeHasher } from "@/application/__tests__/fakes/fake-hasher.js";
import { FakeTokenIssuer } from "@/application/__tests__/fakes/fake-token-issuer.js";
import { FakeClock } from "@/application/__tests__/fakes/fake-clock.js";

async function makeWithUser() {
  const userRepo = new InMemoryUserRepository();
  const hasher = new FakeHasher();
  const tokenIssuer = new FakeTokenIssuer();
  const clock = new FakeClock();

  await new SignUpUseCase(userRepo, hasher, tokenIssuer, clock).execute({
    name: "Alice",
    email: "alice@example.com",
    password: "secret123",
  });

  return { signIn: new SignInUseCase(userRepo, hasher, tokenIssuer) };
}

describe("SignInUseCase", () => {
  it("retorna token para credenciais válidas", async () => {
    const { signIn } = await makeWithUser();
    const result = await signIn.execute({ email: "alice@example.com", password: "secret123" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.token).toBeTruthy();
    expect(result.value.user.email).toBe("alice@example.com");
  });

  it("rejeita senha errada com INVARIANT_VIOLATION", async () => {
    const { signIn } = await makeWithUser();
    const result = await signIn.execute({ email: "alice@example.com", password: "wrongpass" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVARIANT_VIOLATION");
  });

  it("rejeita e-mail desconhecido com NOT_FOUND", async () => {
    const { signIn } = await makeWithUser();
    const result = await signIn.execute({ email: "nobody@example.com", password: "secret123" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_FOUND");
  });
});
