import { Broker, DistributionBroker } from '@prisma/client';
import { DistributionRepository, DistributionWithBrokers } from '../distribution/distribution.repository';
import { DistributionEngineService } from './distribution-engine.service';
import { LeadRepository } from './lead.repository';

describe('DistributionEngineService', () => {
  let distributionRepository: jest.Mocked<DistributionRepository>;
  let leadRepository: jest.Mocked<LeadRepository>;
  let engine: DistributionEngineService;

  // Monday, 2026-01-05, 12:00 UTC — a working day/hour for the default UTC broker fixtures below.
  const now = new Date('2026-01-05T12:00:00Z');
  const email = 'jane@example.com';

  const buildBroker = (overrides: Partial<Broker> = {}): Broker => ({
    id: 1,
    name: 'Broker',
    isActive: true,
    dailyCap: 10,
    timezone: 'UTC',
    openTime: '09:00',
    closeTime: '17:00',
    workingDays: '1,2,3,4,5',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });

  const buildDistributionBroker = (
    broker: Broker,
    overrides: Partial<DistributionBroker> = {},
  ): DistributionBroker & { broker: Broker } => ({
    id: broker.id,
    distributionId: 1,
    brokerId: broker.id,
    percentage: 50,
    isActive: true,
    ...overrides,
    broker,
  });

  const buildDistribution = (brokers: (DistributionBroker & { broker: Broker })[]): DistributionWithBrokers => ({
    id: 1,
    formId: 1,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    brokers,
  });

  beforeEach(() => {
    distributionRepository = {
      findFirst: jest.fn(),
      findFirstWithBrokers: jest.fn(),
      findByIdWithBrokers: jest.fn(),
      create: jest.fn(),
      replaceBrokers: jest.fn(),
    } as unknown as jest.Mocked<DistributionRepository>;
    leadRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      assignToBroker: jest.fn(),
      existsSentByEmail: jest.fn(),
      findByFormId: jest.fn(),
      countSentInRange: jest.fn(),
    } as unknown as jest.Mocked<LeadRepository>;
    engine = new DistributionEngineService(distributionRepository, leadRepository);
  });

  it('short-circuits to duplicate when the email has a prior sent lead', async () => {
    leadRepository.existsSentByEmail.mockResolvedValue(true);

    await expect(engine.decide(email, now)).resolves.toEqual({ status: 'duplicate', assignedBrokerId: null });
    expect(distributionRepository.findFirstWithBrokers).not.toHaveBeenCalled();
  });

  it('short-circuits to unsent when no distribution exists', async () => {
    leadRepository.existsSentByEmail.mockResolvedValue(false);
    distributionRepository.findFirstWithBrokers.mockResolvedValue(null);

    await expect(engine.decide(email, now)).resolves.toEqual({ status: 'unsent', assignedBrokerId: null });
  });

  describe('eligibility filters', () => {
    beforeEach(() => {
      leadRepository.existsSentByEmail.mockResolvedValue(false);
    });

    it('excludes a broker that is inactive on Broker', async () => {
      const broker = buildBroker({ isActive: false });
      distributionRepository.findFirstWithBrokers.mockResolvedValue(
        buildDistribution([buildDistributionBroker(broker)]),
      );

      await expect(engine.decide(email, now)).resolves.toEqual({ status: 'unsent', assignedBrokerId: null });
      expect(leadRepository.countSentInRange).not.toHaveBeenCalled();
    });

    it('excludes a broker that is inactive on DistributionBroker', async () => {
      const broker = buildBroker();
      distributionRepository.findFirstWithBrokers.mockResolvedValue(
        buildDistribution([buildDistributionBroker(broker, { isActive: false })]),
      );

      await expect(engine.decide(email, now)).resolves.toEqual({ status: 'unsent', assignedBrokerId: null });
    });

    it("excludes a broker outside today's working days", async () => {
      const broker = buildBroker({ workingDays: '1,2,3,4,5' });
      distributionRepository.findFirstWithBrokers.mockResolvedValue(
        buildDistribution([buildDistributionBroker(broker)]),
      );
      const sunday = new Date('2026-01-04T12:00:00Z');

      await expect(engine.decide(email, sunday)).resolves.toEqual({ status: 'unsent', assignedBrokerId: null });
    });

    it('excludes a broker before its opening time', async () => {
      const broker = buildBroker({ openTime: '09:00', closeTime: '17:00' });
      distributionRepository.findFirstWithBrokers.mockResolvedValue(
        buildDistribution([buildDistributionBroker(broker)]),
      );
      const beforeOpen = new Date('2026-01-05T08:00:00Z');

      await expect(engine.decide(email, beforeOpen)).resolves.toEqual({ status: 'unsent', assignedBrokerId: null });
    });

    it('excludes a broker at/after its closing time', async () => {
      const broker = buildBroker({ openTime: '09:00', closeTime: '17:00' });
      distributionRepository.findFirstWithBrokers.mockResolvedValue(
        buildDistribution([buildDistributionBroker(broker)]),
      );
      const atClose = new Date('2026-01-05T17:00:00Z');

      await expect(engine.decide(email, atClose)).resolves.toEqual({ status: 'unsent', assignedBrokerId: null });
    });

    it('excludes a broker at or over its daily cap', async () => {
      const broker = buildBroker({ dailyCap: 3 });
      distributionRepository.findFirstWithBrokers.mockResolvedValue(
        buildDistribution([buildDistributionBroker(broker)]),
      );
      leadRepository.countSentInRange.mockResolvedValue(3);

      await expect(engine.decide(email, now)).resolves.toEqual({ status: 'unsent', assignedBrokerId: null });
    });
  });

  it('assigns to the sole eligible broker', async () => {
    leadRepository.existsSentByEmail.mockResolvedValue(false);
    const broker = buildBroker({ id: 42 });
    distributionRepository.findFirstWithBrokers.mockResolvedValue(
      buildDistribution([buildDistributionBroker(broker)]),
    );
    leadRepository.countSentInRange.mockResolvedValue(0);

    await expect(engine.decide(email, now)).resolves.toEqual({ status: 'sent', assignedBrokerId: 42 });
  });

  describe('deficit-based winner selection', () => {
    beforeEach(() => {
      leadRepository.existsSentByEmail.mockResolvedValue(false);
    });

    it('picks the broker with the strictly higher deficit', async () => {
      // A: percentage 80, sentToday 1 -> deficit 4.6; B: percentage 20, sentToday 5 -> deficit -3.6
      const brokerB = buildBroker({ id: 2 });
      const brokerA = buildBroker({ id: 1 });
      distributionRepository.findFirstWithBrokers.mockResolvedValue(
        buildDistribution([
          buildDistributionBroker(brokerB, { percentage: 20 }),
          buildDistributionBroker(brokerA, { percentage: 80 }),
        ]),
      );
      leadRepository.countSentInRange.mockImplementation(async (brokerId) => (brokerId === 1 ? 1 : 5));

      await expect(engine.decide(email, now)).resolves.toEqual({ status: 'sent', assignedBrokerId: 1 });
    });

    it('keeps the higher-deficit leader when a later candidate has a strictly lower (non-tied) deficit', async () => {
      // Same brokers as above with the higher-deficit one listed first, so the leader is
      // kept via the plain "return best" fallthrough rather than the first-element default.
      const brokerA = buildBroker({ id: 1 });
      const brokerB = buildBroker({ id: 2 });
      distributionRepository.findFirstWithBrokers.mockResolvedValue(
        buildDistribution([
          buildDistributionBroker(brokerA, { percentage: 80 }),
          buildDistributionBroker(brokerB, { percentage: 20 }),
        ]),
      );
      leadRepository.countSentInRange.mockImplementation(async (brokerId) => (brokerId === 1 ? 1 : 5));

      await expect(engine.decide(email, now)).resolves.toEqual({ status: 'sent', assignedBrokerId: 1 });
    });

    it('breaks an exact deficit tie in favor of the broker with fewer leads sent today', async () => {
      // A: percentage 70, sentToday 3 -> deficit 0.5; B: percentage 30, sentToday 1 -> deficit 0.5
      const brokerA = buildBroker({ id: 1 });
      const brokerB = buildBroker({ id: 2 });
      distributionRepository.findFirstWithBrokers.mockResolvedValue(
        buildDistribution([
          buildDistributionBroker(brokerA, { percentage: 70 }),
          buildDistributionBroker(brokerB, { percentage: 30 }),
        ]),
      );
      leadRepository.countSentInRange.mockImplementation(async (brokerId) => (brokerId === 1 ? 3 : 1));

      await expect(engine.decide(email, now)).resolves.toEqual({ status: 'sent', assignedBrokerId: 2 });
    });

    it('keeps the current leader when a tied candidate does not have fewer sent today', async () => {
      // Same tie as above, but with the lower-sentToday broker listed first.
      const brokerB = buildBroker({ id: 2 });
      const brokerA = buildBroker({ id: 1 });
      distributionRepository.findFirstWithBrokers.mockResolvedValue(
        buildDistribution([
          buildDistributionBroker(brokerB, { percentage: 30 }),
          buildDistributionBroker(brokerA, { percentage: 70 }),
        ]),
      );
      leadRepository.countSentInRange.mockImplementation(async (brokerId) => (brokerId === 1 ? 3 : 1));

      await expect(engine.decide(email, now)).resolves.toEqual({ status: 'sent', assignedBrokerId: 2 });
    });
  });
});
