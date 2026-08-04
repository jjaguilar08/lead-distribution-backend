import { Broker } from '@prisma/client';
import { BrokerRepository, LeadWithForm } from './broker.repository';
import { BrokerNotFoundError, BrokerService } from './broker.service';
import { CreateBrokerDto } from './broker.types';

describe('BrokerService', () => {
  let brokerRepository: jest.Mocked<BrokerRepository>;
  let brokerService: BrokerService;

  const buildBroker = (overrides: Partial<Broker> = {}): Broker => ({
    id: 1,
    name: 'Acme Brokerage',
    isActive: true,
    dailyCap: 10,
    timezone: 'America/New_York',
    openTime: '09:00',
    closeTime: '17:00',
    workingDays: '1,2,3,4,5',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });

  beforeEach(() => {
    brokerRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findLeadsByBrokerId: jest.fn(),
    } as unknown as jest.Mocked<BrokerRepository>;
    brokerService = new BrokerService(brokerRepository);
  });

  it('returns all brokers', async () => {
    const brokers = [buildBroker()];
    brokerRepository.findAll.mockResolvedValue(brokers);

    await expect(brokerService.getAll()).resolves.toEqual(brokers);
  });

  it('returns a broker by id', async () => {
    const broker = buildBroker();
    brokerRepository.findById.mockResolvedValue(broker);

    await expect(brokerService.getById(1)).resolves.toEqual(broker);
  });

  it('throws BrokerNotFoundError when no broker matches the id', async () => {
    brokerRepository.findById.mockResolvedValue(null);

    await expect(brokerService.getById(999)).rejects.toThrow(BrokerNotFoundError);
  });

  it('creates a broker, defaulting isActive to true when omitted', async () => {
    const dto: CreateBrokerDto = {
      name: 'New Broker',
      dailyCap: 5,
      timezone: 'UTC',
      openTime: '08:00',
      closeTime: '16:00',
      workingDays: '1,2,3,4,5',
    };
    const created = buildBroker({ id: 2, name: dto.name });
    brokerRepository.create.mockResolvedValue(created);

    await expect(brokerService.create(dto)).resolves.toEqual(created);
    expect(brokerRepository.create).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }));
  });

  it('creates a broker, respecting an explicit isActive value', async () => {
    const dto: CreateBrokerDto = {
      name: 'Inactive Broker',
      isActive: false,
      dailyCap: 5,
      timezone: 'UTC',
      openTime: '08:00',
      closeTime: '16:00',
      workingDays: '1,2,3,4,5',
    };
    brokerRepository.create.mockResolvedValue(buildBroker({ isActive: false }));

    await brokerService.create(dto);

    expect(brokerRepository.create).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
  });

  it('updates an existing broker', async () => {
    brokerRepository.findById.mockResolvedValue(buildBroker());
    const updated = buildBroker({ name: 'Renamed' });
    brokerRepository.update.mockResolvedValue(updated);

    await expect(brokerService.update(1, { name: 'Renamed' })).resolves.toEqual(updated);
  });

  it('throws BrokerNotFoundError when updating a broker that does not exist', async () => {
    brokerRepository.findById.mockResolvedValue(null);

    await expect(brokerService.update(999, { name: 'x' })).rejects.toThrow(BrokerNotFoundError);
    expect(brokerRepository.update).not.toHaveBeenCalled();
  });

  it("returns a broker's leads joined with each lead's form name", async () => {
    brokerRepository.findById.mockResolvedValue(buildBroker());
    const leads: LeadWithForm[] = [
      {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '555-0100',
        ipAddress: '127.0.0.1',
        formId: 1,
        assignedBrokerId: 1,
        status: 'sent',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        form: { name: 'Intake Form' },
      },
    ];
    brokerRepository.findLeadsByBrokerId.mockResolvedValue(leads);

    await expect(brokerService.getLeadsForBroker(1)).resolves.toEqual([
      {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '555-0100',
        status: 'sent',
        createdAt: leads[0].createdAt,
        formName: 'Intake Form',
      },
    ]);
  });

  it('throws BrokerNotFoundError when fetching leads for a broker that does not exist', async () => {
    brokerRepository.findById.mockResolvedValue(null);

    await expect(brokerService.getLeadsForBroker(999)).rejects.toThrow(BrokerNotFoundError);
    expect(brokerRepository.findLeadsByBrokerId).not.toHaveBeenCalled();
  });
});
