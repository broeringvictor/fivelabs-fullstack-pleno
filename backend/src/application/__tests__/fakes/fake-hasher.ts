import type { IHasher } from "@/application/ports/crypto/i-hasher.js";

export class FakeHasher implements IHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}
