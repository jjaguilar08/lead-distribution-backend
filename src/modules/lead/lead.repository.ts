import { Lead, LeadStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';

/** Fields needed to create a lead row. */
export interface CreateLeadInput {
  name: string;
  email: string;
  phone: string;
  formId: number;
  ipAddress: string;
  status: LeadStatus;
  assignedBrokerId: number | null;
}

/** All Prisma calls for the lead module live here — no business logic. */
export class LeadRepository {
  /**
   * Creates a lead row.
   * @param data - the fields for the new lead.
   * @returns the created lead.
   */
  async create(data: CreateLeadInput): Promise<Lead> {
    return prisma.lead.create({ data });
  }

  /**
   * Returns every lead, all statuses.
   * @returns all leads.
   */
  async findAll(): Promise<Lead[]> {
    return prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  }

  /**
   * Finds a lead by id.
   * @param id - the lead id to look up.
   * @returns the matching lead, or null if none exists.
   */
  async findById(id: number): Promise<Lead | null> {
    return prisma.lead.findUnique({ where: { id } });
  }

  /**
   * Assigns a lead to a broker and marks it sent.
   * @param id - the lead id to update.
   * @param brokerId - the broker id to assign the lead to.
   * @returns the updated lead.
   */
  async assignToBroker(id: number, brokerId: number): Promise<Lead> {
    return prisma.lead.update({ where: { id }, data: { assignedBrokerId: brokerId, status: 'sent' } });
  }

  /**
   * Checks whether a normalized email has ever been assigned to a broker
   * before (i.e. any prior lead with this email has status 'sent').
   * @param normalizedEmail - the trimmed, lowercased email to check.
   * @returns true if a prior sent lead exists for this email.
   */
  async existsSentByEmail(normalizedEmail: string): Promise<boolean> {
    const match = await prisma.lead.findFirst({
      where: { email: normalizedEmail, status: 'sent' },
      select: { id: true },
    });
    return match !== null;
  }

  /**
   * Returns every lead submitted through a given form, all statuses.
   * @param formId - the form id to look up leads for.
   * @returns the form's leads.
   */
  async findByFormId(formId: number): Promise<Lead[]> {
    return prisma.lead.findMany({ where: { formId }, orderBy: { createdAt: 'desc' } });
  }

  /**
   * Counts a broker's sent leads whose createdAt falls within a given
   * (already timezone-resolved) UTC instant range.
   * @param brokerId - the broker id to count sent leads for.
   * @param startUtc - the inclusive range start.
   * @param endUtc - the exclusive range end.
   * @returns the number of matching sent leads.
   */
  async countSentInRange(brokerId: number, startUtc: Date, endUtc: Date): Promise<number> {
    return prisma.lead.count({
      where: {
        assignedBrokerId: brokerId,
        status: 'sent',
        createdAt: { gte: startUtc, lt: endUtc },
      },
    });
  }
}
