import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { validate } from '../../middleware/validate';
import { BrokerController } from './broker.controller';
import { BrokerRepository } from './broker.repository';
import { BrokerService } from './broker.service';
import { createBrokerSchema, updateBrokerSchema } from './broker.validation';

const router = Router();
const brokerController = new BrokerController(new BrokerService(new BrokerRepository()));

router.get('/', requireAuth, brokerController.list);
router.post('/', requireAuth, validate(createBrokerSchema), brokerController.create);
router.get('/:id', requireAuth, brokerController.getById);
router.patch('/:id', requireAuth, validate(updateBrokerSchema), brokerController.update);
router.get('/:id/leads', requireAuth, brokerController.getLeads);

export default router;
