import { z } from 'zod';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const WORKING_DAYS_PATTERN = /^[1-7](,[1-7])*$/;

/** Validates the request body for POST /api/brokers. */
export const createBrokerSchema = z.object({
  name: z.string().min(1),
  isActive: z.boolean().optional(),
  dailyCap: z.number().int().positive(),
  timezone: z.string().min(1),
  openTime: z.string().regex(TIME_PATTERN, 'must be in HH:mm format'),
  closeTime: z.string().regex(TIME_PATTERN, 'must be in HH:mm format'),
  workingDays: z.string().regex(WORKING_DAYS_PATTERN, 'must be comma-separated weekday numbers 1-7, e.g. "1,2,3,4,5"'),
});

/** Validates the request body for PATCH /api/brokers/:id — every field is optional. */
export const updateBrokerSchema = createBrokerSchema.partial();
