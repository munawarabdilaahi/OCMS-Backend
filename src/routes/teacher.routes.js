import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createTeacherSchema, updateTeacherSchema } from '../validators/teacher.validator.js';
import { createTeacher, deleteTeacher, getTeacherById, getTeachers, updateTeacher } from '../controllers/teacher.controller.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /teachers:
 *   post:
 *     tags: [Teachers]
 *     summary: Create a new teacher
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               department_id: { type: number }
 *               employee_no: { type: string }
 *     responses:
 *       201:
 *         description: Teacher created
 */
router.post('/', authorize('Admin', 'SuperAdmin'), validate(createTeacherSchema), createTeacher);

/**
 * @openapi
 * /teachers:
 *   get:
 *     tags: [Teachers]
 *     summary: List teachers with pagination
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
 *     responses:
 *       200:
 *         description: Teachers list
 */
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher'), getTeachers);

/**
 * @openapi
 * /teachers/{id}:
 *   get:
 *     tags: [Teachers]
 *     summary: Get teacher by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Teacher data
 *       404:
 *         description: Teacher not found
 */
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher'), getTeacherById);

/**
 * @openapi
 * /teachers/{id}:
 *   put:
 *     tags: [Teachers]
 *     summary: Update teacher information
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
 *               name: { type: string }
 *               email: { type: string }
 *               department_id: { type: number }
 *     responses:
 *       200:
 *         description: Teacher updated
 */
router.put('/:id', authorize('Admin', 'SuperAdmin'), validate(updateTeacherSchema), updateTeacher);

/**
 * @openapi
 * /teachers/{id}:
 *   delete:
 *     tags: [Teachers]
 *     summary: Delete a teacher
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Teacher deleted
 */
router.delete('/:id', authorize('Admin', 'SuperAdmin'), deleteTeacher);

export default router;
