import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { auditLog } from '../middlewares/audit.middleware.js';
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
 *     description: Returns aggregate student statistics including total, active, inactive counts, department and gender breakdowns, and recent students.
 *     operationId: getStudentStats
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Student statistics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/StudentStats'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/stats', authorize('Admin', 'SuperAdmin', 'Teacher', 'Registrar'), getStats);

/**
 * @openapi
 * /students:
 *   post:
 *     tags: [Students]
 *     summary: Create a new student
 *     description: Creates a new student record with user account.
 *     operationId: createStudent
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             name: Alice Smith
 *             email: alice@ocms.edu
 *             password: password123
 *             phone: "+1234567890"
 *             admission_no: "2024/001"
 *             department_id: 1
 *     responses:
 *       201:
 *         description: Student created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Student'
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
router.post('/', authorize('Admin', 'SuperAdmin', 'Registrar'), auditLog('CREATE_STUDENT'), validate(createStudentSchema), createStudent);

/**
 * @openapi
 * /students:
 *   get:
 *     tags: [Students]
 *     summary: List students with pagination
 *     description: Returns a paginated list of students with optional search and status filtering.
 *     operationId: listStudents
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
 *         description: Search by name, email, admission number, or department
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED, DELETED]
 *         description: Filter by student status
 *     responses:
 *       200:
 *         description: Students list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedData'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Student'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Registrar'), getStudents);

/**
 * @openapi
 * /students/{id}:
 *   get:
 *     tags: [Students]
 *     summary: Get student by ID
 *     description: Returns detailed information about a specific student.
 *     operationId: getStudentById
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Student ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Student data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Student'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getStudentById);

/**
 * @openapi
 * /students/{id}:
 *   put:
 *     tags: [Students]
 *     summary: Update student information
 *     description: Updates personal and academic information for a student.
 *     operationId: updateStudent
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Student ID
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
 *               name: { type: string, example: Alice Smith Updated }
 *               email: { type: string, example: alice.new@ocms.edu }
 *               phone: { type: string, example: "+1234567890" }
 *               department_id: { type: integer, example: 1 }
 *               admission_no: { type: string, example: "2024/001" }
 *               gender: { type: string, enum: [MALE, FEMALE, OTHER] }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Student updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Student'
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
router.put('/:id', authorize('Admin', 'SuperAdmin', 'Registrar'), auditLog('UPDATE_STUDENT'), validate(updateStudentSchema), updateStudent);

/**
 * @openapi
 * /students/{id}/status:
 *   patch:
 *     tags: [Students]
 *     summary: Update student status
 *     description: Updates the activation status of a student (ACTIVE/INACTIVE/SUSPENDED/DELETED).
 *     operationId: updateStudentStatus
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Student ID
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED, DELETED]
 *                 example: ACTIVE
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Student'
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
router.patch('/:id/status', authorize('Admin', 'SuperAdmin', 'Registrar'), auditLog('UPDATE_STUDENT_STATUS'), validate(updateStudentStatusSchema), updateStudentStatus);

/**
 * @openapi
 * /students/{id}:
 *   delete:
 *     tags: [Students]
 *     summary: Delete a student
 *     description: Marks a student as deleted (soft delete).
 *     operationId: deleteStudent
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Student ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Student deleted successfully
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
router.delete('/:id', authorize('Admin', 'SuperAdmin'), auditLog('DELETE_STUDENT'), deleteStudent);

export default router;
