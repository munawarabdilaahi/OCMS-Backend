import prisma from '../config/db.js';
import { isAllowedStatus } from '../utils/validation.js';

const attendanceDelegate = () => prisma.attendance;

const attendanceInclude = {
    student: { include: { user: { select: { name: true, email: true } }, department: { select: { name: true } } } },
    course: { select: { title: true, code: true } },
};

function serializeAttendance(record) {
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

export async function createAttendance(req, res, next) {
    try {
        const { student_id, studentId, course_id, courseId, date, status, remarks, teacher_id, teacherId } = req.body;

        if (!(student_id || studentId) || !(course_id || courseId) || !date || !status) {
            return res.status(400).json({ success: false, message: 'student_id, course_id, date, and status are required.' });
        }

        const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE'];
        const resolvedStatus = String(status).toUpperCase();
        if (!isAllowedStatus(resolvedStatus, ATTENDANCE_STATUSES)) {
            return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${ATTENDANCE_STATUSES.join(', ')}` });
        }

        const existing = await attendanceDelegate().findUnique({
            where: { student_id_course_id_date: { student_id: Number(student_id || studentId), course_id: Number(course_id || courseId), date: new Date(date) } },
        });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Attendance record already exists for this student, course, and date.' });
        }

        const record = await attendanceDelegate().create({
            data: {
                student_id: Number(student_id || studentId),
                course_id: Number(course_id || courseId),
                teacher_id: teacher_id || teacherId ? Number(teacher_id || teacherId) : null,
                date: new Date(date),
                status: resolvedStatus,
                remarks,
            },
            include: attendanceInclude,
        });

        return res.status(201).json({ success: true, message: 'Attendance recorded successfully.', data: serializeAttendance(record) });
    } catch (error) {
        next(error);
    }
}

export async function getAttendance(req, res, next) {
    try {
        const page = Math.max(Number(req.query.page || 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
        const skip = (page - 1) * limit;
        const search = req.query.search?.trim();
        const course_id = req.query.course_id ? Number(req.query.course_id) : undefined;
        const student_id = req.query.student_id ? Number(req.query.student_id) : undefined;
        const status = req.query.status?.trim();
        const dateFrom = req.query.date_from;
        const dateTo = req.query.date_to;

        const where = {
            ...(course_id ? { course_id } : {}),
            ...(student_id ? { student_id } : {}),
            ...(status ? { status: String(status).toUpperCase() } : {}),
            ...(dateFrom || dateTo ? {
                date: {
                    ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                    ...(dateTo ? { lte: new Date(dateTo) } : {}),
                },
            } : {}),
            ...(search ? {
                OR: [
                    { student: { user: { name: { contains: search, mode: 'insensitive' } } } },
                    { course: { title: { contains: search, mode: 'insensitive' } } },
                ],
            } : {}),
        };

        const [records, total] = await Promise.all([
            attendanceDelegate().findMany({ where, include: attendanceInclude, skip, take: limit, orderBy: { date: 'desc' } }),
            attendanceDelegate().count({ where }),
        ]);

        return res.status(200).json({
            success: true,
            message: 'Attendance records retrieved successfully.',
            data: records.map(serializeAttendance),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
}

export async function getAttendanceStats(req, res, next) {
    try {
        const where = {};
        if (req.query.course_id) where.course_id = Number(req.query.course_id);
        if (req.query.student_id) where.student_id = Number(req.query.student_id);

        const [total, present, absent, late] = await Promise.all([
            attendanceDelegate().count({ where }),
            attendanceDelegate().count({ where: { ...where, status: 'PRESENT' } }),
            attendanceDelegate().count({ where: { ...where, status: 'ABSENT' } }),
            attendanceDelegate().count({ where: { ...where, status: 'LATE' } }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                total,
                present,
                absent,
                late,
                rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function updateAttendance(req, res, next) {
    try {
        const recordId = Number(req.params.id);
        const existing = await attendanceDelegate().findUnique({ where: { id: recordId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Attendance record not found.' });
        }

        const { status, remarks } = req.body;
        const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE'];

        const updateData = {};
        if (status !== undefined) {
            const resolvedStatus = String(status).toUpperCase();
            if (!isAllowedStatus(resolvedStatus, ATTENDANCE_STATUSES)) {
                return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${ATTENDANCE_STATUSES.join(', ')}` });
            }
            updateData.status = resolvedStatus;
        }
        if (remarks !== undefined) updateData.remarks = remarks;

        const record = await attendanceDelegate().update({ where: { id: recordId }, data: updateData, include: attendanceInclude });
        return res.status(200).json({ success: true, message: 'Attendance updated successfully.', data: serializeAttendance(record) });
    } catch (error) {
        next(error);
    }
}

export async function deleteAttendance(req, res, next) {
    try {
        const recordId = Number(req.params.id);
        const existing = await attendanceDelegate().findUnique({ where: { id: recordId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Attendance record not found.' });
        }
        await attendanceDelegate().delete({ where: { id: recordId } });
        return res.status(200).json({ success: true, message: 'Attendance record deleted successfully.' });
    } catch (error) {
        next(error);
    }
}

export async function bulkCreateAttendance(req, res, next) {
    try {
        const { course_id, courseId, date, records, teacher_id, teacherId } = req.body;

        if (!(course_id || courseId) || !date || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ success: false, message: 'course_id, date, and records array are required.' });
        }

        const resolvedCourseId = Number(course_id || courseId);
        const resolvedDate = new Date(date);
        const results = [];

        for (const record of records) {
            if (!record.student_id && !record.studentId) continue;
            const studentId = Number(record.student_id || record.studentId);
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

        return res.status(201).json({ success: true, message: `${results.length} attendance record(s) processed.`, data: results });
    } catch (error) {
        next(error);
    }
}
