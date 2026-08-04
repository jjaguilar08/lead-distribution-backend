import { Broker, Lead, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

/** A lead row joined with the form it was submitted through. */
export type LeadWithForm = Lead & { form: { name: string } };

/** All Prisma calls for the broker module live here — no business logic. */
export class BrokerRepository {
  /**
   * Returns every broker.
   * @returns all brokers.
   */
  async findAll(): Promise<Broker[]> {
    return prisma.broker.findMany();
  }

  /**
   * Finds a broker by id.
   * @param id - the broker id to look up.
   * @returns the matching broker, or null if none exists.
   */
  async findById(id: number): Promise<Broker | null> {
    return prisma.broker.findUnique({ where: { id } });
  }

  /**
   * Creates a new broker.
   * @param data - the fields for the new broker.
   * @returns the created broker.
   */
  async create(data: Prisma.BrokerCreateInput): Promise<Broker> {
    return prisma.broker.create({ data });
  }

  /**
   * Updates an existing broker.
   * @param id - the broker id to update.
   * @param data - the fields to update.
   * @returns the updated broker.
   */
  async update(id: number, data: Prisma.BrokerUpdateInput): Promise<Broker> {
    return prisma.broker.update({ where: { id }, data });
  }

  /**
   * Finds every lead ever assigned to a broker, joined with the form name.
   * @param brokerId - the broker id to look up leads for.
   * @returns the broker's leads, each including its form's name.
   */
  async findLeadsByBrokerId(brokerId: number): Promise<LeadWithForm[]> {
    return prisma.lead.findMany({
      where: { assignedBrokerId: brokerId },
      include: { form: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
