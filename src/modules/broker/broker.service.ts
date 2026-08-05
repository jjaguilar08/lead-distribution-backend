import { Broker } from '@prisma/client';
import { BrokerRepository } from './broker.repository';
import { BrokerLeadDto, CreateBrokerDto, UpdateBrokerDto } from './broker.types';

/** Thrown when a requested broker id doesn't match any row. */
export class BrokerNotFoundError extends Error {
  constructor() {
    super('Broker not found');
    this.name = 'BrokerNotFoundError';
  }
}

/** All broker business logic. Depends on BrokerRepository via constructor injection for testability. */
export class BrokerService {
  constructor(private readonly brokerRepository: BrokerRepository) {}

  /**
   * Returns every broker.
   * @returns all brokers.
   */
  async getAll(): Promise<Broker[]> {
    return this.brokerRepository.findAll();
  }

  /**
   * Returns a single broker by id.
   * @param id - the broker id to look up.
   * @returns the matching broker.
   * @throws {BrokerNotFoundError} if no broker matches the id.
   */
  async getById(id: number): Promise<Broker> {
    const broker = await this.brokerRepository.findById(id);
    if (!broker) {
      throw new BrokerNotFoundError();
    }
    return broker;
  }

  /**
   * Creates a new broker.
   * @param dto - the fields for the new broker.
   * @returns the created broker.
   */
  async create(dto: CreateBrokerDto): Promise<Broker> {
    return this.brokerRepository.create({
      name: dto.name,
      isActive: dto.isActive ?? true,
      dailyCap: dto.dailyCap,
      timezone: dto.timezone,
      openTime: dto.openTime,
      closeTime: dto.closeTime,
      workingDays: dto.workingDays,
    });
  }

  /**
   * Updates an existing broker.
   * @param id - the broker id to update.
   * @param dto - the fields to update.
   * @returns the updated broker.
   * @throws {BrokerNotFoundError} if no broker matches the id.
   */
  async update(id: number, dto: UpdateBrokerDto): Promise<Broker> {
    await this.getById(id);
    return this.brokerRepository.update(id, dto);
  }

  /**
   * Returns every lead ever assigned to a broker, joined with the form name
   * each lead came through.
   * @param id - the broker id to look up leads for.
   * @returns the broker's leads.
   * @throws {BrokerNotFoundError} if no broker matches the id.
   */
  async getLeadsForBroker(id: number): Promise<BrokerLeadDto[]> {
    await this.getById(id);
    const leads = await this.brokerRepository.findLeadsByBrokerId(id);
    return leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      ipAddress: lead.ipAddress,
      status: lead.status,
      createdAt: lead.createdAt,
      formName: lead.form.name,
    }));
  }
}
