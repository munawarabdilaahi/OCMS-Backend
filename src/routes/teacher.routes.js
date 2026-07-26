import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createTeacherSchema, updateTeacherSchema } from '../validators/teacher.validator.js';
import { createTeacher, deleteTeacher, getTeacherById, getTeachers, updateTeacher } from '../controllers/teacher.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'SuperAdmin'), validate(createTeacherSchema), createTeacher);
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher'), getTeachers);
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher'), getTeacherById);
router.put('/:id', authorize('Admin', 'SuperAdmin'), validate(updateTeacherSchema), updateTeacher);
router.delete('/:id', authorize('Admin', 'SuperAdmin'), deleteTeacher);

export default router;
