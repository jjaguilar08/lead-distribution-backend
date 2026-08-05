import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { validate } from '../../middleware/validate';
import { DistributionRepository } from '../distribution/distribution.repository';
import { FormRepository } from '../form/form.repository';
import { DistributionEngineService } from './distribution-engine.service';
import { LeadController } from './lead.controller';
import { LeadRepository } from './lead.repository';
import { LeadService } from './lead.service';
import { assignLeadSchema, submitLeadSchema } from './lead.validation';

const leadRepository = new LeadRepository();
const distributionEngineService = new DistributionEngineService(new DistributionRepository(), leadRepository);
const leadController = new LeadController(
  new LeadService(leadRepository, new FormRepository(), distributionEngineService),
);

const router = Router();
router.get('/', requireAuth, leadController.list);
router.patch('/:id/assign', requireAuth, validate(assignLeadSchema), leadController.assign);

/** Public, unauthenticated routes — mounted separately at /api/public/leads. */
export const leadPublicRoutes = Router();
leadPublicRoutes.post('/:slug', validate(submitLeadSchema), leadController.submitPublicLead);

export default router;
