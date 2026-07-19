import prisma from '../config/db.js';

const ALLOWED_EXAM_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const ALLOWED_RESULT_STATUSES = ['DRAFT', 'PUBLISHED', 'REVIEWED'];
const ALLOWED_COURSE_EXAM_STATUSES = ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'];
const MAX_SCORE = 100;

const examScheduleDelegate = () => prisma.examSchedule;
const examResultDelegate = () => prisma.examResult;
const courseExamDelegate = () => prisma.courseExam;

function toDecimal(value) {
    if (value === undefined || value === null || value === '') return null;
    return Number(value);
}

function parseJsonBlock(value, fallback = {}) {
    if (value == null || value === '') return fallback;
    if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return fallback; }
    }
    return value;
}

function validateScore(value, fieldName) {
    if (value === null || value === undefined) return true;
    const num = Number(value);
    if (isNaN(num) || num < 0 || num > MAX_SCORE) {
        return `${fieldName} must be a number between 0 and ${MAX_SCORE}.`;
    }
    return null;
}

function paginationMeta(page, limit, total) {
    return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function createExamSchedule(req, res, next) {
    try {
        const { course_id, courseId, title, exam_type, examType, exam_date, examDate, start_time, startTime, end_time, endTime, room, status } = req.body;

        if (!(course_id || courseId) || !title || !(exam_date || examDate)) {
            return res.status(400).json({
                success: false,
                message: 'course_id, title, and exam_date are required.',
            });
        }

        const resolvedStatus = status || 'SCHEDULED';
        if (!ALLOWED_EXAM_STATUSES.includes(resolvedStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed values: ${ALLOWED_EXAM_STATUSES.join(', ')}`,
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
                status: resolvedStatus,
            },
        });
        return res.status(201).json({ success: true, message: 'Exam schedule created successfully.', data: schedule });
    } catch (error) {
        next(error);
    }
}

export async function getExamSchedules(req, res, next) {
    try {
        const page = Math.max(Number(req.query.page || 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
        const skip = (page - 1) * limit;

        const where = {
            ...(req.query.course_id ? { course_id: Number(req.query.course_id) } : {}),
            ...(req.query.status ? { status: req.query.status } : {}),
        };

        const [schedules, total] = await Promise.all([
            examScheduleDelegate().findMany({
                where,
                include: { course: true },
                orderBy: { exam_date: 'asc' },
                skip,
                take: limit,
            }),
            examScheduleDelegate().count({ where }),
        ]);

        return res.status(200).json({
            success: true,
            message: 'Exam schedules retrieved successfully.',
            data: schedules,
            meta: paginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function updateExamSchedule(req, res, next) {
    try {
        const scheduleId = Number(req.params.id);
        const existing = await examScheduleDelegate().findUnique({ where: { id: scheduleId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Exam schedule not found.' });
        }

        const { course_id, courseId, title, exam_type, examType, exam_date, examDate, start_time, startTime, end_time, endTime, room, status } = req.body;

        if (status && !ALLOWED_EXAM_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed values: ${ALLOWED_EXAM_STATUSES.join(', ')}`,
            });
        }

        const schedule = await examScheduleDelegate().update({
            where: { id: scheduleId },
            data: {
                ...(course_id || courseId ? { course_id: Number(course_id || courseId) } : {}),
                ...(title ? { title } : {}),
                ...(exam_type || examType ? { exam_type: exam_type || examType } : {}),
                ...(exam_date || examDate ? { exam_date: new Date(exam_date || examDate) } : {}),
                ...(start_time || startTime ? { start_time: start_time || startTime } : {}),
                ...(end_time || endTime ? { end_time: end_time || endTime } : {}),
                ...(room !== undefined ? { room } : {}),
                ...(status ? { status } : {}),
            },
        });
        return res.status(200).json({ success: true, message: 'Exam schedule updated successfully.', data: schedule });
    } catch (error) {
        next(error);
    }
}

export async function deleteExamSchedule(req, res, next) {
    try {
        const scheduleId = Number(req.params.id);
        const existing = await examScheduleDelegate().findUnique({ where: { id: scheduleId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Exam schedule not found.' });
        }
        await examScheduleDelegate().update({ where: { id: scheduleId }, data: { status: 'CANCELLED' } });
        return res.status(200).json({ success: true, message: 'Exam schedule cancelled successfully.' });
    } catch (error) {
        next(error);
    }
}

export async function submitExamResult(req, res, next) {
    try {
        const { exam_schedule_id, examScheduleId, student_id, studentId, course_id, courseId, midterm_score, midtermScore, final_score, finalScore, activity_score, activityScore, remarks, status } = req.body;

        if (!(student_id || studentId) || !(course_id || courseId)) {
            return res.status(400).json({ success: false, message: 'student_id and course_id are required.' });
        }

        const midterm = toDecimal(midterm_score ?? midtermScore) || 0;
        const final = toDecimal(final_score ?? finalScore) || 0;
        const activity = toDecimal(activity_score ?? activityScore) || 0;

        const scoreError = validateScore(midterm_score ?? midtermScore, 'midterm_score')
            || validateScore(final_score ?? finalScore, 'final_score')
            || validateScore(activity_score ?? activityScore, 'activity_score');
        if (scoreError) {
            return res.status(400).json({ success: false, message: scoreError });
        }

        if (midterm + final + activity > MAX_SCORE) {
            return res.status(400).json({
                success: false,
                message: `Combined scores (${midterm + final + activity}) cannot exceed ${MAX_SCORE}.`,
            });
        }

        const resolvedStatus = status || 'PUBLISHED';
        if (!ALLOWED_RESULT_STATUSES.includes(resolvedStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed values: ${ALLOWED_RESULT_STATUSES.join(', ')}`,
            });
        }

        const total = midterm + final + activity;
        const result = await examResultDelegate().create({
            data: {
                ...(exam_schedule_id || examScheduleId ? { exam_schedule_id: Number(exam_schedule_id || examScheduleId) } : {}),
                student_id: Number(student_id || studentId),
                course_id: Number(course_id || courseId),
                midterm_score: midterm,
                final_score: final,
                activity_score: activity,
                total_score: total,
                remarks,
                status: resolvedStatus,
            },
            include: {
                student: { include: { user: true } },
                course: true,
            },
        });
        return res.status(201).json({ success: true, message: 'Exam result submitted successfully.', data: result });
    } catch (error) {
        next(error);
    }
}

export async function getExamResults(req, res, next) {
    try {
        const page = Math.max(Number(req.query.page || 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
        const skip = (page - 1) * limit;

        const where = {
            ...(req.query.student_id ? { student_id: Number(req.query.student_id) } : {}),
            ...(req.query.course_id ? { course_id: Number(req.query.course_id) } : {}),
            ...(req.query.exam_schedule_id ? { exam_schedule_id: Number(req.query.exam_schedule_id) } : {}),
        };

        const [results, total] = await Promise.all([
            examResultDelegate().findMany({
                where,
                include: {
                    student: { include: { user: true } },
                    course: true,
                    exam_schedule: true,
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            }),
            examResultDelegate().count({ where }),
        ]);

        return res.status(200).json({
            success: true,
            message: 'Exam results retrieved successfully.',
            data: results,
            meta: paginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function createCourseExam(req, res, next) {
    try {
        const { course_id, courseId, title, instructions, duration_minutes, durationMinutes, questions, status } = req.body;

        if (!(course_id || courseId) || !title || !questions) {
            return res.status(400).json({ success: false, message: 'course_id, title, and questions are required.' });
        }

        const resolvedStatus = status || 'DRAFT';
        if (!ALLOWED_COURSE_EXAM_STATUSES.includes(resolvedStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed values: ${ALLOWED_COURSE_EXAM_STATUSES.join(', ')}`,
            });
        }

        const courseExam = await courseExamDelegate().create({
            data: {
                course_id: Number(course_id || courseId),
                title,
                instructions,
                duration_minutes: duration_minutes || durationMinutes ? Number(duration_minutes || durationMinutes) : null,
                questions: parseJsonBlock(questions, []),
                status: resolvedStatus,
            },
            include: { course: true },
        });
        return res.status(201).json({ success: true, message: 'Course exam created successfully.', data: courseExam });
    } catch (error) {
        next(error);
    }
}

export async function getCourseExams(req, res, next) {
    try {
        const page = Math.max(Number(req.query.page || 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
        const skip = (page - 1) * limit;

        const where = {
            ...(req.query.course_id ? { course_id: Number(req.query.course_id) } : {}),
            ...(req.query.status ? { status: req.query.status } : {}),
        };

        const [courseExams, total] = await Promise.all([
            courseExamDelegate().findMany({
                where,
                include: { course: true },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            }),
            courseExamDelegate().count({ where }),
        ]);

        return res.status(200).json({
            success: true,
            message: 'Course exams retrieved successfully.',
            data: courseExams,
            meta: paginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getCourseExamById(req, res, next) {
    try {
        const courseExam = await courseExamDelegate().findUnique({
            where: { id: Number(req.params.id) },
            include: { course: true },
        });
        if (!courseExam) {
            return res.status(404).json({ success: false, message: 'Course exam not found.' });
        }
        return res.status(200).json({ success: true, message: 'Course exam retrieved successfully.', data: courseExam });
    } catch (error) {
        next(error);
    }
}
