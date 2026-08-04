import { Request, Response } from 'express';
import { InvalidIdError, parseId } from '../../lib/parse-id';
import {
  DistributionAlreadyExistsError,
  DistributionNotFoundError,
  InvalidPercentageError,
  NoFormError,
  DistributionService,
} from './distribution.service';
import { ReplaceDistributionBrokersDto } from './distribution.types';

/** Parses req/res for the distribution module and delegates to DistributionService. No business logic here. */
export class DistributionController {
  constructor(private readonly distributionService: DistributionService) {}

  /**
   * Handles GET /api/distribution — returns the distribution, or null if
   * none has been created yet. Only one distribution is ever allowed to
   * exist, so this is the lookup callers use instead of guessing an id.
   * @param _req - the Express request.
   * @param res - the Express response.
   * @returns a promise that resolves once the response has been sent.
   */
  getCurrent = async (_req: Request, res: Response): Promise<void> => {
    const distribution = await this.distributionService.getCurrent();
    res.status(200).json({ distribution });
  };

  /**
   * Handles POST /api/distribution — creates the distribution, auto-linked
   * to the existing form.
   * @param _req - the Express request.
   * @param res - the Express response.
   * @returns a promise that resolves once the response has been sent.
   */
  create = async (_req: Request, res: Response): Promise<void> => {
    try {
      const distribution = await this.distributionService.create();
      res.status(201).json({ distribution });
    } catch (err) {
      if (err instanceof NoFormError) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err instanceof DistributionAlreadyExistsError) {
        res.status(409).json({ error: err.message });
        return;
      }
      throw err;
    }
  };

  /**
   * Handles PUT /api/distribution/brokers — replaces the full set of
   * DistributionBroker rows for the distribution.
   * @param req - the Express request, expecting a ReplaceDistributionBrokersDto body.
   * @param res - the Express response.
   * @returns a promise that resolves once the response has been sent.
   */
  replaceBrokers = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as ReplaceDistributionBrokersDto;
      const brokers = await this.distributionService.replaceBrokers(dto);
      res.status(200).json({ brokers });
    } catch (err) {
      if (err instanceof DistributionNotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err instanceof InvalidPercentageError) {
        res.status(400).json({ error: err.message });
        return;
      }
      throw err;
    }
  };

  /**
   * Handles GET /api/distribution/:id — the Distribution Detail page's data
   * source: the distribution, its brokers, and every lead that has ever
   * passed through it.
   * @param req - the Express request, expecting a numeric `id` route param.
   * @param res - the Express response.
   * @returns a promise that resolves once the response has been sent.
   */
  getDetail = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id);
      const detail = await this.distributionService.getDetail(id);
      res.status(200).json(detail);
    } catch (err) {
      if (err instanceof InvalidIdError) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err instanceof DistributionNotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      throw err;
    }
  };
}
