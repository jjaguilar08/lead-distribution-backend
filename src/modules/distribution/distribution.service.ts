import { Distribution, DistributionBroker } from '@prisma/client';
import { FormRepository } from '../form/form.repository';
import { LeadRepository } from '../lead/lead.repository';
import { DistributionRepository } from './distribution.repository';
import {
  DistributionBrokerDetailDto,
  DistributionLeadDto,
  ReplaceDistributionBrokersDto,
} from './distribution.types';

/** Thrown when creating a distribution before any form exists. */
export class NoFormError extends Error {
  constructor() {
    super('Oops, please create a form first.');
    this.name = 'NoFormError';
  }
}

/** Thrown when creating a distribution but one already exists — only one distribution is ever allowed. */
export class DistributionAlreadyExistsError extends Error {
  constructor() {
    super('A distribution already exists');
    this.name = 'DistributionAlreadyExistsError';
  }
}

/** Thrown when no distribution exists yet for an operation that requires one. */
export class DistributionNotFoundError extends Error {
  constructor() {
    super('Distribution not found');
    this.name = 'DistributionNotFoundError';
  }
}

/** Thrown when a broker share's percentage isn't a non-negative number. */
export class InvalidPercentageError extends Error {
  constructor() {
    super('Each broker percentage must be a non-negative number');
    this.name = 'InvalidPercentageError';
  }
}

/** The Distribution Detail page's data source: the distribution, its brokers, and every lead that has passed through it. */
export interface DistributionDetailDto {
  id: number;
  formId: number;
  createdAt: Date;
  brokers: DistributionBrokerDetailDto[];
  leads: DistributionLeadDto[];
}

/** All distribution business logic. Depends on DistributionRepository (plus FormRepository and LeadRepository for cross-domain reads) via constructor injection for testability. */
export class DistributionService {
  constructor(
    private readonly distributionRepository: DistributionRepository,
    private readonly formRepository: FormRepository,
    private readonly leadRepository: LeadRepository,
  ) {}

  /**
   * Returns the single distribution, if one has been created. Only one
   * distribution is ever allowed to exist, so callers don't need an id to
   * look it up.
   * @returns the distribution, or null if none exists yet.
   */
  async getCurrent(): Promise<Distribution | null> {
    return this.distributionRepository.findFirst();
  }

  /**
   * Creates the distribution, auto-linked to the existing form. Only one
   * distribution is ever allowed to exist.
   * @returns the created distribution.
   * @throws {NoFormError} if no form has been created yet.
   * @throws {DistributionAlreadyExistsError} if a distribution already exists.
   */
  async create(): Promise<Distribution> {
    const form = await this.formRepository.findFirst();
    if (!form) {
      throw new NoFormError();
    }

    const existing = await this.distributionRepository.findFirst();
    if (existing) {
      throw new DistributionAlreadyExistsError();
    }

    return this.distributionRepository.create(form.id);
  }

  /**
   * Replaces the full set of DistributionBroker rows for the distribution.
   * @param dto - the full new set of broker shares.
   * @returns the newly created DistributionBroker rows.
   * @throws {DistributionNotFoundError} if no distribution exists yet.
   * @throws {InvalidPercentageError} if any broker's percentage isn't a non-negative number.
   */
  async replaceBrokers(dto: ReplaceDistributionBrokersDto): Promise<DistributionBroker[]> {
    const distribution = await this.distributionRepository.findFirst();
    if (!distribution) {
      throw new DistributionNotFoundError();
    }

    for (const broker of dto.brokers) {
      if (typeof broker.percentage !== 'number' || !Number.isFinite(broker.percentage) || broker.percentage < 0) {
        throw new InvalidPercentageError();
      }
    }

    return this.distributionRepository.replaceBrokers(distribution.id, dto.brokers);
  }

  /**
   * Returns the Distribution Detail page's data: the distribution, its
   * brokers with current percentage/active state, and every lead that has
   * ever passed through it (sent, unsent, duplicate, failed).
   * @param id - the distribution id to look up.
   * @returns the distribution detail.
   * @throws {DistributionNotFoundError} if no distribution matches the id.
   */
  async getDetail(id: number): Promise<DistributionDetailDto> {
    const distribution = await this.distributionRepository.findByIdWithBrokers(id);
    if (!distribution) {
      throw new DistributionNotFoundError();
    }

    const leads = await this.leadRepository.findByFormId(distribution.formId);

    return {
      id: distribution.id,
      formId: distribution.formId,
      createdAt: distribution.createdAt,
      brokers: distribution.brokers.map((db) => ({
        id: db.id,
        brokerId: db.brokerId,
        brokerName: db.broker.name,
        percentage: db.percentage,
        isActive: db.isActive,
      })),
      leads: leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        assignedBrokerId: lead.assignedBrokerId,
        createdAt: lead.createdAt,
      })),
    };
  }
}
