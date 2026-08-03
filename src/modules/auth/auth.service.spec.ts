import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('can be constructed with an AuthRepository', () => {
    const service = new AuthService(new AuthRepository());

    expect(service).toBeInstanceOf(AuthService);
  });
});
