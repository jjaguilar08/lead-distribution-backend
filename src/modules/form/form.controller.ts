import { Request, Response } from 'express';
import { paramString } from '../../lib/route-params';
import { FormAlreadyExistsError, FormService } from './form.service';
import { CreateFormDto } from './form.types';

/** Parses req/res for the form module and delegates to FormService. No business logic here. */
export class FormController {
  constructor(private readonly formService: FormService) {}

  /**
   * Handles GET /api/form — returns the form, or null if none has been created yet.
   * @param _req - the Express request.
   * @param res - the Express response.
   * @returns a promise that resolves once the response has been sent.
   */
  getForm = async (_req: Request, res: Response): Promise<void> => {
    const form = await this.formService.getForm();
    res.status(200).json({ form });
  };

  /**
   * Handles POST /api/form — creates the form. Rejects with 409 if a form
   * already exists.
   * @param req - the Express request, expecting a CreateFormDto body.
   * @param res - the Express response.
   * @returns a promise that resolves once the response has been sent.
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as CreateFormDto;
      const form = await this.formService.create(dto);
      res.status(201).json({ form });
    } catch (err) {
      if (err instanceof FormAlreadyExistsError) {
        res.status(409).json({ error: err.message });
        return;
      }
      throw err;
    }
  };

  /**
   * Handles GET /api/public/forms/:slug — returns the form if the slug
   * matches, 404 otherwise. Used by the public lead page to confirm the slug
   * is real before rendering.
   * @param req - the Express request, expecting a `slug` route param.
   * @param res - the Express response.
   * @returns a promise that resolves once the response has been sent.
   */
  getPublicBySlug = async (req: Request, res: Response): Promise<void> => {
    const form = await this.formService.getBySlug(paramString(req.params.slug));
    if (!form) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }
    res.status(200).json({ form });
  };
}
