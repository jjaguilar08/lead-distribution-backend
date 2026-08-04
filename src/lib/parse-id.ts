/** Thrown when a route param that should be a numeric id isn't one. */
export class InvalidIdError extends Error {
  constructor(raw: string) {
    super(`Invalid id: ${raw}`);
    this.name = 'InvalidIdError';
  }
}

/**
 * Parses an Express route param into a positive integer id.
 * @param raw - the raw route param value (Express types params as string | string[]).
 * @returns the parsed id.
 * @throws {InvalidIdError} if the value isn't a valid positive integer.
 */
export function parseId(raw: string | string[]): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new InvalidIdError(value ?? '');
  }
  return id;
}
