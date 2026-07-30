import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
    createSemester,
    listSemesters as getSemesters,
    getSemesterById,
    updateSemester,
    deleteSemester,
} from '../controllers/semester.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createSemesterSchema, updateSemesterSchema } from '../validators/semester.validator.js';
import { auditLog } from '../middlewares/audit.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'SuperAdmin'), auditLog('CREATE_SEMESTER'), validate(createSemesterSchema), createSemester);
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar', 'Accountant'), getSemesters);
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar', 'Accountant'), getSemesterById);
router.put('/:id', authorize('Admin', 'SuperAdmin'), auditLog('UPDATE_SEMESTER'), validate(updateSemesterSchema), updateSemester);
router.delete('/:id', authorize('Admin', 'SuperAdmin'), auditLog('DELETE_SEMESTER'), deleteSemester);

export default router;
