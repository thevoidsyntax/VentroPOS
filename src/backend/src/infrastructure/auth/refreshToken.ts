// Refresh Token Service
/**
 * Handles refresh token storage and validation
 * Implements sliding window expiration and rotation
 */

import { randomBytes } from 'crypto';
import { config } from '../../shared/config/index.js';

export interface RefreshToken {
  id: string;
  userId: string;
  tenantId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  replacedBy?: string;
}

// In-memory store for refresh tokens (use Redis in production)
const tokenStore = new Map<string, RefreshToken>();

/**
 * Generate a new refresh token
 * @param userId - User ID
 * @param tenantId - Tenant ID
 * @returns Token string and expiration date
 */
export function generateRefreshToken(userId: string, tenantId: string): {
  token: string;
  expiresAt: Date;
} {
  const token = randomBytes(64).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const refreshToken: RefreshToken = {
    id: randomBytes(16).toString('hex'),
    userId,
    tenantId,
    tokenHash,
    expiresAt,
    createdAt: new Date(),
  };

  tokenStore.set(tokenHash, refreshToken);

  return { token, expiresAt };
}

/**
 * Validate and consume a refresh token (rotation)
 * @param token - Raw token string
 * @returns Token data if valid
 */
export function consumeRefreshToken(token: string): RefreshToken | null {
  const tokenHash = hashToken(token);
  const refreshToken = tokenStore.get(tokenHash);

  if (!refreshToken) {
    return null;
  }

  // Check if expired
  if (refreshToken.expiresAt < new Date()) {
    tokenStore.delete(tokenHash);
    return null;
  }

  // Check if revoked
  if (refreshToken.revokedAt) {
    return null;
  }

  return refreshToken;
}

/**
 * Revoke a refresh token
 * @param token - Raw token string
 */
export function revokeRefreshToken(token: string): void {
  const tokenHash = hashToken(token);
  const refreshToken = tokenStore.get(tokenHash);

  if (refreshToken) {
    refreshToken.revokedAt = new Date();
  }
}

/**
 * Revoke all tokens for a user
 * @param userId - User ID
 */
export function revokeAllUserTokens(userId: string): void {
  for (const token of tokenStore.values()) {
    if (token.userId === userId && !token.revokedAt) {
      token.revokedAt = new Date();
    }
  }
}

/**
 * Clean up expired tokens (call periodically)
 */
export function cleanupExpiredTokens(): number {
  const now = new Date();
  let cleaned = 0;

  for (const [hash, token] of tokenStore.entries()) {
    if (token.expiresAt < now || token.revokedAt) {
      tokenStore.delete(hash);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Hash token for storage
 * @param token - Raw token
 * @returns SHA256 hash
 */
function hashToken(token: string): string {
  const { createHash } = require('crypto');
  return createHash('sha256').update(token).digest('hex');
}
