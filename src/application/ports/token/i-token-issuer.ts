export interface TokenPayload {
  sub: string;
  role: string;
}

export interface ITokenIssuer {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload | null;
}
