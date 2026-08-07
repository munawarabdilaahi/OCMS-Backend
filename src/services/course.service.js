import prisma from '../config/db.js';
import { getPaginationParams } from '../utils/pagination.js';
import { getTeacherInfo } from '../utils/rbac.js';

const courseDelegate = () => prisma.course;

const courseInclude = {
    department: { select: { name: true } },
    teacher: { select: { id: true, user: { select: { name: true } } } },
};

export function serializeCourse(course) {
    if (!course) return null;
    return {
        id: course.id,
        code: course.code || '',
        title: course.title || '',
        credit_hours: course.credit_hours || null,
        semester: course.semester || '',
        status: course.status || 'ACTIVE',
        department: course.department?.name || '',
        department_id: course.department_id,
        teacher: course.teacher?.user?.name || '',
        teacher_id: course.teacher_id,
    };
}

export async function createCourse(data) {
    const { code, title, credit_hours, creditHours, semester, status = 'ACTIVE', department_id, departmentId, teacher_id, teacherId } = data;

    if (code) {
        const existing = await courseDelegate().findUnique({ where: { code } });
        if (existing) {
            const error = new Error('A course with this code already exists.');
            error.statusCode = 409;
            throw error;
        }
    }

    return courseDelegate().create({
        data: {
            code,
            title,
            credit_hours: credit_hours || creditHours ? Number(credit_hours || creditHours) : null,
            semester,
            status,
            department_id: department_id || departmentId ? Number(department_id || departmentId) : null,
            teacher_id: teacher_id || teacherId ? Number(teacher_id || teacherId) : null,
        },
        include: courseInclude,
    });
}

export async function getCourses(query, user) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search?.trim();
    const status = query.status?.trim();
    const department_id = query.department_id ? Number(query.department_id) : undefined;

    const where = {
        ...(status ? { status } : {}),
        ...(department_id ? { department_id } : {}),
        ...(search
            ? {
                OR: [
                    { code: { contains: search } },
                    { title: { contains: search } },
                    { department: { name: { contains: search } } },
                ],
            }
            : {}),
    };

    const teacherInfo = await getTeacherInfo(user);
    if (teacherInfo !== null) {
        if (teacherInfo.teacherId === null) {
            return { courses: [], total: 0, page, limit };
        }
        where.teacher_id = teacherInfo.teacherId;
    }

    const [courses, total] = await Promise.all([
        courseDelegate().findMany({ where, include: courseInclude, skip, take: limit, orderBy: { created_at: 'desc' } }),
        courseDelegate().count({ where }),
    ]);

    return { courses, total, page, limit };
}

export async function getCourseById(id, user) {
    const course = await courseDelegate().findUnique({
        where: { id: Number(id) },
        include: courseInclude,
    });
    if (!course) return null;
    if (user && user.roleName === 'Teacher') {
        const teacherInfo = await getTeacherInfo(user);
        if (teacherInfo === null || teacherInfo.teacherId === null) return null;
        if (course.teacher_id !== teacherInfo.teacherId) return null;
    }
    return course;
}

export async function updateCourse(id, data) {
    const courseId = Number(id);
    const existing = await courseDelegate().findUnique({ where: { id: courseId } });
    if (!existing) {
        const error = new Error('Course not found.');
        error.statusCode = 404;
        throw error;
    }

    const { code, title, credit_hours, creditHours, semester, status, department_id, departmentId, teacher_id, teacherId } = data;

    if (code && code !== existing.code) {
        const dup = await courseDelegate().findUnique({ where: { code } });
        if (dup) {
            const error = new Error('A course with this code already exists.');
            error.statusCode = 409;
            throw error;
        }
    }

    return courseDelegate().update({
        where: { id: courseId },
        data: {
            ...(code !== undefined ? { code } : {}),
            ...(title !== undefined ? { title } : {}),
            ...(credit_hours !== undefined || creditHours !== undefined ? { credit_hours: Number(credit_hours || creditHours) } : {}),
            ...(semester !== undefined ? { semester } : {}),
            ...(status !== undefined ? { status } : {}),
            ...(department_id !== undefined || departmentId !== undefined ? { department_id: Number(department_id || departmentId) } : {}),
            ...(teacher_id !== undefined || teacherId !== undefined ? { teacher_id: Number(teacher_id || teacherId) } : {}),
        },
        include: courseInclude,
    });
}

export async function deleteCourse(id) {
    const courseId = Number(id);
    const existing = await courseDelegate().findUnique({ where: { id: courseId } });
    if (!existing) {
        const error = new Error('Course not found.');
        error.statusCode = 404;
        throw error;
    }

    const examCount = await prisma.examSchedule.count({ where: { course_id: courseId } });
    if (examCount > 0) {
        const error = new Error(`Cannot delete course with ${examCount} exam schedule(s). Remove exams first.`);
        error.statusCode = 400;
        throw error;
    }

    await courseDelegate().delete({ where: { id: courseId } });
    return existing;
}
