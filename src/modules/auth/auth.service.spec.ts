import bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { AuthRepository } from './auth.repository';
import { AuthService, InvalidCredentialsError } from './auth.service';

describe('AuthService', () => {
  const email = 'admin@example.com';
  const password = 'correct-password';
  let hashedPassword: string;
  let authRepository: jest.Mocked<AuthRepository>;
  let authService: AuthService;

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash(password, 4);
  });

  beforeEach(() => {
    authRepository = {
      findUserByEmail: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;
    authService = new AuthService(authRepository);
  });

  const buildUser = (): User => ({
    id: 1,
    email,
    passwordHash: hashedPassword,
    createdAt: new Date(),
  });

  it('returns a token and the public user when credentials are valid', async () => {
    authRepository.findUserByEmail.mockResolvedValue(buildUser());

    const result = await authService.login({ email, password });

    expect(authRepository.findUserByEmail).toHaveBeenCalledWith(email);
    expect(result.user).toEqual({ id: 1, email });
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(0);
  });

  it('throws InvalidCredentialsError when no user matches the email', async () => {
    authRepository.findUserByEmail.mockResolvedValue(null);

    await expect(authService.login({ email, password })).rejects.toThrow(InvalidCredentialsError);
  });

  it('throws InvalidCredentialsError when the password does not match', async () => {
    authRepository.findUserByEmail.mockResolvedValue(buildUser());

    await expect(authService.login({ email, password: 'wrong-password' })).rejects.toThrow(
      InvalidCredentialsError,
    );
  });
});
