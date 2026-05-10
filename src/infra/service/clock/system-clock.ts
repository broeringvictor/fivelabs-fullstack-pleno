import type { IClock } from "@/application/ports/clock/i-clock.js";

export class SystemClock implements IClock {
  now(): Date {
    return new Date();
  }
}
