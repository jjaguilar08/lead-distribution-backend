import { PrismaClient } from '@prisma/client';

/**
 * Shared PrismaClient singleton. Repositories are the only layer allowed to
 * import this — services depend on repositories via constructor injection
 * instead, so they stay unit-testable without a database.
 */
export const prisma = new PrismaClient();
