import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { FormRepository } from '../form/form.repository';
import { LeadRepository } from '../lead/lead.repository';
import { DistributionController } from './distribution.controller';
import { DistributionRepository } from './distribution.repository';
import { DistributionService } from './distribution.service';

const router = Router();
const distributionController = new DistributionController(
  new DistributionService(new DistributionRepository(), new FormRepository(), new LeadRepository()),
);

router.get('/', requireAuth, distributionController.getCurrent);
router.post('/', requireAuth, distributionController.create);
router.put('/brokers', requireAuth, distributionController.replaceBrokers);
router.get('/:id', requireAuth, distributionController.getDetail);

export default router;
