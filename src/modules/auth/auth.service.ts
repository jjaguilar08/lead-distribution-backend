import { AuthRepository } from './auth.repository';

/**
 * All auth business logic will live here. Depends on AuthRepository via
 * constructor injection so it stays unit-testable with a mocked repository.
 * Stub for Day 1; implemented alongside the login endpoint.
 */
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}
}
