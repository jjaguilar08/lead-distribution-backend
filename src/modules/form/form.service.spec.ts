import { Form } from '@prisma/client';
import { FormRepository } from './form.repository';
import { FormAlreadyExistsError, FormService } from './form.service';

describe('FormService', () => {
  let formRepository: jest.Mocked<FormRepository>;
  let formService: FormService;

  const buildForm = (overrides: Partial<Form> = {}): Form => ({
    id: 1,
    name: 'Intake Form',
    slug: 'intake-form',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });

  beforeEach(() => {
    formRepository = {
      findFirst: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<FormRepository>;
    formService = new FormService(formRepository);
  });

  it('returns the form when one exists', async () => {
    const form = buildForm();
    formRepository.findFirst.mockResolvedValue(form);

    await expect(formService.getForm()).resolves.toEqual(form);
  });

  it('returns null when no form has been created yet', async () => {
    formRepository.findFirst.mockResolvedValue(null);

    await expect(formService.getForm()).resolves.toBeNull();
  });

  it('creates the form when none exists yet', async () => {
    formRepository.findFirst.mockResolvedValue(null);
    const created = buildForm();
    formRepository.create.mockResolvedValue(created);

    await expect(formService.create({ name: 'Intake Form', slug: 'intake-form' })).resolves.toEqual(created);
    expect(formRepository.create).toHaveBeenCalledWith({ name: 'Intake Form', slug: 'intake-form' });
  });

  it('throws FormAlreadyExistsError when a form already exists', async () => {
    formRepository.findFirst.mockResolvedValue(buildForm());

    await expect(formService.create({ name: 'Another', slug: 'another' })).rejects.toThrow(FormAlreadyExistsError);
    expect(formRepository.create).not.toHaveBeenCalled();
  });

  it('returns the form matching a slug', async () => {
    const form = buildForm();
    formRepository.findBySlug.mockResolvedValue(form);

    await expect(formService.getBySlug('intake-form')).resolves.toEqual(form);
  });

  it('returns null when no form matches the slug', async () => {
    formRepository.findBySlug.mockResolvedValue(null);

    await expect(formService.getBySlug('unknown')).resolves.toBeNull();
  });
});
