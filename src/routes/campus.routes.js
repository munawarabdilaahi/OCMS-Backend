import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
    createCampus,
    listCampuses as getCampuses,
    getCampusById,
    updateCampus,
    deleteCampus,
    getCampusStats,
} from '../controllers/campus.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createCampusSchema, updateCampusSchema } from '../validators/campus.validator.js';
import { auditLog } from '../middlewares/audit.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'SuperAdmin'), auditLog('CREATE_CAMPUS'), validate(createCampusSchema), createCampus);
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar', 'Accountant'), getCampuses);
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar', 'Accountant'), getCampusById);
router.get('/:id/stats', authorize('Admin', 'SuperAdmin'), getCampusStats);
router.put('/:id', authorize('Admin', 'SuperAdmin'), auditLog('UPDATE_CAMPUS'), validate(updateCampusSchema), updateCampus);
router.delete('/:id', authorize('Admin', 'SuperAdmin'), auditLog('DELETE_CAMPUS'), deleteCampus);

export default router;