import { DistributionRepository } from './distribution.repository';
import { DistributionService } from './distribution.service';

describe('DistributionService', () => {
  it('can be constructed with a DistributionRepository', () => {
    const service = new DistributionService(new DistributionRepository());

    expect(service).toBeInstanceOf(DistributionService);
  });
});
