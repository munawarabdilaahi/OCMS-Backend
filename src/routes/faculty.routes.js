import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
    createFaculty,
    listFaculties as getFaculties,
    getFacultyById,
    updateFaculty,
    deleteFaculty,
    getFacultyStats,
} from '../controllers/faculty.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createFacultySchema, updateFacultySchema } from '../validators/faculty.validator.js';
import { auditLog } from '../middlewares/audit.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'SuperAdmin'), auditLog('CREATE_FACULTY'), validate(createFacultySchema), createFaculty);
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar', 'Accountant'), getFaculties);
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar', 'Accountant'), getFacultyById);
router.get('/:id/stats', authorize('Admin', 'SuperAdmin'), getFacultyStats);
router.put('/:id', authorize('Admin', 'SuperAdmin'), auditLog('UPDATE_FACULTY'), validate(updateFacultySchema), updateFaculty);
router.delete('/:id', authorize('Admin', 'SuperAdmin'), auditLog('DELETE_FACULTY'), deleteFaculty);

export default router;