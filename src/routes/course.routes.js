import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { createCourse, deleteCourse, getCourseById, getCourses, updateCourse } from '../controllers/course.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'SuperAdmin'), createCourse);
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getCourses);
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getCourseById);
router.put('/:id', authorize('Admin', 'SuperAdmin'), updateCourse);
router.delete('/:id', authorize('Admin', 'SuperAdmin'), deleteCourse);

export default router;
