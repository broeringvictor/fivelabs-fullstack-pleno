export abstract class BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  protected constructor(
    id: string,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null = null,
  ) {
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }

  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}

/** Alias para soft-delete. TODO: documentar */
export abstract class SoftDeletableEntity extends BaseEntity {}
