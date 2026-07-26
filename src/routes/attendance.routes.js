import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createAttendanceSchema, bulkCreateAttendanceSchema, updateAttendanceSchema } from '../validators/attendance.validator.js';
import { createAttendance, deleteAttendance, getAttendance, getAttendanceStats, bulkCreateAttendance, updateAttendance } from '../controllers/attendance.controller.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /attendance:
 *   post:
 *     tags: [Attendance]
 *     summary: Create attendance record
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
 *               date: { type: string, format: date }
 *               status: { type: string, enum: [PRESENT, ABSENT, LATE] }
 *               remarks: { type: string }
 *     responses:
 *       201:
 *         description: Attendance created
 */
router.post('/', authorize('Admin', 'SuperAdmin', 'Teacher'), validate(createAttendanceSchema), createAttendance);

/**
 * @openapi
 * /attendance/bulk:
 *   post:
 *     tags: [Attendance]
 *     summary: Bulk create attendance records
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course_id: { type: number }
 *               date: { type: string, format: date }
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     student_id: { type: number }
 *                     status: { type: string, enum: [PRESENT, ABSENT, LATE] }
 *                     remarks: { type: string }
 *     responses:
 *       201:
 *         description: Bulk attendance created
 */
router.post('/bulk', authorize('Admin', 'SuperAdmin', 'Teacher'), validate(bulkCreateAttendanceSchema), bulkCreateAttendance);

/**
 * @openapi
 * /attendance:
 *   get:
 *     tags: [Attendance]
 *     summary: List attendance records with pagination
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: number }
 *       - in: query
 *         name: limit
 *         schema: { type: number }
 *       - in: query
 *         name: course_id
 *         schema: { type: number }
 *       - in: query
 *         name: student_id
 *         schema: { type: number }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Attendance records list
 */
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getAttendance);

/**
 * @openapi
 * /attendance/stats:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance statistics
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: course_id
 *         schema: { type: number }
 *       - in: query
 *         name: student_id
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Attendance stats
 */
router.get('/stats', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getAttendanceStats);

/**
 * @openapi
 * /attendance/{id}:
 *   put:
 *     tags: [Attendance]
 *     summary: Update attendance record
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
 *               status: { type: string, enum: [PRESENT, ABSENT, LATE] }
 *               remarks: { type: string }
 *     responses:
 *       200:
 *         description: Attendance updated
 */
router.put('/:id', authorize('Admin', 'SuperAdmin', 'Teacher'), validate(updateAttendanceSchema), updateAttendance);

/**
 * @openapi
 * /attendance/{id}:
 *   delete:
 *     tags: [Attendance]
 *     summary: Delete attendance record
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Attendance deleted
 */
router.delete('/:id', authorize('Admin', 'SuperAdmin'), deleteAttendance);

export default router;
