import prisma from '../config/db.js';
import { getPaginationParams } from '../utils/pagination.js';

function parseValidDate(value) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        const error = new Error(`Invalid date value: "${value}".`);
        error.statusCode = 400;
        throw error;
    }
    return date;
}

function parseJSONField(value, fieldName) {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        const error = new Error(`Invalid JSON format in "${fieldName}".`);
        error.statusCode = 400;
        throw error;
    }
}

const VALID_TRANSITIONS = {
    ACTIVE: ['INACTIVE', 'SUSPENDED'],
    INACTIVE: ['ACTIVE'],
    SUSPENDED: ['INACTIVE'],
    CLOSED: [],
};

const listInclude = {
    faculty: { select: { id: true, name: true, code: true, status: true } },
    _count: { select: { programs: true, teachers: true, courses: true, students: true } },
};

export function serializeDepartment(d) {
    return {
        id: d.id,
        name: d.name,
        code: d.code,
        description: d.description,
        phone: d.phone,
        email: d.email,
        office_location: d.office_location,
        established_date: d.established_date,
        vision: d.vision,
        mission: d.mission,
        hod_name: d.hod_name,
        hod_email: d.hod_email,
        hod_phone: d.hod_phone,
        max_programs: d.max_programs,
        max_teachers: d.max_teachers,
        student_capacity: d.student_capacity,
        facilities: d.facilities,
        research_areas: d.research_areas,
        faculty_id: d.faculty_id,
        faculty_name: d.faculty?.name || '',
        faculty_status: d.faculty?.status || '',
        program_count: d._count?.programs ?? 0,
        teacher_count: d._count?.teachers ?? 0,
        course_count: d._count?.courses ?? 0,
        student_count: d._count?.students ?? 0,
        status: d.status,
        created_at: d.created_at,
        updated_at: d.updated_at,
    };
}

export async function listDepartments(query) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search?.trim();
    const status = query.status?.trim();
    const faculty_id = query.faculty_id ? Number(query.faculty_id) : undefined;

    const where = {
        ...(search
            ? {
                OR: [
                    { name: { contains: search } },
                    { code: { contains: search } },
                    { faculty: { name: { contains: search } } },
                ],
            }
            : {}),
        ...(status ? { status: status.toUpperCase() } : {}),
        ...(faculty_id ? { faculty_id } : {}),
    };

    const [departments, total] = await Promise.all([
        prisma.department.findMany({
            where,
            include: listInclude,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
        }),
        prisma.department.count({ where }),
    ]);

    return { departments, total, page, limit };
}

export async function getDepartmentById(id) {
    return prisma.department.findUnique({
        where: { id: Number(id) },
        include: listInclude,
    });
}

export async function createDepartment(data) {
    const { name, faculty_id } = data;

    const faculty = await prisma.faculty.findUnique({
        where: { id: Number(faculty_id) },
        include: { _count: { select: { departments: true } } },
    });
    if (!faculty) {
        const error = new Error('Faculty not found.');
        error.statusCode = 404;
        throw error;
    }
    if (faculty.status !== 'ACTIVE') {
        const error = new Error('Cannot add departments to a non-active faculty.');
        error.statusCode = 422;
        throw error;
    }

    const existingName = await prisma.department.findFirst({
        where: { name: { equals: name, mode: 'insensitive' }, faculty_id: faculty.id },
    });
    if (existingName) {
        const error = new Error('A department with this name already exists in this faculty.');
        error.statusCode = 409;
        throw error;
    }

    let finalCode = (data.code || name.substring(0, 4).toUpperCase()).toUpperCase();
    let codeConflict = await prisma.department.findUnique({ where: { code: finalCode } });
    if (codeConflict) {
        let counter = 1;
        let uniqueCode = finalCode;
        while (await prisma.department.findUnique({ where: { code: uniqueCode } })) {
            uniqueCode = finalCode.substring(0, 3) + counter;
            counter++;
        }
        finalCode = uniqueCode;
    }

    if (faculty.max_departments && faculty._count.departments >= faculty.max_departments) {
        const error = new Error(`Faculty has reached its maximum department capacity (${faculty.max_departments}).`);
        error.statusCode = 422;
        throw error;
    }

    return prisma.department.create({
        data: {
            name,
            code: finalCode,
            established_date: data.established_date && data.established_date !== '' ? parseValidDate(data.established_date) : undefined,
            description: data.description || undefined,
            phone: data.phone || undefined,
            email: data.email || undefined,
            office_location: data.office_location || undefined,
            vision: data.vision || undefined,
            mission: data.mission || undefined,
            hod_name: data.hod_name || undefined,
            hod_email: data.hod_email || undefined,
            hod_phone: data.hod_phone || undefined,
            max_programs: data.max_programs !== undefined && data.max_programs !== '' ? Number(data.max_programs) : undefined,
            max_teachers: data.max_teachers !== undefined && data.max_teachers !== '' ? Number(data.max_teachers) : undefined,
            student_capacity: data.student_capacity !== undefined && data.student_capacity !== '' ? Number(data.student_capacity) : undefined,
            facilities: data.facilities !== undefined ? parseJSONField(data.facilities, 'facilities') : undefined,
            research_areas: data.research_areas !== undefined ? parseJSONField(data.research_areas, 'research_areas') : undefined,
            faculty_id: faculty.id,
            status: data.status || 'ACTIVE',
        },
        include: listInclude,
    });
}

export async function updateDepartment(id, data) {
    const departmentId = Number(id);
    const existing = await prisma.department.findUnique({
        where: { id: departmentId },
        include: {
            faculty: { select: { id: true, name: true, status: true } },
            _count: { select: { programs: true, teachers: true, courses: true, students: true } },
        },
    });
    if (!existing) {
        const error = new Error('Department not found.');
        error.statusCode = 404;
        throw error;
    }

    if (data.name) {
        const conflict = await prisma.department.findFirst({
            where: { name: { equals: data.name, mode: 'insensitive' }, faculty_id: existing.faculty_id, id: { not: departmentId } },
        });
        if (conflict) {
            const error = new Error('A department with this name already exists in this faculty.');
            error.statusCode = 409;
            throw error;
        }
    }

    if (data.code) {
        const conflict = await prisma.department.findFirst({
            where: { code: { equals: data.code, mode: 'insensitive' }, id: { not: departmentId } },
        });
        if (conflict) {
            const error = new Error('A department with this code already exists.');
            error.statusCode = 409;
            throw error;
        }
    }

    if (data.faculty_id && Number(data.faculty_id) !== existing.faculty_id) {
        const faculty = await prisma.faculty.findUnique({
            where: { id: Number(data.faculty_id) },
        });
        if (!faculty) {
            const error = new Error('Target faculty not found.');
            error.statusCode = 404;
            throw error;
        }
        if (faculty.status !== 'ACTIVE') {
            const error = new Error('Cannot move department to a non-active faculty.');
            error.statusCode = 422;
            throw error;
        }
    }

    if (data.status && data.status !== existing.status) {
        const allowed = VALID_TRANSITIONS[existing.status] || [];
        if (!allowed.includes(data.status)) {
            const error = new Error(`Cannot transition status from ${existing.status} to ${data.status}. Allowed transitions: ${allowed.join(', ') || 'none'}.`);
            error.statusCode = 422;
            throw error;
        }
    }

    if (data.max_programs !== undefined && existing._count.programs > Number(data.max_programs)) {
        const error = new Error(`Cannot set max_programs to ${data.max_programs} when ${existing._count.programs} programs already exist.`);
        error.statusCode = 422;
        throw error;
    }

    if (data.max_teachers !== undefined && existing._count.teachers > Number(data.max_teachers)) {
        const error = new Error(`Cannot set max_teachers to ${data.max_teachers} when ${existing._count.teachers} teachers already exist.`);
        error.statusCode = 422;
        throw error;
    }

    const updateData = {};
    const fields = [
        'name', 'code', 'description', 'phone', 'email', 'office_location',
        'vision', 'mission', 'hod_name', 'hod_email', 'hod_phone', 'status', 'faculty_id',
    ];

    for (const field of fields) {
        if (data[field] !== undefined) {
            updateData[field] = data[field] === '' && !['name', 'code', 'status', 'faculty_id'].includes(field) ? null : data[field];
        }
    }

    const numericFields = ['max_programs', 'max_teachers', 'student_capacity'];
    for (const field of numericFields) {
        if (data[field] !== undefined && data[field] !== '') {
            updateData[field] = Number(data[field]);
        }
    }

    const jsonFields = ['facilities', 'research_areas'];
    for (const field of jsonFields) {
        if (data[field] !== undefined) {
            updateData[field] = parseJSONField(data[field], field);
        }
    }

    if (data.established_date !== undefined && data.established_date !== '') {
        updateData.established_date = parseValidDate(data.established_date);
    } else if (data.established_date === '') {
        updateData.established_date = null;
    }

    return prisma.department.update({
        where: { id: departmentId },
        data: updateData,
        include: listInclude,
    });
}

export async function deleteDepartment(id) {
    const departmentId = Number(id);
    const existing = await prisma.department.findUnique({
        where: { id: departmentId },
        include: { _count: { select: { programs: true, teachers: true, courses: true, students: true } } },
    });
    if (!existing) {
        const error = new Error('Department not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing._count.programs > 0) {
        const error = new Error('Cannot delete department with active programs. Remove all programs first.');
        error.statusCode = 409;
        throw error;
    }
    if (existing._count.teachers > 0) {
        const error = new Error('Cannot delete department with active teachers. Reassign teachers first.');
        error.statusCode = 409;
        throw error;
    }
    if (existing._count.courses > 0) {
        const error = new Error('Cannot delete department with active courses. Remove all courses first.');
        error.statusCode = 409;
        throw error;
    }
    if (existing._count.students > 0) {
        const error = new Error('Cannot delete department with active students. Reassign students first.');
        error.statusCode = 409;
        throw error;
    }
    await prisma.department.delete({ where: { id: departmentId } });
    return existing;
}

export async function getDepartmentStats(id) {
    const departmentId = Number(id);
    const department = await prisma.department.findUnique({
        where: { id: departmentId },
        include: { _count: { select: { programs: true, teachers: true, courses: true, students: true } } },
    });
    if (!department) {
        const error = new Error('Department not found.');
        error.statusCode = 404;
        throw error;
    }

    return {
        program_count: department._count.programs,
        teacher_count: department._count.teachers,
        course_count: department._count.courses,
        student_count: department._count.students,
    };
}
