import type { IUserRepository } from "@/application/ports/repositories/i-user.repository.js";
import type { User } from "@/domain/entities/user.js";

export class InMemoryUserRepository implements IUserRepository {
  private store = new Map<string, User>();

  async save(user: User): Promise<void> {
    this.store.set(user.id, user);
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  get size(): number {
    return this.store.size;
  }
}
