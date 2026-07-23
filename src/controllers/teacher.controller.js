import prisma from '../config/db.js';
import { hashPassword } from '../utils/password.js';

const userDelegate = () => prisma.user;
const roleDelegate = () => prisma.role;
const teacherDelegate = () => prisma.teacher;

const teacherInclude = {
    user: { select: { name: true, email: true, phone: true } },
    department: { select: { name: true } },
};

const teacherDetailInclude = {
    user: { select: { name: true, email: true, phone: true } },
    department: true,
};

function serializeTeacher(teacher) {
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

async function getTeacherRoleId() {
    const role = await roleDelegate().findFirst({ where: { name: 'Teacher' } });
    if (role) return role.id;
    const created = await roleDelegate().create({ data: { name: 'Teacher', permissions: '{}' } });
    return created.id;
}

export async function createTeacher(req, res, next) {
    try {
        const { name, email, password, phone, department_id, departmentId, employee_no, employeeNo, position, qualification, employment_date, employmentDate, gender, address, status = 'ACTIVE' } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        }

        const existingUser = await userDelegate().findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
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

        return res.status(201).json({ success: true, message: 'Teacher created successfully.', data: serializeTeacher(teacher) });
    } catch (error) {
        next(error);
    }
}

export async function getTeachers(req, res, next) {
    try {
        const page = Math.max(Number(req.query.page || 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
        const search = req.query.search?.trim();
        const status = req.query.status?.trim();
        const skip = (page - 1) * limit;

        const where = {
            ...(status ? { status } : {}),
            ...(search
                ? {
                    OR: [
                        { employee_no: { contains: search, mode: 'insensitive' } },
                        { user: { name: { contains: search, mode: 'insensitive' } } },
                        { user: { email: { contains: search, mode: 'insensitive' } } },
                        { department: { name: { contains: search, mode: 'insensitive' } } },
                        { position: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };

        const [teachers, total] = await Promise.all([
            teacherDelegate().findMany({ where, include: teacherInclude, skip, take: limit, orderBy: { created_at: 'desc' } }),
            teacherDelegate().count({ where }),
        ]);

        return res.status(200).json({
            success: true,
            message: 'Teachers retrieved successfully.',
            data: teachers.map(serializeTeacher),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
}

export async function getTeacherById(req, res, next) {
    try {
        const teacher = await teacherDelegate().findUnique({
            where: { id: Number(req.params.id) },
            include: teacherDetailInclude,
        });
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found.' });
        }
        return res.status(200).json({
            success: true,
            message: 'Teacher retrieved successfully.',
            data: serializeTeacher(teacher),
        });
    } catch (error) {
        next(error);
    }
}

export async function updateTeacher(req, res, next) {
    try {
        const teacherId = Number(req.params.id);
        const existing = await teacherDelegate().findUnique({ where: { id: teacherId }, include: { user: true } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Teacher not found.' });
        }

        const { name, email, phone, department_id, departmentId, employee_no, employeeNo, position, qualification, employment_date, employmentDate, gender, address, status } = req.body;

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

        return res.status(200).json({ success: true, message: 'Teacher updated successfully.', data: serializeTeacher(teacher) });
    } catch (error) {
        next(error);
    }
}

export async function deleteTeacher(req, res, next) {
    try {
        const teacherId = Number(req.params.id);
        const existing = await teacherDelegate().findUnique({ where: { id: teacherId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Teacher not found.' });
        }

        await prisma.$transaction(async (tx) => {
            await tx.user.update({ where: { id: existing.user_id }, data: { status: 'DELETED' } });
            await tx.teacher.update({ where: { id: teacherId }, data: { status: 'DELETED' } });
        });

        return res.status(200).json({ success: true, message: 'Teacher deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
