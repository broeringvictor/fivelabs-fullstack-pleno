import type { IIDGenerator } from "@/application/ports/crypto/i-id-generator.js";

export class UuidGenerator implements IIDGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}
