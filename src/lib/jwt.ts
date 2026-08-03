import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export interface JwtPayload {
  sub: number;
  email: string;
}

/**
 * Signs a JWT for the given payload using the app's configured secret and
 * expiry.
 * @param payload - the claims to embed in the token.
 * @returns a signed JWT string.
 */
export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

/**
 * Verifies a JWT and returns its decoded payload.
 * @param token - the JWT string to verify.
 * @returns the decoded payload if the token is valid.
 * @throws {Error} if the token is missing, expired, or has an invalid signature.
 */
export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, ENV.JWT_SECRET) as unknown as JwtPayload;
}
