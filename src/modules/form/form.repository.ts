import { Form } from '@prisma/client';
import { prisma } from '../../lib/prisma';

/** All Prisma calls for the form module live here — no business logic. */
export class FormRepository {
  /**
   * Returns the single form row, if one has been created.
   * @returns the form, or null if none exists yet.
   */
  async findFirst(): Promise<Form | null> {
    return prisma.form.findFirst();
  }

  /**
   * Finds the form matching a given slug.
   * @param slug - the slug to look up.
   * @returns the matching form, or null if none exists.
   */
  async findBySlug(slug: string): Promise<Form | null> {
    return prisma.form.findUnique({ where: { slug } });
  }

  /**
   * Creates the form row.
   * @param data - the name and slug for the new form.
   * @returns the created form.
   */
  async create(data: { name: string; slug: string }): Promise<Form> {
    return prisma.form.create({ data });
  }
}
