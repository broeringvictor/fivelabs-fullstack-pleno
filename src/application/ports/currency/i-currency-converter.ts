import type { Decimal } from "decimal.js";

export interface ICurrencyConverter {
  convert(amount: Decimal, from: string, to: string): Promise<Decimal>;
}
