import type { Request, Response, NextFunction } from "express";
import type { ITokenIssuer, TokenPayload } from "@/application/ports/token/i-token-issuer.js";

export interface AuthRequest extends Request {
  user: TokenPayload;
}

export function createAuthMiddleware(tokenIssuer: ITokenIssuer) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Cabeçalho de autorização ausente ou inválido" });
      return;
    }
    const payload = tokenIssuer.verify(header.slice(7));
    if (!payload) {
      res.status(401).json({ error: "Token inválido ou expirado" });
      return;
    }
    (req as AuthRequest).user = payload;
    next();
  };
}
