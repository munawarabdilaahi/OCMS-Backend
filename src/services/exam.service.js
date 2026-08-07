import prisma from '../config/db.js';
import { getPaginationParams } from '../utils/pagination.js';
import { getTeacherCourseIds } from '../utils/rbac.js';
import { isStudentEnrolled } from './enrollment.service.js';

export async function createExamSchedule(data, user) {
    const { course_id, courseId, title, exam_type, examType, exam_date, examDate, start_time, startTime, end_time, endTime, room, status } = data;
    const resolvedCourseId = Number(course_id || courseId);
    const resolvedStatus = status || 'SCHEDULED';

    const courseIds = await getTeacherCourseIds(user);
    if (courseIds !== null && !courseIds.includes(resolvedCourseId)) {
        const error = new Error('Access denied. You can only manage exam schedules for your assigned courses.');
        error.statusCode = 403;
        throw error;
    }

    const schedule = await prisma.examSchedule.create({
        data: {
            course_id: resolvedCourseId,
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

export async function updateExamSchedule(id, body, user) {
    const scheduleId = Number(id);
    const existing = await prisma.examSchedule.findUnique({ where: { id: scheduleId } });
    if (!existing) {
        const error = new Error('Exam schedule not found.');
        error.statusCode = 404;
        throw error;
    }

    const courseIds = await getTeacherCourseIds(user);
    if (courseIds !== null && !courseIds.includes(existing.course_id)) {
        const error = new Error('Access denied. You can only update exam schedules for your assigned courses.');
        error.statusCode = 403;
        throw error;
    }

    const { course_id, courseId, title, exam_type, examType, exam_date, examDate, start_time, startTime, end_time, endTime, room, status } = body;

    const updatedCourseId = course_id || courseId ? Number(course_id || courseId) : undefined;
    if (courseIds !== null && updatedCourseId !== undefined && !courseIds.includes(updatedCourseId)) {
        const error = new Error('Access denied. You can only update exam schedules for your assigned courses.');
        error.statusCode = 403;
        throw error;
    }

    const schedule = await prisma.examSchedule.update({
        where: { id: scheduleId },
        data: {
            ...(updatedCourseId !== undefined ? { course_id: updatedCourseId } : {}),
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

export async function deleteExamSchedule(id, user) {
    const scheduleId = Number(id);
    const existing = await prisma.examSchedule.findUnique({ where: { id: scheduleId } });
    if (!existing) {
        const error = new Error('Exam schedule not found.');
        error.statusCode = 404;
        throw error;
    }

    const courseIds = await getTeacherCourseIds(user);
    if (courseIds !== null && !courseIds.includes(existing.course_id)) {
        const error = new Error('Access denied. You can only delete exam schedules for your assigned courses.');
        error.statusCode = 403;
        throw error;
    }

    await prisma.examSchedule.update({ where: { id: scheduleId }, data: { status: 'CANCELLED' } });
}

export async function getCourseExamById(id, user) {
    const exam = await prisma.courseExam.findUnique({
        where: { id: Number(id) },
        include: { course: true },
    });
    if (!exam) return null;
    if (user && user.roleName === 'Teacher') {
        const courseIds = await getTeacherCourseIds(user);
        if (courseIds !== null && !courseIds.includes(exam.course_id)) return null;
    }
    return exam;
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

export async function submitExamResult(data, user) {
    const { exam_schedule_id, examScheduleId, student_id, studentId, course_id, courseId, midterm_score, midtermScore, final_score, finalScore, activity_score, activityScore, remarks, status } = data;
    const resolvedCourseId = Number(course_id || courseId);
    const resolvedStudentId = Number(student_id || studentId);

    const courseIds = await getTeacherCourseIds(user);
    if (courseIds !== null && !courseIds.includes(resolvedCourseId)) {
        const error = new Error('Access denied. You can only submit results for your assigned courses.');
        error.statusCode = 403;
        throw error;
    }

    const enrolled = await isStudentEnrolled(resolvedStudentId, resolvedCourseId);
    if (!enrolled) {
        const error = new Error('Student is not enrolled in this course.');
        error.statusCode = 403;
        throw error;
    }

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
            student_id: resolvedStudentId,
            course_id: resolvedCourseId,
            midterm_score: midterm,
            final_score: final,
            activity_score: activity,
            total_score: total,
            remarks,
            status: resolvedStatus,
        },
        include: {
            student: { include: { user: { select: { id: true, name: true, email: true, phone: true, status: true, role_id: true } } } },
            course: true,
        },
    });

    return result;
}

export async function getExamSchedules(query, user) {
    const { page, limit, skip } = getPaginationParams(query);

    const where = {
        ...(query.status ? { status: query.status } : {}),
    };

    const queryCourseId = query.course_id ? Number(query.course_id) : undefined;

    const courseIds = await getTeacherCourseIds(user);
    if (courseIds !== null) {
        if (courseIds.length === 0) {
            return { schedules: [], total: 0, page, limit };
        }
        if (queryCourseId) {
            if (!courseIds.includes(queryCourseId)) {
                return { schedules: [], total: 0, page, limit };
            }
            where.course_id = queryCourseId;
        } else {
            where.course_id = { in: courseIds };
        }
    } else if (queryCourseId) {
        where.course_id = queryCourseId;
    }

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

export async function createCourseExam(data, user) {
    const { course_id, courseId, title, instructions, duration_minutes, durationMinutes, questions, status } = data;
    const resolvedCourseId = Number(course_id || courseId);

    const courseIds = await getTeacherCourseIds(user);
    if (courseIds !== null && !courseIds.includes(resolvedCourseId)) {
        const error = new Error('Access denied. You can only manage course exams for your assigned courses.');
        error.statusCode = 403;
        throw error;
    }

    const resolvedStatus = status || 'DRAFT';

    const courseExam = await prisma.courseExam.create({
        data: {
            course_id: resolvedCourseId,
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

export async function getCourseExams(query, user) {
    const { page, limit, skip } = getPaginationParams(query);

    const where = {
        ...(query.status ? { status: query.status } : {}),
    };

    const queryCourseId = query.course_id ? Number(query.course_id) : undefined;

    const courseIds = await getTeacherCourseIds(user);
    if (courseIds !== null) {
        if (courseIds.length === 0) {
            return { courseExams: [], total: 0, page, limit };
        }
        if (queryCourseId) {
            if (!courseIds.includes(queryCourseId)) {
                return { courseExams: [], total: 0, page, limit };
            }
            where.course_id = queryCourseId;
        } else {
            where.course_id = { in: courseIds };
        }
    } else if (queryCourseId) {
        where.course_id = queryCourseId;
    }

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
        ...(query.exam_schedule_id ? { exam_schedule_id: Number(query.exam_schedule_id) } : {}),
    };
    const queryCourseId = query.course_id ? Number(query.course_id) : undefined;
    if (user.roleName === 'Student') {
        where.student = { user_id: user.id };
    } else if (user.roleName === 'Teacher') {
        const courseIds = await getTeacherCourseIds(user);
        if (courseIds === null || courseIds.length === 0) {
            return { results: [], total: 0, page, limit };
        }
        if (queryCourseId) {
            if (!courseIds.includes(queryCourseId)) {
                return { results: [], total: 0, page, limit };
            }
            where.course_id = queryCourseId;
        } else {
            where.course_id = { in: courseIds };
        }
        if (query.student_id) where.student_id = Number(query.student_id);
    } else if (queryCourseId) {
        where.course_id = queryCourseId;
        if (query.student_id) where.student_id = Number(query.student_id);
    }

    const [results, total] = await Promise.all([
        prisma.examResult.findMany({
            where,
            include: {
                student: { include: { user: { select: { id: true, name: true, email: true, phone: true, status: true, role_id: true } } } },
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
