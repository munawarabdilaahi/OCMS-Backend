import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
    createDepartment,
    listDepartments as getDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
    getDepartmentStats,
} from '../controllers/department.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../validators/department.validator.js';
import { auditLog } from '../middlewares/audit.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'SuperAdmin'), auditLog('CREATE_DEPARTMENT'), validate(createDepartmentSchema), createDepartment);
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar', 'Accountant'), getDepartments);
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar', 'Accountant'), getDepartmentById);
router.get('/:id/stats', authorize('Admin', 'SuperAdmin'), getDepartmentStats);
router.put('/:id', authorize('Admin', 'SuperAdmin'), auditLog('UPDATE_DEPARTMENT'), validate(updateDepartmentSchema), updateDepartment);
router.delete('/:id', authorize('Admin', 'SuperAdmin'), auditLog('DELETE_DEPARTMENT'), deleteDepartment);

export default router;
