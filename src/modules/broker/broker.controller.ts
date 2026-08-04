import { Request, Response } from 'express';
import { InvalidIdError, parseId } from '../../lib/parse-id';
import { BrokerNotFoundError, BrokerService } from './broker.service';
import { CreateBrokerDto, UpdateBrokerDto } from './broker.types';

/** Parses req/res for the broker module and delegates to BrokerService. No business logic here. */
export class BrokerController {
  constructor(private readonly brokerService: BrokerService) {}

  /**
   * Handles GET /api/brokers — returns every broker.
   * @param _req - the Express request.
   * @param res - the Express response.
   * @returns a promise that resolves once the response has been sent.
   */
  list = async (_req: Request, res: Response): Promise<void> => {
    const brokers = await this.brokerService.getAll();
    res.status(200).json({ brokers });
  };

  /**
   * Handles POST /api/brokers — creates a new broker.
   * @param req - the Express request, expecting a CreateBrokerDto body.
   * @param res - the Express response.
   * @returns a promise that resolves once the response has been sent.
   */
  create = async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as CreateBrokerDto;
    const broker = await this.brokerService.create(dto);
    res.status(201).json({ broker });
  };

  /**
   * Handles GET /api/brokers/:id — returns a single broker.
   * @param req - the Express request, expecting a numeric `id` route param.
   * @param res - the Express response.
   * @returns a promise that resolves once the response has been sent.
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id);
      const broker = await this.brokerService.getById(id);
      res.status(200).json({ broker });
    } catch (err) {
      if (err instanceof InvalidIdError) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err instanceof BrokerNotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      throw err;
    }
  };

  /**
   * Handles PATCH /api/brokers/:id — updates an existing broker.
   * @param req - the Express request, expecting a numeric `id` route param and an UpdateBrokerDto body.
   * @param res - the Express response.
   * @returns a promise that resolves once the response has been sent.
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id);
      const dto = req.body as UpdateBrokerDto;
      const broker = await this.brokerService.update(id, dto);
      res.status(200).json({ broker });
    } catch (err) {
      if (err instanceof InvalidIdError) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err instanceof BrokerNotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      throw err;
    }
  };

  /**
   * Handles GET /api/brokers/:id/leads — returns every lead ever assigned to
   * this broker, joined with the form name each lead came through.
   * @param req - the Express request, expecting a numeric `id` route param.
   * @param res - the Express response.
   * @returns a promise that resolves once the response has been sent.
   */
  getLeads = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id);
      const leads = await this.brokerService.getLeadsForBroker(id);
      res.status(200).json({ leads });
    } catch (err) {
      if (err instanceof InvalidIdError) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err instanceof BrokerNotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      throw err;
    }
  };
}
