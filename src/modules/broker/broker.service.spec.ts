import { BrokerRepository } from './broker.repository';
import { BrokerService } from './broker.service';

describe('BrokerService', () => {
  it('can be constructed with a BrokerRepository', () => {
    const service = new BrokerService(new BrokerRepository());

    expect(service).toBeInstanceOf(BrokerService);
  });
});
