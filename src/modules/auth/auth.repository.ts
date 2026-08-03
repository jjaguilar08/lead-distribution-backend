import { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';

/** All Prisma access for the auth module lives here — no business logic. */
export class AuthRepository {
  /**
   * Finds a user by their email address.
   * @param email - the email to look up.
   * @returns the matching user, or null if none exists.
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }
}
