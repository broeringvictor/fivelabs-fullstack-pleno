import * as bcrypt from "bcryptjs";
import type { IHasher } from "@/application/ports/crypto/i-hasher.js";

export class BcryptHasher implements IHasher {
  constructor(private readonly rounds = 12) {}

  hash(plain: string): Promise<string> {
    return bcrypt.default.hash(plain, this.rounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.default.compare(plain, hash);
  }
}
