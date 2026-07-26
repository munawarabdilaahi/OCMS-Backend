import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { getAdminDashboard, getTeacherDashboard, getStudentDashboard } from '../controllers/dashboard.controller.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /dashboard/admin:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get admin dashboard data
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Admin dashboard data
 */
router.get('/admin', authorize('Admin', 'SuperAdmin'), getAdminDashboard);

/**
 * @openapi
 * /dashboard/teacher:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get teacher dashboard data
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Teacher dashboard data
 */
router.get('/teacher', authorize('Teacher'), getTeacherDashboard);

/**
 * @openapi
 * /dashboard/student:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get student dashboard data
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Student dashboard data
 */
router.get('/student', authorize('Student'), getStudentDashboard);

export default router;
