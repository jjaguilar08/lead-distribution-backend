import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { validate } from '../../middleware/validate';
import { BrokerRepository } from '../broker/broker.repository';
import { FormRepository } from '../form/form.repository';
import { LeadRepository } from '../lead/lead.repository';
import { DistributionController } from './distribution.controller';
import { DistributionRepository } from './distribution.repository';
import { DistributionService } from './distribution.service';
import { replaceDistributionBrokersSchema } from './distribution.validation';

const router = Router();
const distributionController = new DistributionController(
  new DistributionService(
    new DistributionRepository(),
    new FormRepository(),
    new LeadRepository(),
    new BrokerRepository(),
  ),
);

router.get('/', requireAuth, distributionController.getCurrent);
router.post('/', requireAuth, distributionController.create);
router.put('/brokers', requireAuth, validate(replaceDistributionBrokersSchema), distributionController.replaceBrokers);
router.get('/:id', requireAuth, distributionController.getDetail);

export default router;
