import jwt from "jsonwebtoken";
import type { ITokenIssuer, TokenPayload } from "@/application/ports/token/i-token-issuer.js";

export class JwtTokenIssuer implements ITokenIssuer {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string = "7d",
  ) {}

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn } as jwt.SignOptions);
  }

  verify(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.secret) as TokenPayload;
    } catch {
      return null;
    }
  }
}
