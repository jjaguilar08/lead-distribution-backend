import { LeadService } from './lead.service';

/**
 * Parses req/res for the lead module and delegates to LeadService.
 * No business logic here. Stub for Day 1; handlers land on Day 2.
 */
export class LeadController {
  constructor(private readonly leadService: LeadService) {}
}
