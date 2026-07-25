import prisma from '../config/db.js';

const departmentInclude = { _count: { select: { students: true, courses: true } } };

export function serializeDepartmentList(d) {
    return {
        id: d.id,
        code: d.code,
        name: d.name,
        studentCount: d._count.students,
        courseCount: d._count.courses,
        created_at: d.created_at,
    };
}

export async function listDepartments() {
    const departments = await prisma.department.findMany({
        include: departmentInclude,
        orderBy: { name: 'asc' },
    });
    return departments;
}

export async function getDepartmentById(id) {
    return prisma.department.findUnique({
        where: { id: Number(id) },
        include: departmentInclude,
    });
}

export async function createDepartment(data) {
    const { name, code } = data;
    const existing = await prisma.department.findFirst({ where: { name } });
    if (existing) {
        const error = new Error('A department with this name already exists.');
        error.statusCode = 409;
        throw error;
    }
    return prisma.department.create({ data: { name, code } });
}

export async function updateDepartment(id, data) {
    const { name, code } = data;
    const existing = await prisma.department.findUnique({ where: { id: Number(id) } });
    if (!existing) {
        const error = new Error('Department not found.');
        error.statusCode = 404;
        throw error;
    }
    return prisma.department.update({
        where: { id: Number(id) },
        data: { ...(name !== undefined ? { name } : {}), ...(code !== undefined ? { code } : {}) },
    });
}

export async function deleteDepartment(id) {
    const departmentId = Number(id);
    const existing = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!existing) {
        const error = new Error('Department not found.');
        error.statusCode = 404;
        throw error;
    }
    const studentCount = await prisma.student.count({ where: { department_id: departmentId } });
    if (studentCount > 0) {
        const error = new Error(`Cannot delete department with ${studentCount} student(s). Reassign students first.`);
        error.statusCode = 400;
        throw error;
    }
    await prisma.department.delete({ where: { id: departmentId } });
    return existing;
}
