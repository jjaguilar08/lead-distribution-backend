import bcrypt from 'bcrypt';
import { signJwt } from '../../lib/jwt';
import { AuthRepository } from './auth.repository';
import { LoginRequestDto, LoginResultDto } from './auth.types';

/** Thrown when login credentials don't match a known, active account. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

/** All auth business logic. Depends on AuthRepository via constructor injection for testability. */
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  /**
   * Verifies a user's credentials and issues a JWT on success.
   * @param credentials - the email/password submitted by the client.
   * @returns a signed JWT and the authenticated user's public info.
   * @throws {InvalidCredentialsError} if the email is unknown or the password doesn't match.
   */
  async login(credentials: LoginRequestDto): Promise<LoginResultDto> {
    const user = await this.authRepository.findUserByEmail(credentials.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const token = signJwt({ sub: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email } };
  }
}
