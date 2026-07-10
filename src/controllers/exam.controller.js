import prisma from '../config/db.js';
const examScheduleDelegate = () => prisma.examSchedule;
const examResultDelegate = () => prisma.examResult;
const courseExamDelegate = () => prisma.courseExam;
function toDecimal(value) {
    if (value === undefined || value === null || value === '')
        return null;
    return Number(value);
}
function parseJsonBlock(value, fallback = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}
export async function createExamSchedule(req, res, next) {
    try {
        const { course_id, courseId, title, exam_type, examType, exam_date, examDate, start_time, startTime, end_time, endTime, room, status = 'SCHEDULED', } = req.body;
        if (!(course_id || courseId) || !title || !(exam_date || examDate)) {
            return res.status(400).json({
                success: false,
                message: 'course_id, title, and exam_date are required.',
            });
        }
        const schedule = await examScheduleDelegate().create({
            data: {
                course_id: Number(course_id || courseId),
                title,
                exam_type: exam_type || examType,
                exam_date: new Date(exam_date || examDate),
                start_time: start_time || startTime,
                end_time: end_time || endTime,
                room,
                status,
            },
        });
        return res.status(201).json({
            success: true,
            message: 'Exam schedule created successfully.',
            data: schedule,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getExamSchedules(req, res, next) {
    try {
        const where = {
            ...(req.query.course_id ? { course_id: Number(req.query.course_id) } : {}),
            ...(req.query.status ? { status: req.query.status } : {}),
        };
        const schedules = await examScheduleDelegate().findMany({
            where,
            include: {
                course: true,
            },
            orderBy: { exam_date: 'asc' },
        });
        return res.status(200).json({
            success: true,
            message: 'Exam schedules retrieved successfully.',
            data: schedules,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function submitExamResult(req, res, next) {
    try {
        const { exam_schedule_id, examScheduleId, student_id, studentId, course_id, courseId, midterm_score, midtermScore, final_score, finalScore, activity_score, activityScore, remarks, status = 'PUBLISHED', } = req.body;
        if (!(student_id || studentId) || !(course_id || courseId)) {
            return res.status(400).json({
                success: false,
                message: 'student_id and course_id are required.',
            });
        }
        const midterm = toDecimal(midterm_score ?? midtermScore) || 0;
        const final = toDecimal(final_score ?? finalScore) || 0;
        const activity = toDecimal(activity_score ?? activityScore) || 0;
        const total = midterm + final + activity;
        const result = await examResultDelegate().create({
            data: {
                ...(exam_schedule_id || examScheduleId
                    ? { exam_schedule_id: Number(exam_schedule_id || examScheduleId) }
                    : {}),
                student_id: Number(student_id || studentId),
                course_id: Number(course_id || courseId),
                midterm_score: midterm,
                final_score: final,
                activity_score: activity,
                total_score: total,
                remarks,
                status,
            },
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
                course: true,
            },
        });
        return res.status(201).json({
            success: true,
            message: 'Exam result submitted successfully.',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getExamResults(req, res, next) {
    try {
        const where = {
            ...(req.query.student_id ? { student_id: Number(req.query.student_id) } : {}),
            ...(req.query.course_id ? { course_id: Number(req.query.course_id) } : {}),
            ...(req.query.exam_schedule_id ? { exam_schedule_id: Number(req.query.exam_schedule_id) } : {}),
        };
        const results = await examResultDelegate().findMany({
            where,
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
                course: true,
                exam_schedule: true,
            },
            orderBy: { created_at: 'desc' },
        });
        return res.status(200).json({
            success: true,
            message: 'Exam results retrieved successfully.',
            data: results,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function createCourseExam(req, res, next) {
    try {
        const { course_id, courseId, title, instructions, duration_minutes, durationMinutes, questions, status = 'DRAFT', } = req.body;
        if (!(course_id || courseId) || !title || !questions) {
            return res.status(400).json({
                success: false,
                message: 'course_id, title, and questions are required.',
            });
        }
        const courseExam = await courseExamDelegate().create({
            data: {
                course_id: Number(course_id || courseId),
                title,
                instructions,
                duration_minutes: duration_minutes || durationMinutes ? Number(duration_minutes || durationMinutes) : null,
                questions: parseJsonBlock(questions, []),
                status,
            },
            include: {
                course: true,
            },
        });
        return res.status(201).json({
            success: true,
            message: 'Course exam created successfully.',
            data: courseExam,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getCourseExams(req, res, next) {
    try {
        const where = {
            ...(req.query.course_id ? { course_id: Number(req.query.course_id) } : {}),
            ...(req.query.status ? { status: req.query.status } : {}),
        };
        const courseExams = await courseExamDelegate().findMany({
            where,
            include: {
                course: true,
            },
            orderBy: { created_at: 'desc' },
        });
        return res.status(200).json({
            success: true,
            message: 'Course exams retrieved successfully.',
            data: courseExams,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getCourseExamById(req, res, next) {
    try {
        const courseExam = await courseExamDelegate().findUnique({
            where: { id: Number(req.params.id) },
            include: {
                course: true,
            },
        });
        if (!courseExam) {
            return res.status(404).json({
                success: false,
                message: 'Course exam not found.',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Course exam retrieved successfully.',
            data: courseExam,
        });
    }
    catch (error) {
        next(error);
    }
}
