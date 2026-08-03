import { AuthService } from './auth.service';

/**
 * Parses req/res for the auth module and delegates to AuthService.
 * No business logic here. Stub for Day 1; handlers land alongside the login endpoint.
 */
export class AuthController {
  constructor(private readonly authService: AuthService) {}
}
