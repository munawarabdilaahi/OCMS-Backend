import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createExamScheduleSchema, submitExamResultSchema, createCourseExamSchema, updateExamScheduleSchema } from '../validators/exam.validator.js';
import { createCourseExam, createExamSchedule, deleteExamSchedule, getCourseExamById, getCourseExams, getExamResults, getExamSchedules, submitExamResult, updateExamSchedule } from '../controllers/exam.controller.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /exams/schedules:
 *   post:
 *     tags: [Exams]
 *     summary: Create an exam schedule
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course_id: { type: number }
 *               title: { type: string }
 *               exam_date: { type: string, format: date }
 *               exam_type: { type: string }
 *               start_time: { type: string }
 *               end_time: { type: string }
 *               room: { type: string }
 *     responses:
 *       201:
 *         description: Exam schedule created
 */
router.post('/schedules', authorize('Admin', 'SuperAdmin', 'Teacher'), validate(createExamScheduleSchema), createExamSchedule);

/**
 * @openapi
 * /exams/schedules:
 *   get:
 *     tags: [Exams]
 *     summary: List exam schedules with pagination
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
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Exam schedules list
 */
router.get('/schedules', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getExamSchedules);

/**
 * @openapi
 * /exams/schedules/{id}:
 *   put:
 *     tags: [Exams]
 *     summary: Update an exam schedule
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
 *               exam_date: { type: string, format: date }
 *               room: { type: string }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Exam schedule updated
 */
router.put('/schedules/:id', authorize('Admin', 'SuperAdmin', 'Teacher'), validate(updateExamScheduleSchema), updateExamSchedule);

/**
 * @openapi
 * /exams/schedules/{id}:
 *   delete:
 *     tags: [Exams]
 *     summary: Cancel an exam schedule
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Exam schedule cancelled
 */
router.delete('/schedules/:id', authorize('Admin', 'SuperAdmin', 'Teacher'), deleteExamSchedule);

/**
 * @openapi
 * /exams/results:
 *   post:
 *     tags: [Exams]
 *     summary: Submit exam result
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
 *               exam_schedule_id: { type: number }
 *               midterm_score: { type: number }
 *               final_score: { type: number }
 *               activity_score: { type: number }
 *     responses:
 *       201:
 *         description: Exam result submitted
 */
router.post('/results', authorize('Admin', 'SuperAdmin', 'Teacher'), validate(submitExamResultSchema), submitExamResult);

/**
 * @openapi
 * /exams/results:
 *   get:
 *     tags: [Exams]
 *     summary: List exam results with pagination
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
 *     responses:
 *       200:
 *         description: Exam results list
 */
router.get('/results', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getExamResults);

/**
 * @openapi
 * /exams/course-exams:
 *   post:
 *     tags: [Exams]
 *     summary: Create a course exam
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course_id: { type: number }
 *               title: { type: string }
 *               instructions: { type: string }
 *               duration_minutes: { type: number }
 *               questions: { type: array, items: { type: object } }
 *     responses:
 *       201:
 *         description: Course exam created
 */
router.post('/course-exams', authorize('Admin', 'SuperAdmin', 'Teacher'), validate(createCourseExamSchema), createCourseExam);

/**
 * @openapi
 * /exams/course-exams:
 *   get:
 *     tags: [Exams]
 *     summary: List course exams with pagination
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
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Course exams list
 */
router.get('/course-exams', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getCourseExams);

/**
 * @openapi
 * /exams/course-exams/{id}:
 *   get:
 *     tags: [Exams]
 *     summary: Get course exam by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Course exam data
 *       404:
 *         description: Course exam not found
 */
router.get('/course-exams/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getCourseExamById);

export default router;
