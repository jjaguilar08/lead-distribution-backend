import { BrokerService } from './broker.service';

/**
 * Parses req/res for the broker module and delegates to BrokerService.
 * No business logic here. Stub for Day 1; handlers land on Day 2.
 */
export class BrokerController {
  constructor(private readonly brokerService: BrokerService) {}
}
