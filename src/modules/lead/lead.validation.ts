import { z } from 'zod';

/** Validates the request body for POST /api/public/leads/:slug. */
export const submitLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
});

/** Validates the request body for PATCH /api/leads/:id/assign. */
export const assignLeadSchema = z.object({
  brokerId: z.number().int().positive(),
});
