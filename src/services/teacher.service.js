import prisma from '../config/db.js';
import { getPaginationParams } from '../utils/pagination.js';
import { hashPassword } from '../utils/password.js';

async function getTeacherRoleId() {
    const role = await prisma.role.findFirst({ where: { name: 'Teacher' } });
    if (role) return role.id;
    const created = await prisma.role.create({ data: { name: 'Teacher', permissions: '{}' } });
    return created.id;
}

const teacherDetailInclude = {
    user: { select: { name: true, email: true, phone: true } },
    department: true,
};

export async function createTeacher(data) {
    const { name, email, password, phone, department_id, departmentId, employee_no, employeeNo, position, qualification, employment_date, employmentDate, gender, address, status = 'ACTIVE' } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        const error = new Error('A user with this email already exists.');
        error.statusCode = 409;
        throw error;
    }

    const roleId = await getTeacherRoleId();
    const hashedPassword = await hashPassword(password);

    const teacher = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: { name, email, password: hashedPassword, phone, status, role_id: roleId },
        });
        return tx.teacher.create({
            data: {
                user_id: user.id,
                department_id: department_id || departmentId ? Number(department_id || departmentId) : null,
                employee_no: employee_no || employeeNo,
                position,
                qualification,
                employment_date: employment_date || employmentDate ? new Date(employment_date || employmentDate) : null,
                gender,
                address,
                status,
            },
            include: teacherInclude,
        });
    });

    return teacher;
}

export async function updateTeacher(id, body) {
    const teacherId = Number(id);
    const existing = await prisma.teacher.findUnique({ where: { id: teacherId }, include: { user: true } });
    if (!existing) {
        const error = new Error('Teacher not found.');
        error.statusCode = 404;
        throw error;
    }

    const { name, email, phone, department_id, departmentId, employee_no, employeeNo, position, qualification, employment_date, employmentDate, gender, address, status } = body;

    const teacher = await prisma.$transaction(async (tx) => {
        const userUpdate = {};
        if (name !== undefined) userUpdate.name = name;
        if (email !== undefined) userUpdate.email = email;
        if (phone !== undefined) userUpdate.phone = phone;
        if (status !== undefined) userUpdate.status = status;

        if (Object.keys(userUpdate).length > 0) {
            await tx.user.update({ where: { id: existing.user_id }, data: userUpdate });
        }

        const teacherUpdate = {};
        if (department_id !== undefined || departmentId !== undefined) teacherUpdate.department_id = Number(department_id || departmentId);
        if (employee_no !== undefined || employeeNo !== undefined) teacherUpdate.employee_no = employee_no || employeeNo;
        if (position !== undefined) teacherUpdate.position = position;
        if (qualification !== undefined) teacherUpdate.qualification = qualification;
        if (employment_date !== undefined || employmentDate !== undefined) teacherUpdate.employment_date = (employment_date || employmentDate) ? new Date(employment_date || employmentDate) : null;
        if (gender !== undefined) teacherUpdate.gender = gender;
        if (address !== undefined) teacherUpdate.address = address;
        if (status !== undefined) teacherUpdate.status = status;

        return tx.teacher.update({ where: { id: teacherId }, data: teacherUpdate, include: teacherInclude });
    });

    return teacher;
}

export async function getTeacherById(id) {
    return prisma.teacher.findUnique({
        where: { id: Number(id) },
        include: teacherDetailInclude,
    });
}

const teacherInclude = {
    user: { select: { name: true, email: true, phone: true } },
    department: { select: { name: true } },
};

export async function getTeachers(query) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search?.trim();
    const status = query.status?.trim();

    const where = {
        ...(status ? { status } : {}),
        ...(search
            ? {
                OR: [
                    { employee_no: { contains: search } },
                    { user: { name: { contains: search } } },
                    { user: { email: { contains: search } } },
                    { department: { name: { contains: search } } },
                    { position: { contains: search } },
                ],
            }
            : {}),
    };

    const [teachers, total] = await Promise.all([
        prisma.teacher.findMany({ where, include: teacherInclude, skip, take: limit, orderBy: { created_at: 'desc' } }),
        prisma.teacher.count({ where }),
    ]);

    return { teachers, total, page, limit };
}

export async function deleteTeacher(id) {
    const teacherId = Number(id);
    const existing = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!existing) {
        const error = new Error('Teacher not found.');
        error.statusCode = 404;
        throw error;
    }

    await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: existing.user_id }, data: { status: 'DELETED' } });
        await tx.teacher.update({ where: { id: teacherId }, data: { status: 'DELETED' } });
    });
}

export function serializeTeacher(teacher) {
    if (!teacher) return null;
    return {
        id: teacher.id,
        name: teacher.user?.name || '',
        email: teacher.user?.email || '',
        phone: teacher.user?.phone || '',
        gender: teacher.gender || '',
        department: teacher.department?.name || '',
        department_id: teacher.department_id,
        employee_no: teacher.employee_no || '',
        position: teacher.position || '',
        qualification: teacher.qualification || '',
        employment_date: teacher.employment_date || null,
        address: teacher.address || '',
        status: teacher.status || '',
    };
}
