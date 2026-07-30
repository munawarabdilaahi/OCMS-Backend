import prisma from '../config/db.js';
import { getPaginationParams } from '../utils/pagination.js';
import { getTeacherInfo, getTeacherCourseIds } from '../utils/rbac.js';
import { isStudentEnrolled } from './enrollment.service.js';

const attendanceDelegate = () => prisma.attendance;

const attendanceInclude = {
    student: { include: { user: { select: { name: true, email: true } }, department: { select: { name: true } } } },
    course: { select: { title: true, code: true } },
};

export function serializeAttendance(record) {
    if (!record) return null;
    return {
        id: record.id,
        student_id: record.student_id,
        studentName: record.student?.user?.name || '',
        studentEmail: record.student?.user?.email || '',
        course_id: record.course_id,
        course: record.course?.title || '',
        course_code: record.course?.code || '',
        date: record.date,
        status: record.status || '',
        remarks: record.remarks || '',
        created_at: record.created_at,
    };
}

export async function createAttendance(data, user) {
    const { student_id, studentId, course_id, courseId, date, status, remarks, teacher_id, teacherId } = data;
    const resolvedCourseId = Number(course_id || courseId);
    const resolvedStatus = String(status).toUpperCase();

    const resolvedStudentId = Number(student_id || studentId);

    const teacherInfo = await getTeacherInfo(user);
    if (teacherInfo !== null && !teacherInfo.courseIds.includes(resolvedCourseId)) {
        const error = new Error('Access denied. You can only manage attendance for your assigned courses.');
        error.statusCode = 403;
        throw error;
    }

    const enrolled = await isStudentEnrolled(resolvedStudentId, resolvedCourseId);
    if (!enrolled) {
        const error = new Error('Student is not enrolled in this course.');
        error.statusCode = 403;
        throw error;
    }

    const existing = await attendanceDelegate().findUnique({
        where: { student_id_course_id_date: { student_id: Number(student_id || studentId), course_id: resolvedCourseId, date: new Date(date) } },
    });
    if (existing) {
        const error = new Error('Attendance record already exists for this student, course, and date.');
        error.statusCode = 409;
        throw error;
    }

    return attendanceDelegate().create({
        data: {
            student_id: resolvedStudentId,
            course_id: resolvedCourseId,
            teacher_id: teacherInfo && teacherInfo.teacherId ? teacherInfo.teacherId : (teacher_id || teacherId ? Number(teacher_id || teacherId) : null),
            date: new Date(date),
            status: resolvedStatus,
            remarks,
        },
        include: attendanceInclude,
    });
}

export async function getAttendance(query, user) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search?.trim();
    const course_id = query.course_id ? Number(query.course_id) : undefined;
    const student_id = query.student_id ? Number(query.student_id) : undefined;
    const status = query.status?.trim();
    const dateFrom = query.date_from;
    const dateTo = query.date_to;

    const where = {
        ...(course_id ? { course_id } : {}),
        ...(status ? { status: String(status).toUpperCase() } : {}),
        ...(dateFrom || dateTo ? {
            date: {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
        } : {}),
        ...(search ? {
            OR: [
                { student: { user: { name: { contains: search } } } },
                { course: { title: { contains: search } } },
            ],
        } : {}),
    };
    if (user.roleName === 'Student') {
        where.student = { user_id: user.id };
    } else if (user.roleName === 'Teacher') {
        const teacherInfo = await getTeacherInfo(user);
        if (teacherInfo === null || teacherInfo.courseIds.length === 0) {
            return { records: [], total: 0, page, limit };
        }
        if (course_id) {
            if (!teacherInfo.courseIds.includes(course_id)) {
                return { records: [], total: 0, page, limit };
            }
        } else {
            where.course_id = { in: teacherInfo.courseIds };
        }
        if (student_id) {
            where.student_id = student_id;
        }
    } else if (student_id) {
        where.student_id = student_id;
    }

    const [records, total] = await Promise.all([
        attendanceDelegate().findMany({ where, include: attendanceInclude, skip, take: limit, orderBy: { date: 'desc' } }),
        attendanceDelegate().count({ where }),
    ]);

    return { records, total, page, limit };
}

export async function getAttendanceStats(query, user) {
    const where = {};
    if (query.course_id) where.course_id = Number(query.course_id);
    if (query.student_id && user.roleName !== 'Student' && user.roleName !== 'Teacher') where.student_id = Number(query.student_id);
    if (user.roleName === 'Student') {
        where.student = { user_id: user.id };
    } else if (user.roleName === 'Teacher') {
        const teacherInfo = await getTeacherInfo(user);
        if (teacherInfo === null || teacherInfo.courseIds.length === 0) {
            return { total: 0, present: 0, absent: 0, late: 0, rate: 0 };
        }
        const queryCourseId = query.course_id ? Number(query.course_id) : undefined;
        if (queryCourseId) {
            if (!teacherInfo.courseIds.includes(queryCourseId)) {
                return { total: 0, present: 0, absent: 0, late: 0, rate: 0 };
            }
            where.course_id = queryCourseId;
        } else {
            where.course_id = { in: teacherInfo.courseIds };
        }
        if (query.student_id) where.student_id = Number(query.student_id);
    }

    const [total, present, absent, late] = await Promise.all([
        attendanceDelegate().count({ where }),
        attendanceDelegate().count({ where: { ...where, status: 'PRESENT' } }),
        attendanceDelegate().count({ where: { ...where, status: 'ABSENT' } }),
        attendanceDelegate().count({ where: { ...where, status: 'LATE' } }),
    ]);

    return {
        total,
        present,
        absent,
        late,
        rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
    };
}

export async function updateAttendance(id, data, user) {
    const recordId = Number(id);
    const existing = await attendanceDelegate().findUnique({ where: { id: recordId } });
    if (!existing) {
        const error = new Error('Attendance record not found.');
        error.statusCode = 404;
        throw error;
    }

    const teacherInfo = await getTeacherCourseIds(user);
    if (teacherInfo !== null && !teacherInfo.courseIds.includes(existing.course_id)) {
        const error = new Error('Access denied. You can only update attendance for your assigned courses.');
        error.statusCode = 403;
        throw error;
    }

    const { status, remarks } = data;

    const updateData = {};
    if (status !== undefined) {
        const resolvedStatus = String(status).toUpperCase();
        updateData.status = resolvedStatus;
    }
    if (remarks !== undefined) updateData.remarks = remarks;

    return attendanceDelegate().update({ where: { id: recordId }, data: updateData, include: attendanceInclude });
}

export async function deleteAttendance(id, user) {
    const recordId = Number(id);
    const existing = await attendanceDelegate().findUnique({ where: { id: recordId } });
    if (!existing) {
        const error = new Error('Attendance record not found.');
        error.statusCode = 404;
        throw error;
    }

    const teacherInfo = await getTeacherCourseIds(user);
    if (teacherInfo !== null && !teacherInfo.courseIds.includes(existing.course_id)) {
        const error = new Error('Access denied. You can only delete attendance for your assigned courses.');
        error.statusCode = 403;
        throw error;
    }

    await attendanceDelegate().delete({ where: { id: recordId } });
    return existing;
}

export async function bulkCreateAttendance(data, user) {
    const { course_id, courseId, date, records, teacher_id, teacherId } = data;

    const resolvedCourseId = Number(course_id || courseId);
    const resolvedDate = new Date(date);

    const teacherInfo = await getTeacherCourseIds(user);
    if (teacherInfo !== null && !teacherInfo.courseIds.includes(resolvedCourseId)) {
        const error = new Error('Access denied. You can only manage attendance for your assigned courses.');
        error.statusCode = 403;
        throw error;
    }

    const results = [];

    for (const record of records) {
        if (!record.student_id && !record.studentId) continue;
        const studentId = Number(record.student_id || record.studentId);

        const enrolled = await isStudentEnrolled(studentId, resolvedCourseId);
        if (!enrolled) continue;
        const status = String(record.status || 'PRESENT').toUpperCase();

        try {
            const existing = await attendanceDelegate().findUnique({
                where: { student_id_course_id_date: { student_id: studentId, course_id: resolvedCourseId, date: resolvedDate } },
            });

            if (existing) {
                const updated = await attendanceDelegate().update({
                    where: { id: existing.id },
                    data: { status, remarks: record.remarks },
                    include: attendanceInclude,
                });
                results.push(serializeAttendance(updated));
            } else {
                const created = await attendanceDelegate().create({
                    data: {
                        student_id: studentId,
                        course_id: resolvedCourseId,
                        teacher_id: teacher_id || teacherId ? Number(teacher_id || teacherId) : null,
                        date: resolvedDate,
                        status,
                        remarks: record.remarks,
                    },
                    include: attendanceInclude,
                });
                results.push(serializeAttendance(created));
            }
        } catch {
            continue;
        }
    }

    return { count: results.length, results };
}
