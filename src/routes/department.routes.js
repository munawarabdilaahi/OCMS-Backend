import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createDepartmentSchema } from '../validators/department.validator.js';
import { listDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment } from '../controllers/department.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher'), listDepartments);
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher'), getDepartmentById);
router.post('/', authorize('Admin', 'SuperAdmin'), validate(createDepartmentSchema), createDepartment);
router.put('/:id', authorize('Admin', 'SuperAdmin'), updateDepartment);
router.delete('/:id', authorize('Admin', 'SuperAdmin'), deleteDepartment);

export default router;
