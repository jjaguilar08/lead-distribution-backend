import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { validate } from '../../middleware/validate';
import { FormController } from './form.controller';
import { FormRepository } from './form.repository';
import { FormService } from './form.service';
import { createFormSchema } from './form.validation';

const formController = new FormController(new FormService(new FormRepository()));

const router = Router();
router.get('/', requireAuth, formController.getForm);
router.post('/', requireAuth, validate(createFormSchema), formController.create);

/** Public, unauthenticated routes — mounted separately at /api/public/forms. */
export const formPublicRoutes = Router();
formPublicRoutes.get('/:slug', formController.getPublicBySlug);

export default router;
