import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
    createUniversity,
    listUniversities as getUniversities,
    getUniversityById,
    updateUniversity,
    deleteUniversity,
    getUniversityStats,
} from '../controllers/university.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createUniversitySchema, updateUniversitySchema } from '../validators/university.validator.js';
import { auditLog } from '../middlewares/audit.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'SuperAdmin'), auditLog('CREATE_UNIVERSITY'), validate(createUniversitySchema), createUniversity);
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar', 'Accountant'), getUniversities);
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar', 'Accountant'), getUniversityById);
router.get('/:id/stats', authorize('Admin', 'SuperAdmin'), getUniversityStats);
router.put('/:id', authorize('Admin', 'SuperAdmin'), auditLog('UPDATE_UNIVERSITY'), validate(updateUniversitySchema), updateUniversity);
router.delete('/:id', authorize('Admin', 'SuperAdmin'), auditLog('DELETE_UNIVERSITY'), deleteUniversity);

export default router;
