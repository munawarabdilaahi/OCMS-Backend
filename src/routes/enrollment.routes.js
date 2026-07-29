import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { auditLog } from '../middlewares/audit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createEnrollmentSchema } from '../validators/enrollment.validator.js';
import {
    createEnrollment,
    getEnrollments,
    deleteEnrollment,
} from '../controllers/enrollment.controller.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /enrollments:
 *   post:
 *     tags: [Enrollments]
 *     summary: Enroll a student in a course
 *     description: Creates a new enrollment record linking a student to a course. Requires Admin or SuperAdmin role.
 *     operationId: createEnrollment
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Enrollment'
 *           example:
 *             student_id: 1
 *             course_id: 1
 *             status: ACTIVE
 *     responses:
 *       201:
 *         description: Enrollment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Enrollment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', authorize('Admin', 'SuperAdmin', 'Registrar'), auditLog('CREATE_ENROLLMENT'), validate(createEnrollmentSchema), createEnrollment);

/**
 * @openapi
 * /enrollments:
 *   get:
 *     tags: [Enrollments]
 *     summary: List enrollments with pagination
 *     description: Returns a paginated list of enrollments with optional student and course filtering.
 *     operationId: listEnrollments
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: integer
 *         description: Filter by student ID
 *       - in: query
 *         name: course_id
 *         schema:
 *           type: integer
 *         description: Filter by course ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, DROPPED, WITHDRAWN]
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: Enrollments list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedData'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Enrollment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar'), getEnrollments);

/**
 * @openapi
 * /enrollments/{id}:
 *   delete:
 *     tags: [Enrollments]
 *     summary: Delete an enrollment
 *     description: Deletes an enrollment record. Requires Admin or SuperAdmin role.
 *     operationId: deleteEnrollment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Enrollment ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Enrollment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:id', authorize('Admin', 'SuperAdmin'), auditLog('DELETE_ENROLLMENT'), deleteEnrollment);

export default router;
