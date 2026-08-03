import { NextFunction, Request, Response } from 'express';
import { verifyJwt } from '../lib/jwt';

const AUTH_COOKIE_NAME = 'token';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: number; email: string };
    }
  }
}

/**
 * Express middleware that requires a valid JWT in the auth cookie. Attaches
 * the decoded user to `req.user` on success, or responds 401 on failure.
 * @param req - the incoming request.
 * @param res - the outgoing response.
 * @param next - callback to continue to the next middleware/handler.
 * @returns void
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const payload = verifyJwt(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export { AUTH_COOKIE_NAME };
