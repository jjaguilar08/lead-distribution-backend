import { Distribution, DistributionBroker, Broker } from '@prisma/client';
import { prisma } from '../../lib/prisma';

/** A distribution row with its DistributionBroker rows and each row's broker included. */
export type DistributionWithBrokers = Distribution & {
  brokers: (DistributionBroker & { broker: Broker })[];
};

/** A broker share to write as part of replacing a distribution's full broker set. */
export interface DistributionBrokerInput {
  brokerId: number;
  percentage: number;
  isActive: boolean;
}

/** All Prisma calls for the distribution module live here — no business logic. */
export class DistributionRepository {
  /**
   * Returns the single distribution row, if one has been created.
   * @returns the distribution, or null if none exists yet.
   */
  async findFirst(): Promise<Distribution | null> {
    return prisma.distribution.findFirst();
  }

  /**
   * Returns the single distribution row with its brokers (and each broker's
   * details) included, if one has been created.
   * @returns the distribution with brokers, or null if none exists yet.
   */
  async findFirstWithBrokers(): Promise<DistributionWithBrokers | null> {
    return prisma.distribution.findFirst({
      include: { brokers: { include: { broker: true } } },
    });
  }

  /**
   * Finds a distribution by id, with its brokers (and each broker's details)
   * included.
   * @param id - the distribution id to look up.
   * @returns the matching distribution with brokers, or null if none exists.
   */
  async findByIdWithBrokers(id: number): Promise<DistributionWithBrokers | null> {
    return prisma.distribution.findUnique({
      where: { id },
      include: { brokers: { include: { broker: true } } },
    });
  }

  /**
   * Creates the distribution row, linked to the given form.
   * @param formId - the id of the form to link this distribution to.
   * @returns the created distribution.
   */
  async create(formId: number): Promise<Distribution> {
    return prisma.distribution.create({ data: { formId } });
  }

  /**
   * Replaces the full set of DistributionBroker rows for a distribution in
   * one transaction: deletes the existing rows, then creates the new set.
   * @param distributionId - the distribution whose broker set is being replaced.
   * @param brokers - the full new set of broker shares.
   * @returns the newly created DistributionBroker rows.
   */
  async replaceBrokers(distributionId: number, brokers: DistributionBrokerInput[]): Promise<DistributionBroker[]> {
    return prisma.$transaction(async (tx) => {
      await tx.distributionBroker.deleteMany({ where: { distributionId } });
      if (brokers.length > 0) {
        await tx.distributionBroker.createMany({
          data: brokers.map((b) => ({
            distributionId,
            brokerId: b.brokerId,
            percentage: b.percentage,
            isActive: b.isActive,
          })),
        });
      }
      return tx.distributionBroker.findMany({ where: { distributionId } });
    });
  }
}
