import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
    createLevel,
    listLevels as getLevels,
    getLevelById,
    updateLevel,
    deleteLevel,
} from '../controllers/level.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createLevelSchema, updateLevelSchema } from '../validators/level.validator.js';
import { auditLog } from '../middlewares/audit.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'SuperAdmin'), auditLog('CREATE_LEVEL'), validate(createLevelSchema), createLevel);
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar', 'Accountant'), getLevels);
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar', 'Accountant'), getLevelById);
router.put('/:id', authorize('Admin', 'SuperAdmin'), auditLog('UPDATE_LEVEL'), validate(updateLevelSchema), updateLevel);
router.delete('/:id', authorize('Admin', 'SuperAdmin'), auditLog('DELETE_LEVEL'), deleteLevel);

export default router;
