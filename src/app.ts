import cookieParser from 'cookie-parser';
import express, { Express, NextFunction, Request, Response } from 'express';
import authRoutes from './modules/auth/auth.routes';
import brokerRoutes from './modules/broker/broker.routes';
import distributionRoutes from './modules/distribution/distribution.routes';
import formRoutes from './modules/form/form.routes';
import leadRoutes from './modules/lead/lead.routes';

/**
 * Builds and configures the Express application. Exported as a factory (not
 * a singleton) so tests can create isolated instances.
 * @returns a configured Express app, not yet listening.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/brokers', brokerRoutes);
  app.use('/api/forms', formRoutes);
  app.use('/api/distributions', distributionRoutes);
  app.use('/api/leads', leadRoutes);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
