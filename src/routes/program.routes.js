import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
    createProgram,
    listPrograms as getPrograms,
    getProgramById,
    updateProgram,
    deleteProgram,
} from '../controllers/program.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createProgramSchema, updateProgramSchema } from '../validators/program.validator.js';
import { auditLog } from '../middlewares/audit.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'SuperAdmin'), auditLog('CREATE_PROGRAM'), validate(createProgramSchema), createProgram);
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar', 'Accountant'), getPrograms);
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar', 'Accountant'), getProgramById);
router.put('/:id', authorize('Admin', 'SuperAdmin'), auditLog('UPDATE_PROGRAM'), validate(updateProgramSchema), updateProgram);
router.delete('/:id', authorize('Admin', 'SuperAdmin'), auditLog('DELETE_PROGRAM'), deleteProgram);

export default router;
