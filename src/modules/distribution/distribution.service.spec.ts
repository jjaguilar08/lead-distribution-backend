import { Broker, Distribution, DistributionBroker, Form, Lead } from '@prisma/client';
import { FormRepository } from '../form/form.repository';
import { LeadRepository } from '../lead/lead.repository';
import { DistributionRepository, DistributionWithBrokers } from './distribution.repository';
import {
  DistributionAlreadyExistsError,
  DistributionNotFoundError,
  InvalidPercentageError,
  NoFormError,
  DistributionService,
} from './distribution.service';

describe('DistributionService', () => {
  let distributionRepository: jest.Mocked<DistributionRepository>;
  let formRepository: jest.Mocked<FormRepository>;
  let leadRepository: jest.Mocked<LeadRepository>;
  let distributionService: DistributionService;

  const form: Form = { id: 1, name: 'Intake Form', slug: 'intake-form', createdAt: new Date('2026-01-01T00:00:00Z') };

  const distribution: Distribution = { id: 1, formId: 1, createdAt: new Date('2026-01-01T00:00:00Z') };

  const broker: Broker = {
    id: 5,
    name: 'Acme Brokerage',
    isActive: true,
    dailyCap: 10,
    timezone: 'UTC',
    openTime: '09:00',
    closeTime: '17:00',
    workingDays: '1,2,3,4,5',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  const distributionBroker: DistributionBroker = { id: 10, distributionId: 1, brokerId: 5, percentage: 50, isActive: true };

  const distributionWithBrokers: DistributionWithBrokers = {
    ...distribution,
    brokers: [{ ...distributionBroker, broker }],
  };

  const lead: Lead = {
    id: 100,
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-0100',
    ipAddress: '127.0.0.1',
    formId: 1,
    assignedBrokerId: 5,
    status: 'sent',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    distributionRepository = {
      findFirst: jest.fn(),
      findFirstWithBrokers: jest.fn(),
      findByIdWithBrokers: jest.fn(),
      create: jest.fn(),
      replaceBrokers: jest.fn(),
    } as unknown as jest.Mocked<DistributionRepository>;
    formRepository = {
      findFirst: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<FormRepository>;
    leadRepository = {
      findByFormId: jest.fn(),
    } as unknown as jest.Mocked<LeadRepository>;
    distributionService = new DistributionService(distributionRepository, formRepository, leadRepository);
  });

  describe('getCurrent', () => {
    it('returns the distribution when one exists', async () => {
      distributionRepository.findFirst.mockResolvedValue(distribution);

      await expect(distributionService.getCurrent()).resolves.toEqual(distribution);
    });

    it('returns null when no distribution exists yet', async () => {
      distributionRepository.findFirst.mockResolvedValue(null);

      await expect(distributionService.getCurrent()).resolves.toBeNull();
    });
  });

  describe('create', () => {
    it('throws NoFormError when no form exists', async () => {
      formRepository.findFirst.mockResolvedValue(null);

      await expect(distributionService.create()).rejects.toThrow(NoFormError);
      await expect(distributionService.create()).rejects.toThrow('Oops, please create a form first.');
    });

    it('throws DistributionAlreadyExistsError when a distribution already exists', async () => {
      formRepository.findFirst.mockResolvedValue(form);
      distributionRepository.findFirst.mockResolvedValue(distribution);

      await expect(distributionService.create()).rejects.toThrow(DistributionAlreadyExistsError);
      expect(distributionRepository.create).not.toHaveBeenCalled();
    });

    it('creates the distribution linked to the existing form', async () => {
      formRepository.findFirst.mockResolvedValue(form);
      distributionRepository.findFirst.mockResolvedValue(null);
      distributionRepository.create.mockResolvedValue(distribution);

      await expect(distributionService.create()).resolves.toEqual(distribution);
      expect(distributionRepository.create).toHaveBeenCalledWith(form.id);
    });
  });

  describe('replaceBrokers', () => {
    it('throws DistributionNotFoundError when no distribution exists', async () => {
      distributionRepository.findFirst.mockResolvedValue(null);

      await expect(distributionService.replaceBrokers({ brokers: [] })).rejects.toThrow(DistributionNotFoundError);
    });

    it('throws InvalidPercentageError when a percentage is not a number', async () => {
      distributionRepository.findFirst.mockResolvedValue(distribution);

      await expect(
        distributionService.replaceBrokers({
          brokers: [{ brokerId: 5, percentage: 'oops' as unknown as number, isActive: true }],
        }),
      ).rejects.toThrow(InvalidPercentageError);
    });

    it('throws InvalidPercentageError when a percentage is not finite', async () => {
      distributionRepository.findFirst.mockResolvedValue(distribution);

      await expect(
        distributionService.replaceBrokers({ brokers: [{ brokerId: 5, percentage: NaN, isActive: true }] }),
      ).rejects.toThrow(InvalidPercentageError);
    });

    it('throws InvalidPercentageError when a percentage is negative', async () => {
      distributionRepository.findFirst.mockResolvedValue(distribution);

      await expect(
        distributionService.replaceBrokers({ brokers: [{ brokerId: 5, percentage: -1, isActive: true }] }),
      ).rejects.toThrow(InvalidPercentageError);
    });

    it('replaces brokers when all percentages are valid non-negative numbers', async () => {
      distributionRepository.findFirst.mockResolvedValue(distribution);
      const brokers = [
        { brokerId: 5, percentage: 0, isActive: true },
        { brokerId: 6, percentage: 100, isActive: false },
      ];
      distributionRepository.replaceBrokers.mockResolvedValue([]);

      await distributionService.replaceBrokers({ brokers });

      expect(distributionRepository.replaceBrokers).toHaveBeenCalledWith(distribution.id, brokers);
    });
  });

  describe('getDetail', () => {
    it('throws DistributionNotFoundError when no distribution matches the id', async () => {
      distributionRepository.findByIdWithBrokers.mockResolvedValue(null);

      await expect(distributionService.getDetail(999)).rejects.toThrow(DistributionNotFoundError);
    });

    it('returns the distribution, its brokers, and every lead for its form', async () => {
      distributionRepository.findByIdWithBrokers.mockResolvedValue(distributionWithBrokers);
      leadRepository.findByFormId.mockResolvedValue([lead]);

      await expect(distributionService.getDetail(1)).resolves.toEqual({
        id: distribution.id,
        formId: distribution.formId,
        createdAt: distribution.createdAt,
        brokers: [
          {
            id: distributionBroker.id,
            brokerId: broker.id,
            brokerName: broker.name,
            percentage: distributionBroker.percentage,
            isActive: distributionBroker.isActive,
          },
        ],
        leads: [
          {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            ipAddress: lead.ipAddress,
            status: lead.status,
            assignedBrokerId: lead.assignedBrokerId,
            createdAt: lead.createdAt,
          },
        ],
      });
      expect(leadRepository.findByFormId).toHaveBeenCalledWith(distribution.formId);
    });
  });
});
