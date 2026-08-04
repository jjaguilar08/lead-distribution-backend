import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { BrokerController } from './broker.controller';
import { BrokerRepository } from './broker.repository';
import { BrokerService } from './broker.service';

const router = Router();
const brokerController = new BrokerController(new BrokerService(new BrokerRepository()));

router.get('/', requireAuth, brokerController.list);
router.post('/', requireAuth, brokerController.create);
router.get('/:id', requireAuth, brokerController.getById);
router.patch('/:id', requireAuth, brokerController.update);
router.get('/:id/leads', requireAuth, brokerController.getLeads);

export default router;
