import type { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE = 'fh_access_token';
export const REFRESH_TOKEN_COOKIE = 'fh_refresh_token';
const DEFAULT_REFRESH_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

export function buildAuthCookieOptions(
  isProduction: boolean,
  maxAge?: number,
): CookieOptions {
  return {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/',
    ...(isProduction ? { partitioned: true } : {}),
    ...(typeof maxAge === 'number' ? { maxAge } : {}),
  };
}

export function buildAccessTokenCookieOptions(
  isProduction: boolean,
  expiresInSeconds?: number,
): CookieOptions {
  const maxAge =
    typeof expiresInSeconds === 'number' ? expiresInSeconds * 1000 : undefined;
  return buildAuthCookieOptions(isProduction, maxAge);
}

export function buildRefreshTokenCookieOptions(
  isProduction: boolean,
): CookieOptions {
  return buildAuthCookieOptions(isProduction, DEFAULT_REFRESH_MAX_AGE_MS);
}

export function parseCookieHeader(
  cookieHeader: string | undefined,
): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .reduce<Record<string, string>>((accumulator, entry) => {
      const separatorIndex = entry.indexOf('=');
      if (separatorIndex <= 0) {
        return accumulator;
      }

      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
}
