import { z } from 'zod';

/** Validates a single broker share within PUT /api/distribution/brokers's request body. */
const distributionBrokerInputSchema = z.object({
  brokerId: z.number().int().positive(),
  percentage: z.number().nonnegative(),
  isActive: z.boolean(),
});

/** Validates the request body for PUT /api/distribution/brokers. */
export const replaceDistributionBrokersSchema = z.object({
  brokers: z.array(distributionBrokerInputSchema),
});
