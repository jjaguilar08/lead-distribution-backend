import { BrokerRepository } from './broker.repository';

/**
 * All broker business logic will live here. Depends on BrokerRepository via
 * constructor injection so it stays unit-testable with a mocked repository.
 * Stub for Day 1; implemented alongside broker CRUD on Day 2.
 */
export class BrokerService {
  constructor(private readonly brokerRepository: BrokerRepository) {}
}
