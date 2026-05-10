export interface TokenPayload {
  sub: string;
  name: string;
  role: string;
}

export interface ITokenIssuer {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload | null;
}
