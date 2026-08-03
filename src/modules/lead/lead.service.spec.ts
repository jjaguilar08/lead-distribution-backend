import { LeadRepository } from './lead.repository';
import { LeadService } from './lead.service';

describe('LeadService', () => {
  it('can be constructed with a LeadRepository', () => {
    const service = new LeadService(new LeadRepository());

    expect(service).toBeInstanceOf(LeadService);
  });
});
