import type { Region } from "@/domain/entities/region.js";

export interface IRegionRepository {
  findAll(): Promise<Region[]>;
}
