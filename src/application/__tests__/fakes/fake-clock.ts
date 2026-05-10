import type { IClock } from "@/application/ports/clock/i-clock.js";

export class FakeClock implements IClock {
  constructor(private fixed: Date = new Date("2026-01-01T00:00:00Z")) {}

  now(): Date {
    return this.fixed;
  }
}
