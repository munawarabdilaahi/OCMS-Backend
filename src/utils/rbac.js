import prisma from '../config/db.js';

export async function getTeacherInfo(user) {
    if (!user || user.roleName !== 'Teacher') return null;
    const teacher = await prisma.teacher.findUnique({
        where: { user_id: user.dbUserId },
        select: {
            id: true,
            courses: { select: { id: true }, where: { status: 'ACTIVE' } },
        },
    });
    if (!teacher) return { teacherId: null, courseIds: [] };
    return { teacherId: teacher.id, courseIds: teacher.courses.map((c) => c.id) };
}

export async function getTeacherCourseIds(user) {
    const info = await getTeacherInfo(user);
    if (!info) return null;
    return info.courseIds;
}

export async function canTeacherAccessCourse(user, courseId) {
    if (!user || user.roleName !== 'Teacher') return true;
    const courseIds = await getTeacherCourseIds(user);
    if (courseIds === null) return true;
    return courseIds.includes(Number(courseId));
}

export function requireAdmin(user) {
    if (!user || !['Admin', 'SuperAdmin'].includes(user.roleName)) {
        const error = new Error('Access denied. Admin or SuperAdmin role required.');
        error.statusCode = 403;
        throw error;
    }
}

export async function canTeacherAccessStudent(user, studentId) {
    if (!user || user.roleName !== 'Teacher') return true;
    const courseIds = await getTeacherCourseIds(user);
    if (courseIds === null || courseIds.length === 0) return false;
    const enrollment = await prisma.enrollment.findFirst({
        where: { student_id: Number(studentId), course_id: { in: courseIds } },
    });
    return !!enrollment;
}
