import { DistributionService } from './distribution.service';

/**
 * Parses req/res for the distribution module and delegates to DistributionService.
 * No business logic here. Stub for Day 1; handlers land on Day 2.
 */
export class DistributionController {
  constructor(private readonly distributionService: DistributionService) {}
}
