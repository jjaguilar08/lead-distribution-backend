/**
 * Normalizes an Express route param (typed as string | string[]) to a
 * single string, taking the first value if the param repeated.
 * @param raw - the raw route param value.
 * @returns the normalized string value.
 */
export function paramString(raw: string | string[]): string {
  return Array.isArray(raw) ? raw[0] : raw;
}
