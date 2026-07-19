import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { createStudent, deleteStudent, getStudentById, getStudents, getStats, updateStudent, updateStudentStatus } from '../controllers/student.controller.js';

const router = Router();

router.use(authenticate);

router.get('/stats', authorize('Admin', 'SuperAdmin', 'Teacher'), getStats);
router.post('/', authorize('Admin', 'SuperAdmin', 'Teacher'), createStudent);
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher'), getStudents);
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getStudentById);
router.put('/:id', authorize('Admin', 'SuperAdmin', 'Teacher'), updateStudent);
router.patch('/:id/status', authorize('Admin', 'SuperAdmin'), updateStudentStatus);
router.delete('/:id', authorize('Admin', 'SuperAdmin'), deleteStudent);

export default router;
