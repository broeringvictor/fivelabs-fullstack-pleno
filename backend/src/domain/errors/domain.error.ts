export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvariantViolation extends DomainError {
  readonly code = "INVARIANT_VIOLATION";

  constructor(message: string) {
    super(message);
  }
}

export class NotFound extends DomainError {
  readonly code = "NOT_FOUND";

  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
  }
}

export class Conflict extends DomainError {
  readonly code = "CONFLICT";

  constructor(message: string) {
    super(message);
  }
}
