import prisma from '../config/db.js';
import { hashPassword } from '../utils/password.js';

export async function getStudentRoleId() {
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
