import { Form } from '@prisma/client';
import { FormRepository } from './form.repository';
import { CreateFormDto } from './form.types';

/** Thrown when creating a form but one already exists — only one form is ever allowed. */
export class FormAlreadyExistsError extends Error {
  constructor() {
    super('A form already exists');
    this.name = 'FormAlreadyExistsError';
  }
}

/** All form business logic. Depends on FormRepository via constructor injection for testability. */
export class FormService {
  constructor(private readonly formRepository: FormRepository) {}

  /**
   * Returns the single form, if one has been created.
   * @returns the form, or null if none exists yet.
   */
  async getForm(): Promise<Form | null> {
    return this.formRepository.findFirst();
  }

  /**
   * Creates the form. Only one form is ever allowed to exist.
   * @param dto - the name and slug for the new form.
   * @returns the created form.
   * @throws {FormAlreadyExistsError} if a form already exists.
   */
  async create(dto: CreateFormDto): Promise<Form> {
    const existing = await this.formRepository.findFirst();
    if (existing) {
      throw new FormAlreadyExistsError();
    }
    return this.formRepository.create({ name: dto.name, slug: dto.slug });
  }

  /**
   * Returns the form matching a given slug, for the public lead page to
   * confirm the slug is real before rendering.
   * @param slug - the slug to look up.
   * @returns the matching form, or null if none exists.
   */
  async getBySlug(slug: string): Promise<Form | null> {
    return this.formRepository.findBySlug(slug);
  }
}
