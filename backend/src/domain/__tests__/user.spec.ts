import { describe, it, expect } from "vitest";
import { User } from "../entities/user.js";

describe("User", () => {
  const base = { id: "u1", name: "Alice", email: "alice@example.com", passwordHash: "hash", role: "ADMIN" as const };

  it("creates with valid props", () => {
    expect(User.create(base).ok).toBe(true);
  });

  it("rejects empty name", () => {
    expect(User.create({ ...base, name: "  " }).ok).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(User.create({ ...base, email: "notanemail" }).ok).toBe(false);
  });

  it("reconstruct bypasses validation", () => {
    const now = new Date();
    const u = User.reconstruct({ ...base, createdAt: now, updatedAt: now, deletedAt: null });
    expect(u.id).toBe("u1");
  });
});
