import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { getAdminDashboard, getTeacherDashboard, getStudentDashboard } from '../controllers/dashboard.controller.js';

const router = Router();

router.use(authenticate);

router.get('/admin', authorize('Admin', 'SuperAdmin'), getAdminDashboard);
router.get('/teacher', authorize('Teacher'), getTeacherDashboard);
router.get('/student', authorize('Student'), getStudentDashboard);

export default router;
