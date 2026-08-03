import { FormRepository } from './form.repository';
import { FormService } from './form.service';

describe('FormService', () => {
  it('can be constructed with a FormRepository', () => {
    const service = new FormService(new FormRepository());

    expect(service).toBeInstanceOf(FormService);
  });
});
