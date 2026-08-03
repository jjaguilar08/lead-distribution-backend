import { FormService } from './form.service';

/**
 * Parses req/res for the form module and delegates to FormService.
 * No business logic here. Stub for Day 1; handlers land on Day 2.
 */
export class FormController {
  constructor(private readonly formService: FormService) {}
}
