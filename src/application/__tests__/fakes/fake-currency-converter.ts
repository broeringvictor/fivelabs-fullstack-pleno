import type { ICurrencyConverter } from "@/application/ports/currency/i-currency-converter.js";
import { Decimal } from "decimal.js";

export class FakeCurrencyConverter implements ICurrencyConverter {
  async convert(amount: Decimal, from: string, to: string): Promise<Decimal> {
    if (from === to) return amount;
    return amount.mul("0.2"); // fixed BRL→USD rate for tests
  }
}
