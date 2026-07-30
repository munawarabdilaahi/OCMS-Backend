import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
    createAcademicYear,
    listAcademicYears as getAcademicYears,
    getAcademicYearById,
    updateAcademicYear,
    deleteAcademicYear,
} from '../controllers/academic-year.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createAcademicYearSchema, updateAcademicYearSchema } from '../validators/academic-year.validator.js';
import { auditLog } from '../middlewares/audit.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'SuperAdmin'), auditLog('CREATE_ACADEMIC_YEAR'), validate(createAcademicYearSchema), createAcademicYear);
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar', 'Accountant'), getAcademicYears);
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar', 'Accountant'), getAcademicYearById);
router.put('/:id', authorize('Admin', 'SuperAdmin'), auditLog('UPDATE_ACADEMIC_YEAR'), validate(updateAcademicYearSchema), updateAcademicYear);
router.delete('/:id', authorize('Admin', 'SuperAdmin'), auditLog('DELETE_ACADEMIC_YEAR'), deleteAcademicYear);

export default router;
