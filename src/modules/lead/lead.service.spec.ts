import { Form, Lead } from '@prisma/client';
import { FormRepository } from '../form/form.repository';
import { DistributionEngineService } from './distribution-engine.service';
import { LeadRepository } from './lead.repository';
import { FormNotFoundError, LeadNotFoundError, LeadNotUnsentError, LeadService } from './lead.service';

describe('LeadService', () => {
  let leadRepository: jest.Mocked<LeadRepository>;
  let formRepository: jest.Mocked<FormRepository>;
  let distributionEngineService: jest.Mocked<DistributionEngineService>;
  let leadService: LeadService;

  const form: Form = { id: 1, name: 'Intake Form', slug: 'intake-form', createdAt: new Date('2026-01-01T00:00:00Z') };

  const buildLead = (overrides: Partial<Lead> = {}): Lead => ({
    id: 1,
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-0100',
    ipAddress: '127.0.0.1',
    formId: 1,
    assignedBrokerId: null,
    status: 'unsent',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });

  beforeEach(() => {
    leadRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      assignToBroker: jest.fn(),
      existsSentByEmail: jest.fn(),
      findByFormId: jest.fn(),
      countSentInRange: jest.fn(),
    } as unknown as jest.Mocked<LeadRepository>;
    formRepository = {
      findFirst: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<FormRepository>;
    distributionEngineService = {
      decide: jest.fn(),
    } as unknown as jest.Mocked<DistributionEngineService>;
    leadService = new LeadService(leadRepository, formRepository, distributionEngineService);
  });

  describe('submitPublicLead', () => {
    it('throws FormNotFoundError when the slug does not match the form', async () => {
      formRepository.findBySlug.mockResolvedValue(null);

      await expect(
        leadService.submitPublicLead('unknown-slug', { name: 'Jane', email: 'jane@example.com', phone: '555-0100' }, '1.2.3.4', new Date()),
      ).rejects.toThrow(FormNotFoundError);
      expect(distributionEngineService.decide).not.toHaveBeenCalled();
    });

    it('normalizes the email, runs the engine, and saves the resulting lead', async () => {
      formRepository.findBySlug.mockResolvedValue(form);
      distributionEngineService.decide.mockResolvedValue({ status: 'sent', assignedBrokerId: 5 });
      const created = buildLead({ status: 'sent', assignedBrokerId: 5, email: 'jane@example.com' });
      leadRepository.create.mockResolvedValue(created);
      const now = new Date('2026-01-05T12:00:00Z');

      const result = await leadService.submitPublicLead(
        'intake-form',
        { name: 'Jane Doe', email: '  Jane@Example.com  ', phone: '555-0100' },
        '1.2.3.4',
        now,
      );

      expect(distributionEngineService.decide).toHaveBeenCalledWith('jane@example.com', now);
      expect(leadRepository.create).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '555-0100',
        formId: form.id,
        ipAddress: '1.2.3.4',
        status: 'sent',
        assignedBrokerId: 5,
      });
      expect(result).toEqual(created);
    });

    it("persists a 'failed' lead when the distribution engine throws", async () => {
      formRepository.findBySlug.mockResolvedValue(form);
      distributionEngineService.decide.mockRejectedValue(new Error('engine blew up'));
      const failed = buildLead({ status: 'failed', assignedBrokerId: null, email: 'jane@example.com' });
      leadRepository.create.mockResolvedValue(failed);
      const now = new Date('2026-01-05T12:00:00Z');

      const result = await leadService.submitPublicLead(
        'intake-form',
        { name: 'Jane Doe', email: 'Jane@Example.com', phone: '555-0100' },
        '1.2.3.4',
        now,
      );

      expect(leadRepository.create).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '555-0100',
        formId: form.id,
        ipAddress: '1.2.3.4',
        status: 'failed',
        assignedBrokerId: null,
      });
      expect(result).toEqual(failed);
    });
  });

  it('returns all leads', async () => {
    const leads = [buildLead()];
    leadRepository.findAll.mockResolvedValue(leads);

    await expect(leadService.getAll()).resolves.toEqual(leads);
  });

  describe('assign', () => {
    it('throws LeadNotFoundError when no lead matches the id', async () => {
      leadRepository.findById.mockResolvedValue(null);

      await expect(leadService.assign(999, { brokerId: 5 })).rejects.toThrow(LeadNotFoundError);
    });

    it("throws LeadNotUnsentError when the lead's status isn't 'unsent'", async () => {
      leadRepository.findById.mockResolvedValue(buildLead({ status: 'sent' }));

      await expect(leadService.assign(1, { brokerId: 5 })).rejects.toThrow(LeadNotUnsentError);
      expect(leadRepository.assignToBroker).not.toHaveBeenCalled();
    });

    it('assigns an unsent lead to the given broker', async () => {
      leadRepository.findById.mockResolvedValue(buildLead({ status: 'unsent' }));
      const assigned = buildLead({ status: 'sent', assignedBrokerId: 5 });
      leadRepository.assignToBroker.mockResolvedValue(assigned);

      await expect(leadService.assign(1, { brokerId: 5 })).resolves.toEqual(assigned);
      expect(leadRepository.assignToBroker).toHaveBeenCalledWith(1, 5);
    });
  });
});
