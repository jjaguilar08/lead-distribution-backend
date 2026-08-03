import { FormRepository } from './form.repository';

/**
 * All form business logic will live here. Depends on FormRepository via
 * constructor injection so it stays unit-testable with a mocked repository.
 * Stub for Day 1; implemented alongside form CRUD on Day 2.
 */
export class FormService {
  constructor(private readonly formRepository: FormRepository) {}
}
