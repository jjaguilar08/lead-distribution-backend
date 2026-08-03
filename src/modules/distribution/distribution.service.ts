import { DistributionRepository } from './distribution.repository';

/**
 * All distribution business logic will live here. Depends on DistributionRepository via
 * constructor injection so it stays unit-testable with a mocked repository.
 * Stub for Day 1; implemented alongside distribution CRUD on Day 2.
 */
export class DistributionService {
  constructor(private readonly distributionRepository: DistributionRepository) {}
}
