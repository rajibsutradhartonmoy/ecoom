export interface JwtPayload {
  sub: string; // User ID
  email: string;
  isSuperAdmin: boolean;
  tenants: Array<{
    tenantId: string;
    role: string;
  }>;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string; // User ID
  tokenId: string; // Refresh token ID for revocation
  iat?: number;
  exp?: number;
}
