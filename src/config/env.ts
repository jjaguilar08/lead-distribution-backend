import 'dotenv/config';

/**
 * Reads a required environment variable, throwing at startup if it is
 * missing so misconfiguration fails fast instead of surfacing later.
 * @param name - the environment variable name to read.
 * @returns the environment variable's value.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const ENV = {
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '1d',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
};
