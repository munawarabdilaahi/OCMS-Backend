import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createStudentSchema, updateStudentSchema, updateStudentStatusSchema } from '../validators/student.validator.js';
import { createStudent, deleteStudent, getStudentById, getStudents, getStats, updateStudent, updateStudentStatus } from '../controllers/student.controller.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /students/stats:
 *   get:
 *     tags: [Students]
 *     summary: Get student statistics
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Student stats
 */
router.get('/stats', authorize('Admin', 'SuperAdmin', 'Teacher'), getStats);

/**
 * @openapi
 * /students:
 *   post:
 *     tags: [Students]
 *     summary: Create a new student
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
 *               phone: { type: string }
 *               department_id: { type: number }
 *               admission_no: { type: string }
 *     responses:
 *       201:
 *         description: Student created
 */
router.post('/', authorize('Admin', 'SuperAdmin'), validate(createStudentSchema), createStudent);

/**
 * @openapi
 * /students:
 *   get:
 *     tags: [Students]
 *     summary: List students with pagination
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
 *         description: Students list
 */
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher'), getStudents);

/**
 * @openapi
 * /students/{id}:
 *   get:
 *     tags: [Students]
 *     summary: Get student by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Student data
 *       404:
 *         description: Student not found
 */
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getStudentById);

/**
 * @openapi
 * /students/{id}:
 *   put:
 *     tags: [Students]
 *     summary: Update student information
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
 *               phone: { type: string }
 *               department_id: { type: number }
 *     responses:
 *       200:
 *         description: Student updated
 */
router.put('/:id', authorize('Admin', 'SuperAdmin'), validate(updateStudentSchema), updateStudent);

/**
 * @openapi
 * /students/{id}/status:
 *   patch:
 *     tags: [Students]
 *     summary: Update student status
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
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', authorize('Admin', 'SuperAdmin'), validate(updateStudentStatusSchema), updateStudentStatus);

/**
 * @openapi
 * /students/{id}:
 *   delete:
 *     tags: [Students]
 *     summary: Delete a student
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Student deleted
 */
router.delete('/:id', authorize('Admin', 'SuperAdmin'), deleteStudent);

export default router;
