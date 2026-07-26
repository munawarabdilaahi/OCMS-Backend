import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createEnrollmentSchema } from '../validators/enrollment.validator.js';
import { createEnrollment, getEnrollments, deleteEnrollment } from '../controllers/enrollment.controller.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /enrollments:
 *   post:
 *     tags: [Enrollments]
 *     summary: Enroll a student in a course
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               student_id: { type: number }
 *               course_id: { type: number }
 *     responses:
 *       201:
 *         description: Enrollment created
 */
router.post('/', authorize('Admin', 'SuperAdmin'), validate(createEnrollmentSchema), createEnrollment);

/**
 * @openapi
 * /enrollments:
 *   get:
 *     tags: [Enrollments]
 *     summary: List enrollments with pagination
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: number }
 *       - in: query
 *         name: limit
 *         schema: { type: number }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Enrollments list
 */
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getEnrollments);

/**
 * @openapi
 * /enrollments/{id}:
 *   delete:
 *     tags: [Enrollments]
 *     summary: Remove an enrollment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Enrollment deleted
 */
router.delete('/:id', authorize('Admin', 'SuperAdmin'), deleteEnrollment);

export default router;
