import prisma from '../config/db.js';
import { getPaginationParams } from '../utils/pagination.js';
import { getTeacherCourseIds } from '../utils/rbac.js';

const enrollmentInclude = {
    student: {
        select: {
            id: true,
            admission_no: true,
            user: { select: { name: true, email: true } },
            department: { select: { name: true } },
        },
    },
    course: {
        select: { id: true, code: true, title: true },
    },
};

export function serializeEnrollment(record) {
    if (!record) return null;
    return {
        id: record.id,
        student_id: record.student_id,
        studentName: record.student?.user?.name || '',
        studentEmail: record.student?.user?.email || '',
        admission_no: record.student?.admission_no || '',
        department: record.student?.department?.name || '',
        course_id: record.course_id,
        courseCode: record.course?.code || '',
        courseTitle: record.course?.title || '',
        status: record.status,
        created_at: record.created_at,
    };
}

export async function createEnrollment(data, _user) {
    const { student_id, studentId, course_id, courseId } = data;
    const resolvedStudentId = Number(student_id || studentId);
    const resolvedCourseId = Number(course_id || courseId);

    const existing = await prisma.enrollment.findUnique({
        where: { student_id_course_id: { student_id: resolvedStudentId, course_id: resolvedCourseId } },
    });
    if (existing) {
        const error = new Error('Student is already enrolled in this course.');
        error.statusCode = 409;
        throw error;
    }

    return prisma.enrollment.create({
        data: { student_id: resolvedStudentId, course_id: resolvedCourseId },
        include: enrollmentInclude,
    });
}

export async function getEnrollments(query, user) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search?.trim();
    const status = query.status?.trim();

    const where = {};
    if (status) where.status = status;
    if (search) {
        where.student = {
            user: { name: { contains: search } },
        };
    }

    if (user.roleName === 'Student') {
        const student = await prisma.student.findUnique({ where: { user_id: user.id }, select: { id: true } });
        if (!student) return { enrollments: [], total: 0, page, limit };
        where.student_id = student.id;
    } else if (user.roleName === 'Teacher') {
        const courseIds = await getTeacherCourseIds(user);
        if (courseIds === null || courseIds.length === 0) {
            return { enrollments: [], total: 0, page, limit };
        }
        where.course_id = { in: courseIds };
    }

    const [enrollments, total] = await Promise.all([
        prisma.enrollment.findMany({
            where,
            include: enrollmentInclude,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        }),
        prisma.enrollment.count({ where }),
    ]);

    return { enrollments, total, page, limit };
}

export async function deleteEnrollment(id) {
    const enrollmentId = Number(id);
    const existing = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!existing) {
        const error = new Error('Enrollment not found.');
        error.statusCode = 404;
        throw error;
    }
    await prisma.enrollment.delete({ where: { id: enrollmentId } });
    return existing;
}

export async function isStudentEnrolled(studentId, courseId) {
    const enrollment = await prisma.enrollment.findUnique({
        where: { student_id_course_id: { student_id: Number(studentId), course_id: Number(courseId) } },
    });
    return !!enrollment;
}
