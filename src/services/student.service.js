import prisma from '../config/db.js';
import { hashPassword } from '../utils/password.js';
import { getPaginationParams } from '../utils/pagination.js';
import { getTeacherCourseIds } from '../utils/rbac.js';

async function getStudentRoleId() {
    const role = await prisma.role.findFirst({ where: { name: 'Student' } });
    if (role) return role.id;
    const created = await prisma.role.create({ data: { name: 'Student', permissions: '{}' } });
    return created.id;
}

const studentInclude = {
    user: {
        select: {
            name: true,
            email: true,
            phone: true,
        },
    },
    department: {
        select: {
            name: true,
        },
    },
};

export async function createStudent(data) {
    const { name, email, password, phone, department_id, departmentId, admission_no, admissionNo, date_of_birth, dateOfBirth, gender, address, status = 'ACTIVE' } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        const error = new Error('A user with this email already exists.');
        error.statusCode = 409;
        throw error;
    }

    const roleId = await getStudentRoleId();
    const hashedPassword = await hashPassword(password);

    const student = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                status,
                role_id: roleId,
            },
        });
        return tx.student.create({
            data: {
                user_id: user.id,
                department_id: Number(department_id || departmentId),
                admission_no: admission_no || admissionNo,
                date_of_birth: date_of_birth || dateOfBirth ? new Date(date_of_birth || dateOfBirth) : null,
                gender,
                address,
                status,
            },
            include: studentInclude,
        });
    });

    return student;
}

const studentDetailInclude = {
    user: {
        select: {
            name: true,
            email: true,
            phone: true,
        },
    },
    department: true,
};

export async function getStudentById(id, user) {
    const student = await prisma.student.findUnique({
        where: user.roleName === 'Student' ? { user_id: user.id } : { id: Number(id) },
        include: studentDetailInclude,
    });
    if (!student) return null;
    if (user.roleName === 'Teacher') {
        const courseIds = await getTeacherCourseIds(user);
        if (courseIds.length === 0) return null;
        const enrollment = await prisma.enrollment.findFirst({
            where: { student_id: student.id, course_id: { in: courseIds } },
        });
        if (!enrollment) return null;
    }
    return student;
}

export async function getStudents(query, user) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search?.trim();
    const status = query.status?.trim();

    const where = {
        ...(status ? { status } : {}),
        ...(search
            ? {
                OR: [
                    { admission_no: { contains: search, mode: 'insensitive' } },
                    { user: { name: { contains: search, mode: 'insensitive' } } },
                    { user: { email: { contains: search, mode: 'insensitive' } } },
                    { department: { name: { contains: search, mode: 'insensitive' } } },
                ],
            }
            : {}),
    };

    const courseIds = await getTeacherCourseIds(user);
    if (courseIds !== null) {
        if (courseIds.length === 0) {
            return { students: [], total: 0, page, limit };
        }
        const enrollments = await prisma.enrollment.findMany({
            where: { course_id: { in: courseIds } },
            select: { student_id: true },
            distinct: ['student_id'],
        });
        const ids = enrollments.map((e) => e.student_id);
        if (ids.length === 0) {
            return { students: [], total: 0, page, limit };
        }
        where.id = { in: ids };
    }

    const [students, total] = await Promise.all([
        prisma.student.findMany({
            where,
            include: studentInclude,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        }),
        prisma.student.count({ where }),
    ]);

    return { students, total, page, limit };
}

export async function updateStudent(id, body) {
    const studentId = Number(id);
    const existingStudent = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true },
    });
    if (!existingStudent) {
        const error = new Error('Student not found.');
        error.statusCode = 404;
        throw error;
    }

    const { name, email, phone, department_id, departmentId, admission_no, admissionNo, date_of_birth, dateOfBirth, gender, address, status } = body;

    const student = await prisma.$transaction(async (tx) => {
        const userUpdate = {};
        if (name !== undefined) userUpdate.name = name;
        if (email !== undefined) userUpdate.email = email;
        if (phone !== undefined) userUpdate.phone = phone;
        if (status !== undefined) userUpdate.status = status;

        if (Object.keys(userUpdate).length > 0) {
            await tx.user.update({ where: { id: existingStudent.user_id }, data: userUpdate });
        }

        const studentUpdate = {};
        if (department_id !== undefined || departmentId !== undefined) {
            studentUpdate.department_id = Number(department_id || departmentId);
        }
        if (admission_no !== undefined || admissionNo !== undefined) {
            studentUpdate.admission_no = admission_no || admissionNo;
        }
        if (date_of_birth !== undefined || dateOfBirth !== undefined) {
            studentUpdate.date_of_birth = (date_of_birth || dateOfBirth) ? new Date(date_of_birth || dateOfBirth) : null;
        }
        if (gender !== undefined) studentUpdate.gender = gender;
        if (address !== undefined) studentUpdate.address = address;
        if (status !== undefined) studentUpdate.status = status;

        return tx.student.update({
            where: { id: studentId },
            data: studentUpdate,
            include: studentInclude,
        });
    });

    return student;
}

export async function updateStudentStatus(id, body) {
    const studentId = Number(id);
    const { status = 'INACTIVE' } = body;
    const existingStudent = await prisma.student.findUnique({
        where: { id: studentId },
    });
    if (!existingStudent) {
        const error = new Error('Student not found.');
        error.statusCode = 404;
        throw error;
    }

    const student = await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: existingStudent.user_id },
            data: { status },
        });
        return tx.student.update({
            where: { id: studentId },
            data: { status },
            include: studentInclude,
        });
    });

    return student;
}

export async function deleteStudent(id) {
    const studentId = Number(id);
    const existingStudent = await prisma.student.findUnique({
        where: { id: studentId },
    });
    if (!existingStudent) {
        const error = new Error('Student not found.');
        error.statusCode = 404;
        throw error;
    }

    const student = await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: existingStudent.user_id },
            data: { status: 'DELETED' },
        });
        return tx.student.update({
            where: { id: studentId },
            data: { status: 'DELETED' },
            include: studentInclude,
        });
    });

    return student;
}

export async function getStudentStats() {
    const [
        totalStudents,
        activeStudents,
        inactiveStudents,
        totalUsers,
        totalDepartments,
        departmentBreakdown,
        genderBreakdown,
        recentStudents,
        totalExamSchedules,
        totalExamResults,
    ] = await Promise.all([
        prisma.student.count(),
        prisma.student.count({ where: { status: 'ACTIVE' } }),
        prisma.student.count({ where: { status: { not: 'ACTIVE' } } }),
        prisma.user.count(),
        prisma.department.count(),
        prisma.department.findMany({
            select: {
                name: true,
                _count: { select: { students: true } },
            },
        }),
        prisma.student.groupBy({
            by: ['gender'],
            _count: { id: true },
            where: { gender: { not: null } },
        }),
        prisma.student.findMany({
            take: 5,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                status: true,
                created_at: true,
                user: { select: { name: true, email: true } },
                department: { select: { name: true } },
            },
        }),
        prisma.examSchedule.count(),
        prisma.examResult.count(),
    ]);

    return {
        totalStudents,
        activeStudents,
        inactiveStudents,
        totalUsers,
        totalDepartments,
        totalExamSchedules,
        totalExamResults,
        departmentBreakdown: departmentBreakdown.map((d) => ({
            name: d.name,
            count: d._count.students,
        })),
        genderBreakdown: genderBreakdown.map((g) => ({
            name: g.gender || 'Unspecified',
            value: g._count.id,
        })),
        recentStudents: recentStudents.map((s) => ({
            id: s.id,
            name: s.user?.name || '',
            email: s.user?.email || '',
            department: s.department?.name || '',
            status: s.status,
            created_at: s.created_at,
        })),
    };
}

export function serializeStudent(student) {
    if (!student) return null;
    return {
        id: student.id,
        name: student.user?.name || '',
        email: student.user?.email || '',
        phone: student.user?.phone || '',
        gender: student.gender || '',
        department: student.department?.name || '',
        department_id: student.department_id,
        status: student.status || '',
        admission_no: student.admission_no || '',
        date_of_birth: student.date_of_birth || null,
        address: student.address || '',
    };
}
