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
 *     description: Returns comprehensive dashboard data for administrators including total students, teachers, courses, attendance rates, and revenue overview.
 *     operationId: getAdminDashboard
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Admin dashboard data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/AdminDashboard'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/admin', authorize('Admin', 'SuperAdmin', 'Registrar', 'Accountant'), getAdminDashboard);

/**
 * @openapi
 * /dashboard/teacher:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get teacher dashboard data
 *     description: Returns dashboard data for teachers including assigned courses, class schedules, student lists, and attendance summaries.
 *     operationId: getTeacherDashboard
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Teacher dashboard data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/TeacherDashboard'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/teacher', authorize('Teacher'), getTeacherDashboard);

/**
 * @openapi
 * /dashboard/student:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get student dashboard data
 *     description: Returns dashboard data for students including enrolled courses, attendance records, exam results, fee status, and upcoming schedules.
 *     operationId: getStudentDashboard
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Student dashboard data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/StudentDashboard'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/student', authorize('Student'), getStudentDashboard);

export default router;
