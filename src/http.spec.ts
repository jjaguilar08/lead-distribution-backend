import { Broker, Distribution, Form, Lead } from '@prisma/client';
import cookieParser from 'cookie-parser';
import express, { Express, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { signJwt } from './lib/jwt';
import { requireAuth } from './middleware/require-auth';
import { validate } from './middleware/validate';
import { BrokerController } from './modules/broker/broker.controller';
import { BrokerRepository } from './modules/broker/broker.repository';
import { BrokerService } from './modules/broker/broker.service';
import { createBrokerSchema } from './modules/broker/broker.validation';
import { DistributionController } from './modules/distribution/distribution.controller';
import { DistributionRepository } from './modules/distribution/distribution.repository';
import { DistributionService } from './modules/distribution/distribution.service';
import { replaceDistributionBrokersSchema } from './modules/distribution/distribution.validation';
import { FormController } from './modules/form/form.controller';
import { FormRepository } from './modules/form/form.repository';
import { FormService } from './modules/form/form.service';
import { createFormSchema } from './modules/form/form.validation';
import { DistributionEngineService } from './modules/lead/distribution-engine.service';
import { LeadController } from './modules/lead/lead.controller';
import { LeadRepository } from './modules/lead/lead.repository';
import { LeadService } from './modules/lead/lead.service';
import { submitLeadSchema } from './modules/lead/lead.validation';

/**
 * A thin HTTP-layer safety net: the app is assembled by hand here (not via
 * `createApp()`) so every repository can be a jest mock — same
 * constructor-injection pattern the service specs already use, just wired
 * one level up. No real DB. This isn't a coverage gate, it just proves
 * requireAuth/validate/controller/service wiring actually works end to end
 * over real HTTP, which the service-unit specs can't see.
 */
function buildTestApp(): {
  app: Express;
  brokerRepository: jest.Mocked<BrokerRepository>;
  formRepository: jest.Mocked<FormRepository>;
  distributionRepository: jest.Mocked<DistributionRepository>;
  leadRepository: jest.Mocked<LeadRepository>;
} {
  const brokerRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findByIds: jest.fn(),
    findLeadsByBrokerId: jest.fn(),
  } as unknown as jest.Mocked<BrokerRepository>;

  const formRepository = {
    findFirst: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
  } as unknown as jest.Mocked<FormRepository>;

  const distributionRepository = {
    findFirst: jest.fn(),
    findFirstWithBrokers: jest.fn(),
    findByIdWithBrokers: jest.fn(),
    create: jest.fn(),
    replaceBrokers: jest.fn(),
  } as unknown as jest.Mocked<DistributionRepository>;

  const leadRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    assignToBroker: jest.fn(),
    existsSentByEmail: jest.fn(),
    findByFormId: jest.fn(),
    countSentInRange: jest.fn(),
  } as unknown as jest.Mocked<LeadRepository>;

  const brokerController = new BrokerController(new BrokerService(brokerRepository));
  const formController = new FormController(new FormService(formRepository));
  const distributionController = new DistributionController(
    new DistributionService(distributionRepository, formRepository, leadRepository, brokerRepository),
  );
  const distributionEngineService = new DistributionEngineService(distributionRepository, leadRepository);
  const leadController = new LeadController(new LeadService(leadRepository, formRepository, distributionEngineService));

  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  const brokerRouter = express.Router();
  brokerRouter.post('/', requireAuth, validate(createBrokerSchema), brokerController.create);
  app.use('/api/brokers', brokerRouter);

  const formRouter = express.Router();
  formRouter.post('/', requireAuth, validate(createFormSchema), formController.create);
  app.use('/api/form', formRouter);

  const distributionRouter = express.Router();
  distributionRouter.post('/', requireAuth, distributionController.create);
  distributionRouter.put(
    '/brokers',
    requireAuth,
    validate(replaceDistributionBrokersSchema),
    distributionController.replaceBrokers,
  );
  app.use('/api/distribution', distributionRouter);

  const leadPublicRouter = express.Router();
  leadPublicRouter.post('/:slug', validate(submitLeadSchema), leadController.submitPublicLead);
  app.use('/api/public/leads', leadPublicRouter);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: 'Internal server error' });
  });

  return { app, brokerRepository, formRepository, distributionRepository, leadRepository };
}

const authCookie = `token=${signJwt({ sub: 1, email: 'admin@example.com' })}`;

const buildForm = (overrides: Partial<Form> = {}): Form => ({
  id: 1,
  name: 'Main Intake Form',
  slug: 'main-intake',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

const buildDistribution = (overrides: Partial<Distribution> = {}): Distribution => ({
  id: 1,
  formId: 1,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

const buildBroker = (overrides: Partial<Broker> = {}): Broker => ({
  id: 1,
  name: 'Acme Brokerage',
  isActive: true,
  dailyCap: 10,
  timezone: 'UTC',
  openTime: '09:00',
  closeTime: '17:00',
  workingDays: '1,2,3,4,5',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

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

describe('HTTP integration', () => {
  describe('validation now returns 400, not 500 (audit repro cases)', () => {
    it('POST /api/public/leads/:slug with only email (missing name/phone) -> 400', async () => {
      const { app } = buildTestApp();

      const res = await request(app).post('/api/public/leads/main-intake').send({ email: 'audit-missing-fields@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'name' }),
          expect.objectContaining({ path: 'phone' }),
        ]),
      );
    });

    it('POST /api/brokers with garbage types (dailyCap string, bogus times/timezone) -> 400', async () => {
      const { app } = buildTestApp();

      const res = await request(app).post('/api/brokers').set('Cookie', authCookie).send({
        name: 'AUDIT-TEST',
        dailyCap: 'not-a-number',
        timezone: 'Not/AZone',
        openTime: 'nope',
        closeTime: 'nope',
        workingDays: 'garbage',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('PUT /api/distribution/brokers with a nonexistent brokerId -> 400', async () => {
      const { app, distributionRepository, brokerRepository } = buildTestApp();
      distributionRepository.findFirst.mockResolvedValue(buildDistribution());
      brokerRepository.findByIds.mockResolvedValue([]);

      const res = await request(app)
        .put('/api/distribution/brokers')
        .set('Cookie', authCookie)
        .send({ brokers: [{ brokerId: 999999, percentage: 100, isActive: true }] });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('One or more broker ids do not exist');
    });
  });

  describe('exact spec-mandated error message', () => {
    it('POST /api/distribution before a form exists responds with "Oops, please create a form first."', async () => {
      const { app, formRepository } = buildTestApp();
      formRepository.findFirst.mockResolvedValue(null);

      const res = await request(app).post('/api/distribution').set('Cookie', authCookie).send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Oops, please create a form first.');
    });
  });

  describe('happy paths (one per major route, to prove wiring)', () => {
    it('POST /api/brokers -> 201', async () => {
      const { app, brokerRepository } = buildTestApp();
      const created = buildBroker();
      brokerRepository.create.mockResolvedValue(created);

      const res = await request(app).post('/api/brokers').set('Cookie', authCookie).send({
        name: 'Acme Brokerage',
        dailyCap: 10,
        timezone: 'UTC',
        openTime: '09:00',
        closeTime: '17:00',
        workingDays: '1,2,3,4,5',
      });

      expect(res.status).toBe(201);
      expect(res.body.broker.id).toBe(created.id);
    });

    it('POST /api/form -> 201', async () => {
      const { app, formRepository } = buildTestApp();
      formRepository.findFirst.mockResolvedValue(null);
      const created = buildForm();
      formRepository.create.mockResolvedValue(created);

      const res = await request(app)
        .post('/api/form')
        .set('Cookie', authCookie)
        .send({ name: 'Main Intake Form', slug: 'main-intake' });

      expect(res.status).toBe(201);
      expect(res.body.form).toEqual({ ...created, createdAt: created.createdAt.toISOString() });
    });

    it('POST /api/distribution -> 201 once a form exists', async () => {
      const { app, formRepository, distributionRepository } = buildTestApp();
      formRepository.findFirst.mockResolvedValue(buildForm());
      distributionRepository.findFirst.mockResolvedValue(null);
      const created = buildDistribution();
      distributionRepository.create.mockResolvedValue(created);

      const res = await request(app).post('/api/distribution').set('Cookie', authCookie).send({});

      expect(res.status).toBe(201);
      expect(res.body.distribution).toEqual({ ...created, createdAt: created.createdAt.toISOString() });
    });

    it('POST /api/public/leads/:slug -> 201', async () => {
      const { app, formRepository, distributionRepository, leadRepository } = buildTestApp();
      formRepository.findBySlug.mockResolvedValue(buildForm());
      leadRepository.existsSentByEmail.mockResolvedValue(false);
      distributionRepository.findFirstWithBrokers.mockResolvedValue(null);
      const created = buildLead({ status: 'unsent' });
      leadRepository.create.mockResolvedValue(created);

      const res = await request(app)
        .post('/api/public/leads/main-intake')
        .send({ name: 'Jane Doe', email: 'jane@example.com', phone: '555-0100' });

      expect(res.status).toBe(201);
      expect(res.body.lead).toEqual({ ...created, createdAt: created.createdAt.toISOString() });
    });
  });
});
