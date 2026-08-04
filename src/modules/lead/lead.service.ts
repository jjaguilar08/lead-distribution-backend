import { Lead } from '@prisma/client';
import { FormRepository } from '../form/form.repository';
import { DistributionEngineService } from './distribution-engine.service';
import { LeadRepository } from './lead.repository';
import { AssignLeadDto, SubmitLeadDto } from './lead.types';

/** Thrown when a public lead submission's slug doesn't match the form. */
export class FormNotFoundError extends Error {
  constructor() {
    super('Form not found');
    this.name = 'FormNotFoundError';
  }
}

/** Thrown when a requested lead id doesn't match any row. */
export class LeadNotFoundError extends Error {
  constructor() {
    super('Lead not found');
    this.name = 'LeadNotFoundError';
  }
}

/** Thrown when manually assigning a lead that isn't currently 'unsent'. */
export class LeadNotUnsentError extends Error {
  constructor() {
    super("Lead is not in 'unsent' status");
    this.name = 'LeadNotUnsentError';
  }
}

/** All lead business logic. Depends on its repositories and the distribution engine via constructor injection for testability. */
export class LeadService {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly formRepository: FormRepository,
    private readonly distributionEngineService: DistributionEngineService,
  ) {}

  /**
   * Handles a public lead submission: validates the slug against the
   * existing form, normalizes the email, runs it through the distribution
   * engine, and saves the resulting lead.
   * @param slug - the form slug submitted through.
   * @param dto - the submitted name/email/phone.
   * @param ipAddress - the submitter's IP address, as captured by the controller.
   * @param now - the instant to evaluate distribution rules against.
   * @returns the created lead.
   * @throws {FormNotFoundError} if the slug doesn't match the existing form.
   */
  async submitPublicLead(slug: string, dto: SubmitLeadDto, ipAddress: string, now: Date): Promise<Lead> {
    const form = await this.formRepository.findBySlug(slug);
    if (!form) {
      throw new FormNotFoundError();
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const decision = await this.distributionEngineService.decide(normalizedEmail, now);

    return this.leadRepository.create({
      name: dto.name,
      email: normalizedEmail,
      phone: dto.phone,
      formId: form.id,
      ipAddress,
      status: decision.status,
      assignedBrokerId: decision.assignedBrokerId,
    });
  }

  /**
   * Returns every lead, all statuses.
   * @returns all leads.
   */
  async getAll(): Promise<Lead[]> {
    return this.leadRepository.findAll();
  }

  /**
   * Manually assigns a lead to a broker, bypassing the distribution
   * engine's deficit calculation by design — this is an explicit admin
   * override for leads the engine left 'unsent' (e.g. no broker was
   * eligible), so it intentionally skips eligibility/cap/hours checks.
   * @param id - the lead id to assign.
   * @param dto - the broker to assign the lead to.
   * @returns the updated lead.
   * @throws {LeadNotFoundError} if no lead matches the id.
   * @throws {LeadNotUnsentError} if the lead's current status isn't 'unsent'.
   */
  async assign(id: number, dto: AssignLeadDto): Promise<Lead> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new LeadNotFoundError();
    }
    if (lead.status !== 'unsent') {
      throw new LeadNotUnsentError();
    }
    return this.leadRepository.assignToBroker(id, dto.brokerId);
  }
}
