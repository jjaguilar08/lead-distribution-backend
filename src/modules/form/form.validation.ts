import { z } from 'zod';

const SLUG_PATTERN = /^[a-z0-9-]+$/;

/** Validates the request body for POST /api/form. */
export const createFormSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(SLUG_PATTERN, 'must be lowercase letters, numbers, and hyphens only'),
});
