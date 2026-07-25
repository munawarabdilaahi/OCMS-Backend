import prisma from '../config/db.js';
import { getPaginationParams } from '../utils/pagination.js';

export async function createExamSchedule(data) {
    const { course_id, courseId, title, exam_type, examType, exam_date, examDate, start_time, startTime, end_time, endTime, room, status } = data;
    const resolvedStatus = status || 'SCHEDULED';

    const schedule = await prisma.examSchedule.create({
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
    return schedule;
}

export async function updateExamSchedule(id, body) {
    const scheduleId = Number(id);
    const existing = await prisma.examSchedule.findUnique({ where: { id: scheduleId } });
    if (!existing) {
        const error = new Error('Exam schedule not found.');
        error.statusCode = 404;
        throw error;
    }

    const { course_id, courseId, title, exam_type, examType, exam_date, examDate, start_time, startTime, end_time, endTime, room, status } = body;

    const schedule = await prisma.examSchedule.update({
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

    return schedule;
}

export async function deleteExamSchedule(id) {
    const scheduleId = Number(id);
    const existing = await prisma.examSchedule.findUnique({ where: { id: scheduleId } });
    if (!existing) {
        const error = new Error('Exam schedule not found.');
        error.statusCode = 404;
        throw error;
    }
    await prisma.examSchedule.update({ where: { id: scheduleId }, data: { status: 'CANCELLED' } });
}

export async function getCourseExamById(id) {
    return prisma.courseExam.findUnique({
        where: { id: Number(id) },
        include: { course: true },
    });
}

function toDecimal(value) {
    if (value === undefined || value === null || value === '') return null;
    return Number(value);
}

const MAX_SCORE = 100;

function validateScore(value, fieldName) {
    if (value === null || value === undefined) return true;
    const num = Number(value);
    if (isNaN(num) || num < 0 || num > MAX_SCORE) {
        return `${fieldName} must be a number between 0 and ${MAX_SCORE}.`;
    }
    return null;
}

export async function submitExamResult(data) {
    const { exam_schedule_id, examScheduleId, student_id, studentId, course_id, courseId, midterm_score, midtermScore, final_score, finalScore, activity_score, activityScore, remarks, status } = data;

    const midterm = toDecimal(midterm_score ?? midtermScore) || 0;
    const final = toDecimal(final_score ?? finalScore) || 0;
    const activity = toDecimal(activity_score ?? activityScore) || 0;

    const scoreError = validateScore(midterm_score ?? midtermScore, 'midterm_score')
        || validateScore(final_score ?? finalScore, 'final_score')
        || validateScore(activity_score ?? activityScore, 'activity_score');
    if (scoreError) {
        const error = new Error(scoreError);
        error.statusCode = 400;
        throw error;
    }

    if (midterm + final + activity > MAX_SCORE) {
        const error = new Error(`Combined scores (${midterm + final + activity}) cannot exceed ${MAX_SCORE}.`);
        error.statusCode = 400;
        throw error;
    }

    const resolvedStatus = status || 'PUBLISHED';
    const total = midterm + final + activity;

    const result = await prisma.examResult.create({
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

    return result;
}

export async function getExamSchedules(query) {
    const { page, limit, skip } = getPaginationParams(query);

    const where = {
        ...(query.course_id ? { course_id: Number(query.course_id) } : {}),
        ...(query.status ? { status: query.status } : {}),
    };

    const [schedules, total] = await Promise.all([
        prisma.examSchedule.findMany({
            where,
            include: { course: true },
            orderBy: { exam_date: 'asc' },
            skip,
            take: limit,
        }),
        prisma.examSchedule.count({ where }),
    ]);

    return { schedules, total, page, limit };
}

function parseJsonBlock(value, fallback = {}) {
    if (value == null || value === '') return fallback;
    if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return fallback; }
    }
    return value;
}

export async function createCourseExam(data) {
    const { course_id, courseId, title, instructions, duration_minutes, durationMinutes, questions, status } = data;

    const resolvedStatus = status || 'DRAFT';

    const courseExam = await prisma.courseExam.create({
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

    return courseExam;
}

export async function getCourseExams(query) {
    const { page, limit, skip } = getPaginationParams(query);

    const where = {
        ...(query.course_id ? { course_id: Number(query.course_id) } : {}),
        ...(query.status ? { status: query.status } : {}),
    };

    const [courseExams, total] = await Promise.all([
        prisma.courseExam.findMany({
            where,
            include: { course: true },
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
        }),
        prisma.courseExam.count({ where }),
    ]);

    return { courseExams, total, page, limit };
}

export async function getExamResults(query, user) {
    const { page, limit, skip } = getPaginationParams(query);

    const where = {
        ...(query.course_id ? { course_id: Number(query.course_id) } : {}),
        ...(query.exam_schedule_id ? { exam_schedule_id: Number(query.exam_schedule_id) } : {}),
    };
    if (user.roleName === 'Student') {
        where.student = { user_id: user.id };
    } else if (query.student_id) {
        where.student_id = Number(query.student_id);
    }

    const [results, total] = await Promise.all([
        prisma.examResult.findMany({
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
        prisma.examResult.count({ where }),
    ]);

    return { results, total, page, limit };
}
