import type { Salesperson } from "@/domain/entities/salesperson.js";

export interface ISalespersonRepository {
  findAll(): Promise<Salesperson[]>;
}
