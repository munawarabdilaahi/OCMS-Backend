import { Router } from 'express';
import { authenticate, authorize, requirePermission } from '../middlewares/auth.middleware.js';
import { auditLog } from '../middlewares/audit.middleware.js';
import {
    createCourse,
    getCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
} from '../controllers/course.controller.js';
import {
    createCourseSchema,
    updateCourseSchema,
} from '../validators/course.validator.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /courses:
 *   post:
 *     tags: [Courses]
 *     summary: Create a new course
 *     description: Creates a new course under a department. Requires Admin or SuperAdmin role.
 *     operationId: createCourse
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *           example:
 *             name: Introduction to Computer Science
 *             code: CS101
 *             description: Fundamentals of computer science and programming.
 *             credits: 3
 *             department_id: 1
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
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
router.post('/', authorize('Admin', 'SuperAdmin'), requirePermission('courses:manage'), auditLog('CREATE_COURSE'), validate(createCourseSchema), createCourse);

/**
 * @openapi
 * /courses:
 *   get:
 *     tags: [Courses]
 *     summary: List courses with pagination
 *     description: Returns a paginated list of courses with optional search and department filtering.
 *     operationId: listCourses
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or course code
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: integer
 *         description: Filter by department ID
 *     responses:
 *       200:
 *         description: Courses list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedData'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar'), requirePermission('courses:view'), getCourses);

/**
 * @openapi
 * /courses/{id}:
 *   get:
 *     tags: [Courses]
 *     summary: Get course by ID
 *     description: Returns detailed information about a specific course including its department.
 *     operationId: getCourseById
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Course ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Course data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student', 'Registrar'), requirePermission('courses:view'), getCourseById);

/**
 * @openapi
 * /courses/{id}:
 *   put:
 *     tags: [Courses]
 *     summary: Update course information
 *     description: Updates course details such as name, code, credits, and description.
 *     operationId: updateCourse
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Course ID
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: Advanced Computer Science }
 *               code: { type: string, example: CS201 }
 *               description: { type: string, example: In-depth study of advanced topics. }
 *               credits: { type: integer, example: 4 }
 *               department_id: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/:id', authorize('Admin', 'SuperAdmin'), requirePermission('courses:manage'), auditLog('UPDATE_COURSE'), validate(updateCourseSchema), updateCourse);

/**
 * @openapi
 * /courses/{id}:
 *   delete:
 *     tags: [Courses]
 *     summary: Delete a course
 *     description: Deletes a course by its ID. Requires Admin or SuperAdmin role.
 *     operationId: deleteCourse
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Course ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Course deleted successfully
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
router.delete('/:id', authorize('Admin', 'SuperAdmin'), requirePermission('courses:manage'), auditLog('DELETE_COURSE'), deleteCourse);

export default router;
