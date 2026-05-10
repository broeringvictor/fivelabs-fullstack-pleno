import type { IIDGenerator } from "@/application/ports/crypto/i-id-generator.js";

export class FakeIDGenerator implements IIDGenerator {
  private count = 0;
  generate(): string {
    this.count++;
    return `id-${this.count}`;
  }
}
