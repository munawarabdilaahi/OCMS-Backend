import { Router } from 'express';
import { authenticate, authorize, requirePermission } from '../middlewares/auth.middleware.js';
import { auditLog } from '../middlewares/audit.middleware.js';
import {
    createAttendance,
    getAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceStats,
    bulkCreateAttendance,
} from '../controllers/attendance.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createAttendanceSchema, updateAttendanceSchema, bulkCreateAttendanceSchema } from '../validators/attendance.validator.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /attendance:
 *   post:
 *     tags: [Attendance]
 *     summary: Mark student attendance
 *     description: Records attendance for a student in a specific course session. Requires Teacher, Admin, or SuperAdmin role.
 *     operationId: createAttendance
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Attendance'
 *           example:
 *             student_id: 1
 *             course_id: 1
 *             date: "2024-09-01"
 *             status: PRESENT
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Attendance'
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
router.post('/', authorize('Admin', 'SuperAdmin', 'Teacher'), requirePermission('attendance:manage'), auditLog('CREATE_ATTENDANCE'), validate(createAttendanceSchema), createAttendance);

/**
 * @openapi
 * /attendance/bulk:
 *   post:
 *     tags: [Attendance]
 *     summary: Bulk create attendance records
 *     description: Records attendance for multiple students at once. Requires Teacher, Admin, or SuperAdmin role.
 *     operationId: bulkCreateAttendance
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               attendance_list:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Attendance'
 *     responses:
 *       201:
 *         description: Attendance records created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/bulk', authorize('Admin', 'SuperAdmin', 'Teacher'), requirePermission('attendance:manage'), auditLog('BULK_CREATE_ATTENDANCE'), validate(bulkCreateAttendanceSchema), bulkCreateAttendance);

/**
 * @openapi
 * /attendance:
 *   get:
 *     tags: [Attendance]
 *     summary: List attendance records with pagination
 *     description: Returns a paginated list of attendance records with optional date, course, and student filtering.
 *     operationId: listAttendance
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
 *         name: course_id
 *         schema:
 *           type: integer
 *         description: Filter by course ID
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: integer
 *         description: Filter by student ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PRESENT, ABSENT, LATE]
 *         description: Filter by attendance status
 *     responses:
 *       200:
 *         description: Attendance records retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedData'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Attendance'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), requirePermission('attendance:view'), getAttendance);

/**
 * @openapi
 * /attendance/stats:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance statistics
 *     description: Returns aggregate attendance statistics for the current user's context.
 *     operationId: getAttendanceStats
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Attendance statistics
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/AttendanceStats'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/stats', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), requirePermission('attendance:view'), getAttendanceStats);

/**
 * @openapi
 * /attendance/{id}:
 *   put:
 *     tags: [Attendance]
 *     summary: Update attendance record
 *     description: Updates an existing attendance record. Requires Teacher, Admin, or SuperAdmin role.
 *     operationId: updateAttendance
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Attendance record ID
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
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, LATE]
 *                 example: PRESENT
 *     responses:
 *       200:
 *         description: Attendance updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Attendance'
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
router.put('/:id', authorize('Admin', 'SuperAdmin', 'Teacher'), requirePermission('attendance:manage'), auditLog('UPDATE_ATTENDANCE'), validate(updateAttendanceSchema), updateAttendance);

/**
 * @openapi
 * /attendance/{id}:
 *   delete:
 *     tags: [Attendance]
 *     summary: Delete attendance record
 *     description: Deletes an attendance record by its ID. Requires Admin or SuperAdmin role.
 *     operationId: deleteAttendance
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Attendance record ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Attendance record deleted successfully
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
router.delete('/:id', authorize('Admin', 'SuperAdmin', 'Teacher'), requirePermission('attendance:manage'), auditLog('DELETE_ATTENDANCE'), deleteAttendance);

export default router;
