import { Request, Response } from 'express';
import { AUTH_COOKIE_NAME } from '../../middleware/require-auth';
import { AuthService, InvalidCredentialsError } from './auth.service';
import { LoginRequestDto } from './auth.types';

const AUTH_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Parses req/res for the auth module and delegates to AuthService. No business logic here. */
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Handles POST /api/auth/login — verifies credentials and sets the JWT as
   * an httpOnly cookie.
   * @param req - the Express request, expecting a LoginRequestDto body.
   * @param res - the Express response.
   * @returns a promise that resolves once the response has been sent.
   */
  login = async (req: Request, res: Response): Promise<void> => {
    const credentials = req.body as LoginRequestDto;

    try {
      const { token, user } = await this.authService.login(credentials);
      res.cookie(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: AUTH_COOKIE_MAX_AGE_MS,
      });
      res.status(200).json({ user });
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        res.status(401).json({ error: err.message });
        return;
      }
      throw err;
    }
  };

  /**
   * Handles GET /api/auth/me — returns the authenticated user from the
   * request, as attached by requireAuth. Stub for now; not yet backed by a
   * fresh DB lookup.
   * @param req - the Express request, expecting `req.user` to be set.
   * @param res - the Express response.
   * @returns void
   */
  me = (req: Request, res: Response): void => {
    res.status(200).json({ user: req.user });
  };
}
