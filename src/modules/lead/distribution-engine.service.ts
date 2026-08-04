import { LeadStatus } from '@prisma/client';
import dayjs from '../../lib/dayjs';
import { DistributionRepository, DistributionWithBrokers } from '../distribution/distribution.repository';
import { LeadRepository } from './lead.repository';

/** The outcome of running a lead through the distribution engine. */
export interface DistributionDecision {
  status: LeadStatus;
  assignedBrokerId: number | null;
}

interface EligibleBroker {
  brokerId: number;
  percentage: number;
  sentToday: number;
}

/**
 * Decides how a submitted lead should be routed: duplicate detection,
 * distribution existence, per-broker eligibility (active, under daily cap,
 * within working hours/days), and percentage-share-based assignment among
 * eligible brokers. Depends on DistributionRepository and LeadRepository via
 * constructor injection so it's fully unit-testable against mocked
 * repositories, with "now" passed in rather than read from the clock.
 */
export class DistributionEngineService {
  constructor(
    private readonly distributionRepository: DistributionRepository,
    private readonly leadRepository: LeadRepository,
  ) {}

  /**
   * Decides the status and (if any) broker assignment for a newly submitted
   * lead.
   * @param normalizedEmail - the trimmed, lowercased email of the submitting lead.
   * @param now - the instant to evaluate duplicate/eligibility rules against.
   * @returns the decided status and assigned broker id, if any.
   */
  async decide(normalizedEmail: string, now: Date): Promise<DistributionDecision> {
    const alreadySent = await this.leadRepository.existsSentByEmail(normalizedEmail);
    if (alreadySent) {
      return { status: 'duplicate', assignedBrokerId: null };
    }

    const distribution = await this.distributionRepository.findFirstWithBrokers();
    if (!distribution) {
      return { status: 'unsent', assignedBrokerId: null };
    }

    const eligible = await this.findEligibleBrokers(distribution, now);
    if (eligible.length === 0) {
      return { status: 'unsent', assignedBrokerId: null };
    }

    const winner = this.pickWinner(eligible);
    return { status: 'sent', assignedBrokerId: winner.brokerId };
  }

  private async findEligibleBrokers(distribution: DistributionWithBrokers, now: Date): Promise<EligibleBroker[]> {
    const eligible: EligibleBroker[] = [];

    for (const distributionBroker of distribution.brokers) {
      const { broker } = distributionBroker;

      if (!broker.isActive || !distributionBroker.isActive) {
        continue;
      }
      if (!this.isWorkingDay(now, broker.timezone, broker.workingDays)) {
        continue;
      }
      if (!this.isWithinWorkingHours(now, broker.timezone, broker.openTime, broker.closeTime)) {
        continue;
      }

      const { start, end } = this.dayRangeUtc(now, broker.timezone);
      const sentToday = await this.leadRepository.countSentInRange(broker.id, start, end);
      if (sentToday >= broker.dailyCap) {
        continue;
      }

      eligible.push({ brokerId: broker.id, percentage: distributionBroker.percentage, sentToday });
    }

    return eligible;
  }

  // Highest deficit between target share (after this lead) and today's actual
  // sent count wins; ties go to whichever broker has sent fewer today.
  private pickWinner(eligible: EligibleBroker[]): EligibleBroker {
    const totalSentToday = eligible.reduce((sum, b) => sum + b.sentToday, 0);
    const deficitOf = (b: EligibleBroker): number => ((totalSentToday + 1) * b.percentage) / 100 - b.sentToday;

    return eligible.reduce((best, candidate) => {
      const bestDeficit = deficitOf(best);
      const candidateDeficit = deficitOf(candidate);
      if (candidateDeficit > bestDeficit) {
        return candidate;
      }
      if (candidateDeficit === bestDeficit && candidate.sentToday < best.sentToday) {
        return candidate;
      }
      return best;
    });
  }

  private isWorkingDay(now: Date, timezone: string, workingDays: string): boolean {
    const local = dayjs(now).tz(timezone);
    const day = local.day();
    const isoWeekday = day === 0 ? 7 : day;
    return workingDays
      .split(',')
      .map((d) => Number(d.trim()))
      .includes(isoWeekday);
  }

  private isWithinWorkingHours(now: Date, timezone: string, openTime: string, closeTime: string): boolean {
    const local = dayjs(now).tz(timezone);
    const minutesNow = local.hour() * 60 + local.minute();
    return minutesNow >= this.toMinutes(openTime) && minutesNow < this.toMinutes(closeTime);
  }

  private toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private dayRangeUtc(now: Date, timezone: string): { start: Date; end: Date } {
    const startOfDay = dayjs(now).tz(timezone).startOf('day');
    return { start: startOfDay.toDate(), end: startOfDay.add(1, 'day').toDate() };
  }
}
