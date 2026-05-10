import type { ITokenIssuer, TokenPayload } from "@/application/ports/token/i-token-issuer.js";

export class FakeTokenIssuer implements ITokenIssuer {
  sign(payload: TokenPayload): string {
    return `token:${payload.sub}:${payload.name}:${payload.role}`;
  }

  verify(token: string): TokenPayload | null {
    const parts = token.split(":");
    if (parts.length !== 4 || parts[0] !== "token") return null;
    return { sub: parts[1]!, name: parts[2]!, role: parts[3]! };
  }
}
