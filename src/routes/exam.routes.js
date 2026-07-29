import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { auditLog } from '../middlewares/audit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
    createExamSchedule,
    getExamSchedules,
    updateExamSchedule,
    deleteExamSchedule,
    createCourseExam,
    getCourseExams,
    getCourseExamById,
    submitExamResult,
    getExamResults,
} from '../controllers/exam.controller.js';
import {
    createExamScheduleSchema,
    updateExamScheduleSchema,
    createCourseExamSchema,
    submitExamResultSchema,
} from '../validators/exam.validator.js';

const router = Router();

router.use(authenticate);

// --- Exam Schedule ---
/**
 * @openapi
 * /exams/schedules:
 *   post:
 *     tags: [Exams]
 *     summary: Create an exam schedule
 *     description: Creates a new exam schedule entry. Requires Admin or SuperAdmin role.
 *     operationId: createExamSchedule
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExamSchedule'
 *           example:
 *             title: Midterm Exams 2024
 *             description: Midterm examination period for Fall 2024
 *             start_date: "2024-10-15"
 *             end_date: "2024-10-30"
 *     responses:
 *       201:
 *         description: Exam schedule created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/ExamSchedule'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/schedules', authorize('Admin', 'SuperAdmin'), auditLog('CREATE_EXAM_SCHEDULE'), validate(createExamScheduleSchema), createExamSchedule);

/**
 * @openapi
 * /exams/schedules:
 *   get:
 *     tags: [Exams]
 *     summary: List exam schedules
 *     description: Returns all exam schedules.
 *     operationId: listExamSchedules
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Exam schedules list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ExamSchedule'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/schedules', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getExamSchedules);

/**
 * @openapi
 * /exams/schedules/{id}:
 *   put:
 *     tags: [Exams]
 *     summary: Update exam schedule
 *     description: Updates an exam schedule. Requires Admin or SuperAdmin role.
 *     operationId: updateExamSchedule
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Exam schedule ID
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
 *               title: { type: string, example: Final Exams 2024 }
 *               description: { type: string, example: Final examination period }
 *               start_date: { type: string, format: date, example: "2024-12-01" }
 *               end_date: { type: string, format: date, example: "2024-12-20" }
 *     responses:
 *       200:
 *         description: Exam schedule updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/ExamSchedule'
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
router.put('/schedules/:id', authorize('Admin', 'SuperAdmin'), auditLog('UPDATE_EXAM_SCHEDULE'), validate(updateExamScheduleSchema), updateExamSchedule);

/**
 * @openapi
 * /exams/schedules/{id}:
 *   delete:
 *     tags: [Exams]
 *     summary: Delete exam schedule
 *     description: Deletes an exam schedule. Requires Admin or SuperAdmin role.
 *     operationId: deleteExamSchedule
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Exam schedule ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Exam schedule deleted
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
router.delete('/schedules/:id', authorize('Admin', 'SuperAdmin'), auditLog('DELETE_EXAM_SCHEDULE'), deleteExamSchedule);

// --- Course Exam ---
/**
 * @openapi
 * /exams/course-exams:
 *   post:
 *     tags: [Exams]
 *     summary: Create a course exam
 *     description: Creates an exam for a specific course. Requires Admin or SuperAdmin role.
 *     operationId: createCourseExam
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseExam'
 *           example:
 *             course_id: 1
 *             exam_schedule_id: 1
 *             exam_date: "2024-10-16"
 *             start_time: "09:00"
 *             end_time: "11:00"
 *             total_marks: 100
 *             passing_marks: 40
 *     responses:
 *       201:
 *         description: Course exam created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/CourseExam'
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
router.post('/course-exams', authorize('Admin', 'SuperAdmin'), auditLog('CREATE_COURSE_EXAM'), validate(createCourseExamSchema), createCourseExam);

/**
 * @openapi
 * /exams/course-exams:
 *   get:
 *     tags: [Exams]
 *     summary: List course exams
 *     description: Returns all course exams with optional filtering by course or schedule.
 *     operationId: listCourseExams
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: course_id
 *         schema:
 *           type: integer
 *         description: Filter by course ID
 *       - in: query
 *         name: exam_schedule_id
 *         schema:
 *           type: integer
 *         description: Filter by exam schedule ID
 *     responses:
 *       200:
 *         description: Course exams list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CourseExam'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/course-exams', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getCourseExams);

/**
 * @openapi
 * /exams/course-exams/{id}:
 *   get:
 *     tags: [Exams]
 *     summary: Get course exam by ID
 *     description: Returns details of a specific course exam.
 *     operationId: getCourseExamById
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Course exam ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Course exam retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/CourseExam'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/course-exams/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getCourseExamById);

// --- Exam Result ---
/**
 * @openapi
 * /exams/results:
 *   post:
 *     tags: [Exams]
 *     summary: Submit exam result
 *     description: Records a student's result for a course exam. Requires Admin, SuperAdmin, or Teacher role.
 *     operationId: submitExamResult
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExamResult'
 *           example:
 *             course_exam_id: 1
 *             student_id: 1
 *             marks_obtained: 85
 *             grade: A
 *             remarks: Excellent performance
 *     responses:
 *       201:
 *         description: Exam result submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/ExamResult'
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
router.post('/results', authorize('Admin', 'SuperAdmin', 'Teacher'), auditLog('SUBMIT_EXAM_RESULT'), validate(submitExamResultSchema), submitExamResult);

/**
 * @openapi
 * /exams/results:
 *   get:
 *     tags: [Exams]
 *     summary: List exam results
 *     description: Returns exam results with optional filtering by student, course exam, or grade.
 *     operationId: listExamResults
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: integer
 *         description: Filter by student ID
 *       - in: query
 *         name: course_exam_id
 *         schema:
 *           type: integer
 *         description: Filter by course exam ID
 *       - in: query
 *         name: grade
 *         schema:
 *           type: string
 *         description: Filter by grade
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
 *     responses:
 *       200:
 *         description: Exam results list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedData'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ExamResult'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/results', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getExamResults);

export default router;
