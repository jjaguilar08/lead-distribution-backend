import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

const router = Router();
const authController = new AuthController(new AuthService(new AuthRepository()));

router.post('/login', authController.login);
router.get('/me', requireAuth, authController.me);

export default router;
