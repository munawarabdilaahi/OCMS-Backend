import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createCourseSchema, updateCourseSchema } from '../validators/course.validator.js';
import { createCourse, deleteCourse, getCourseById, getCourses, updateCourse } from '../controllers/course.controller.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /courses:
 *   post:
 *     tags: [Courses]
 *     summary: Create a new course
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               code: { type: string }
 *               credit_hours: { type: number }
 *               semester: { type: string }
 *               department_id: { type: number }
 *               teacher_id: { type: number }
 *     responses:
 *       201:
 *         description: Course created
 */
router.post('/', authorize('Admin', 'SuperAdmin'), validate(createCourseSchema), createCourse);

/**
 * @openapi
 * /courses:
 *   get:
 *     tags: [Courses]
 *     summary: List courses with pagination
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
 *         description: Courses list
 */
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getCourses);

/**
 * @openapi
 * /courses/{id}:
 *   get:
 *     tags: [Courses]
 *     summary: Get course by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Course data
 *       404:
 *         description: Course not found
 */
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getCourseById);

/**
 * @openapi
 * /courses/{id}:
 *   put:
 *     tags: [Courses]
 *     summary: Update course information
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               code: { type: string }
 *               credit_hours: { type: number }
 *               semester: { type: string }
 *               department_id: { type: number }
 *               teacher_id: { type: number }
 *     responses:
 *       200:
 *         description: Course updated
 */
router.put('/:id', authorize('Admin', 'SuperAdmin'), validate(updateCourseSchema), updateCourse);

/**
 * @openapi
 * /courses/{id}:
 *   delete:
 *     tags: [Courses]
 *     summary: Delete a course
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Course deleted
 */
router.delete('/:id', authorize('Admin', 'SuperAdmin'), deleteCourse);

export default router;
