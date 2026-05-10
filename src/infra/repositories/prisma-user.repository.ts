import type { PrismaClient } from "../../../generated/prisma/client.js";
import type { IUserRepository } from "@/application/ports/repositories/i-user.repository.js";
import { userMapper } from "@/infra/mappers/user.mapper.js";
import type { User } from "@/domain/entities/user.js";

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async save(user: User): Promise<void> {
    await this.db.user.upsert({
      where: { id: user.id },
      create: userMapper.toPersistence(user),
      update: userMapper.toPersistence(user),
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { email } });
    return row ? userMapper.toDomain(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { id } });
    return row ? userMapper.toDomain(row) : null;
  }
}
