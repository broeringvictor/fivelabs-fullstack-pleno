import type { IRegionRepository } from "@/application/ports/repositories/i-region.repository.js";
import type { Region } from "@/domain/entities/region.js";

export class InMemoryRegionRepository implements IRegionRepository {
  private store: Region[] = [];

  add(r: Region): void {
    this.store.push(r);
  }

  async findAll(): Promise<Region[]> {
    return [...this.store].sort((a, b) => a.name.localeCompare(b.name));
  }
}
