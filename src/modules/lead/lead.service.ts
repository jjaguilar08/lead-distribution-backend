import { LeadRepository } from './lead.repository';

/**
 * All lead business logic will live here. Depends on LeadRepository via
 * constructor injection so it stays unit-testable with a mocked repository.
 * Stub for Day 1; implemented alongside lead CRUD on Day 2.
 */
export class LeadService {
  constructor(private readonly leadRepository: LeadRepository) {}
}
