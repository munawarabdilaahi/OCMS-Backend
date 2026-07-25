import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createExamScheduleSchema, submitExamResultSchema, createCourseExamSchema, updateExamScheduleSchema } from '../validators/exam.validator.js';
import { createCourseExam, createExamSchedule, deleteExamSchedule, getCourseExamById, getCourseExams, getExamResults, getExamSchedules, submitExamResult, updateExamSchedule } from '../controllers/exam.controller.js';

const router = Router();

router.use(authenticate);

router.post('/schedules', authorize('Admin', 'SuperAdmin', 'Teacher'), validate(createExamScheduleSchema), createExamSchedule);
router.get('/schedules', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getExamSchedules);
router.put('/schedules/:id', authorize('Admin', 'SuperAdmin', 'Teacher'), validate(updateExamScheduleSchema), updateExamSchedule);
router.delete('/schedules/:id', authorize('Admin', 'SuperAdmin', 'Teacher'), deleteExamSchedule);

router.post('/results', authorize('Admin', 'SuperAdmin', 'Teacher'), validate(submitExamResultSchema), submitExamResult);
router.get('/results', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getExamResults);

router.post('/course-exams', authorize('Admin', 'SuperAdmin', 'Teacher'), validate(createCourseExamSchema), createCourseExam);
router.get('/course-exams', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getCourseExams);
router.get('/course-exams/:id', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getCourseExamById);

export default router;
