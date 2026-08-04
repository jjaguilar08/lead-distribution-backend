import { Request, Response } from 'express';
import { InvalidIdError, parseId } from '../../lib/parse-id';
import { paramString } from '../../lib/route-params';
import { FormNotFoundError, LeadNotFoundError, LeadNotUnsentError, LeadService } from './lead.service';
import { AssignLeadDto, SubmitLeadDto } from './lead.types';

/**
 * Extracts the submitter's IP address from the X-Forwarded-For header
 * (first entry, since the VPS sits behind a reverse proxy that appends to
 * it), falling back to the raw socket address.
 * @param req - the incoming request.
 * @returns the best-available IP address for the request.
 */
function extractIpAddress(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  if (forwardedValue) {
    return forwardedValue.split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? '';
}

/** Parses req/res for the lead module and delegates to LeadService. No business logic here. */
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  /**
   * Handles POST /api/public/leads/:slug — public lead intake. Runs the
   * submission through the distribution engine and saves the result.
   * @param req - the Express request, expecting a `slug` route param and a SubmitLeadDto body.
   * @param res - the Express response.
   * @returns a promise that resolves once the response has been sent.
   */
  submitPublicLead = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as SubmitLeadDto;
      const ipAddress = extractIpAddress(req);
      const lead = await this.leadService.submitPublicLead(paramString(req.params.slug), dto, ipAddress, new Date());
      res.status(201).json({ lead });
    } catch (err) {
      if (err instanceof FormNotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      throw err;
    }
  };

  /**
   * Handles GET /api/leads — returns every lead, all statuses.
   * @param _req - the Express request.
   * @param res - the Express response.
   * @returns a promise that resolves once the response has been sent.
   */
  list = async (_req: Request, res: Response): Promise<void> => {
    const leads = await this.leadService.getAll();
    res.status(200).json({ leads });
  };

  /**
   * Handles PATCH /api/leads/:id/assign — manually assigns a lead to a broker.
   * @param req - the Express request, expecting a numeric `id` route param and an AssignLeadDto body.
   * @param res - the Express response.
   * @returns a promise that resolves once the response has been sent.
   */
  assign = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id);
      const dto = req.body as AssignLeadDto;
      const lead = await this.leadService.assign(id, dto);
      res.status(200).json({ lead });
    } catch (err) {
      if (err instanceof InvalidIdError) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err instanceof LeadNotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err instanceof LeadNotUnsentError) {
        res.status(409).json({ error: err.message });
        return;
      }
      throw err;
    }
  };
}
