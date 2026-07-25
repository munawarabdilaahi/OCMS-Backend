import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createRoleSchema } from '../validators/role.validator.js';
import { listRoles, getRoleById, createRole, updateRole, deleteRole } from '../controllers/role.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('Admin', 'SuperAdmin'), listRoles);
router.get('/:id', authorize('Admin', 'SuperAdmin'), getRoleById);
router.post('/', authorize('Admin', 'SuperAdmin'), validate(createRoleSchema), createRole);
router.put('/:id', authorize('Admin', 'SuperAdmin'), updateRole);
router.delete('/:id', authorize('Admin', 'SuperAdmin'), deleteRole);

export default router;
