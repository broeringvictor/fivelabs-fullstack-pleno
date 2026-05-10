import type { Request, Response, NextFunction } from "express";
import {
  DomainError,
  NotFound,
  Conflict,
} from "@/domain/errors/domain.error.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof NotFound) {
    res.status(404).json({ error: err.message, code: err.code });
    return;
  }
  if (err instanceof Conflict) {
    res.status(409).json({ error: err.message, code: err.code });
    return;
  }
  if (err instanceof DomainError) {
    res.status(400).json({ error: err.message, code: err.code });
    return;
  }
  console.error("[erro não tratado]", err);
  res.status(500).json({ error: "Erro interno do servidor" });
}
