import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema } from '../validators/user.validator.js';
import { createUser, deleteUser, getUserById, getUsers, updateUser } from '../controllers/user.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('Admin', 'SuperAdmin'), getUsers);
router.get('/:id', authorize('Admin', 'SuperAdmin'), getUserById);
router.post('/', authorize('Admin', 'SuperAdmin'), validate(createUserSchema), createUser);
router.put('/:id', authorize('Admin', 'SuperAdmin'), validate(updateUserSchema), updateUser);
router.delete('/:id', authorize('Admin', 'SuperAdmin'), deleteUser);

export default router;
