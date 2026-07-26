import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createEnrollmentSchema } from '../validators/enrollment.validator.js';
import { createEnrollment, getEnrollments, deleteEnrollment } from '../controllers/enrollment.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'SuperAdmin'), validate(createEnrollmentSchema), createEnrollment);
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getEnrollments);
router.delete('/:id', authorize('Admin', 'SuperAdmin'), deleteEnrollment);

export default router;
