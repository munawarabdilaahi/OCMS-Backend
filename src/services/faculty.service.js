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
    campus: { select: { id: true, name: true, code: true, status: true } },
    _count: { select: { departments: true } },
};

export function serializeFaculty(f) {
    return {
        id: f.id,
        name: f.name,
        code: f.code,
        established_date: f.established_date,
        description: f.description,
        phone: f.phone,
        email: f.email,
        website: f.website,
        dean_name: f.dean_name,
        dean_email: f.dean_email,
        dean_phone: f.dean_phone,
        office_location: f.office_location,
        office_hours: f.office_hours,
        vision: f.vision,
        mission: f.mission,
        accreditation_body: f.accreditation_body,
        accreditation_status: f.accreditation_status,
        accreditation_expiry: f.accreditation_expiry,
        max_departments: f.max_departments,
        student_capacity: f.student_capacity,
        facilities: f.facilities,
        research_areas: f.research_areas,
        campus_id: f.campus_id,
        campus_name: f.campus?.name || '',
        campus_status: f.campus?.status || '',
        department_count: f._count?.departments ?? f.departments?.length ?? 0,
        status: f.status,
        created_at: f.created_at,
        updated_at: f.updated_at,
    };
}

export async function listFaculties(query) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search?.trim();
    const status = query.status?.trim();
    const campus_id = query.campus_id ? Number(query.campus_id) : undefined;

    const where = {
        ...(search
            ? {
                OR: [
                    { name: { contains: search } },
                    { code: { contains: search } },
                    { campus: { name: { contains: search } } },
                ],
            }
            : {}),
        ...(status ? { status: status.toUpperCase() } : {}),
        ...(campus_id ? { campus_id } : {}),
    };

    const [faculties, total] = await Promise.all([
        prisma.faculty.findMany({
            where,
            include: listInclude,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
        }),
        prisma.faculty.count({ where }),
    ]);

    return { faculties, total, page, limit };
}

export async function getFacultyById(id) {
    return prisma.faculty.findUnique({
        where: { id: Number(id) },
        include: listInclude,
    });
}

export async function createFaculty(data) {
    const { name, campus_id } = data;

    const campus = await prisma.campus.findUnique({
        where: { id: Number(campus_id) },
        include: { _count: { select: { faculties: true } } },
    });
    if (!campus) {
        const error = new Error('Campus not found.');
        error.statusCode = 404;
        throw error;
    }
    if (campus.status !== 'ACTIVE') {
        const error = new Error('Cannot add faculties to a non-active campus.');
        error.statusCode = 422;
        throw error;
    }

    const existingName = await prisma.faculty.findFirst({
        where: { name: { equals: name, mode: 'insensitive' }, campus_id: campus.id },
    });
    if (existingName) {
        const error = new Error('A faculty with this name already exists in this campus.');
        error.statusCode = 409;
        throw error;
    }

    let finalCode = (data.code || name.substring(0, 4).toUpperCase()).toUpperCase();
    let codeConflict = await prisma.faculty.findUnique({ where: { code: finalCode } });
    if (codeConflict) {
        let counter = 1;
        let uniqueCode = finalCode;
        while (await prisma.faculty.findUnique({ where: { code: uniqueCode } })) {
            uniqueCode = finalCode.substring(0, 3) + counter;
            counter++;
        }
        finalCode = uniqueCode;
    }

    return prisma.faculty.create({
        data: {
            name,
            code: finalCode,
            established_date: data.established_date && data.established_date !== '' ? parseValidDate(data.established_date) : undefined,
            description: data.description || undefined,
            phone: data.phone || undefined,
            email: data.email || undefined,
            website: data.website || undefined,
            dean_name: data.dean_name || undefined,
            dean_email: data.dean_email || undefined,
            dean_phone: data.dean_phone || undefined,
            office_location: data.office_location || undefined,
            office_hours: data.office_hours || undefined,
            vision: data.vision || undefined,
            mission: data.mission || undefined,
            accreditation_body: data.accreditation_body || undefined,
            accreditation_status: data.accreditation_status || undefined,
            accreditation_expiry: data.accreditation_expiry && data.accreditation_expiry !== '' ? parseValidDate(data.accreditation_expiry) : undefined,
            max_departments: data.max_departments !== undefined && data.max_departments !== '' ? Number(data.max_departments) : undefined,
            student_capacity: data.student_capacity !== undefined && data.student_capacity !== '' ? Number(data.student_capacity) : undefined,
            facilities: data.facilities !== undefined ? parseJSONField(data.facilities, 'facilities') : undefined,
            research_areas: data.research_areas !== undefined ? parseJSONField(data.research_areas, 'research_areas') : undefined,
            campus_id: campus.id,
            status: data.status || 'ACTIVE',
        },
        include: listInclude,
    });
}

export async function updateFaculty(id, data) {
    const facultyId = Number(id);
    const existing = await prisma.faculty.findUnique({
        where: { id: facultyId },
        include: {
            campus: { select: { id: true, name: true, status: true } },
            _count: { select: { departments: true } },
        },
    });
    if (!existing) {
        const error = new Error('Faculty not found.');
        error.statusCode = 404;
        throw error;
    }

    if (data.name) {
        const conflict = await prisma.faculty.findFirst({
            where: { name: { equals: data.name, mode: 'insensitive' }, campus_id: existing.campus_id, id: { not: facultyId } },
        });
        if (conflict) {
            const error = new Error('A faculty with this name already exists in this campus.');
            error.statusCode = 409;
            throw error;
        }
    }

    if (data.code) {
        const conflict = await prisma.faculty.findFirst({
            where: { code: { equals: data.code, mode: 'insensitive' }, id: { not: facultyId } },
        });
        if (conflict) {
            const error = new Error('A faculty with this code already exists.');
            error.statusCode = 409;
            throw error;
        }
    }

    if (data.campus_id && Number(data.campus_id) !== existing.campus_id) {
        const campus = await prisma.campus.findUnique({
            where: { id: Number(data.campus_id) },
        });
        if (!campus) {
            const error = new Error('Target campus not found.');
            error.statusCode = 404;
            throw error;
        }
        if (campus.status !== 'ACTIVE') {
            const error = new Error('Cannot move faculty to a non-active campus.');
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

    if (data.max_departments !== undefined && existing._count.departments > Number(data.max_departments)) {
        const error = new Error(`Cannot set max_departments to ${data.max_departments} when ${existing._count.departments} departments already exist.`);
        error.statusCode = 422;
        throw error;
    }

    const updateData = {};
    const fields = [
        'name', 'code', 'description', 'phone', 'email', 'website',
        'dean_name', 'dean_email', 'dean_phone', 'office_location',
        'office_hours', 'vision', 'mission', 'accreditation_body',
        'accreditation_status', 'status', 'campus_id',
    ];

    for (const field of fields) {
        if (data[field] !== undefined) {
            updateData[field] = data[field] === '' && !['name', 'code', 'status', 'campus_id'].includes(field) ? null : data[field];
        }
    }

    const numericFields = ['max_departments', 'student_capacity'];
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
    if (data.accreditation_expiry !== undefined && data.accreditation_expiry !== '') {
        updateData.accreditation_expiry = parseValidDate(data.accreditation_expiry);
    } else if (data.accreditation_expiry === '') {
        updateData.accreditation_expiry = null;
    }

    return prisma.faculty.update({
        where: { id: facultyId },
        data: updateData,
        include: listInclude,
    });
}

export async function deleteFaculty(id) {
    const facultyId = Number(id);
    const existing = await prisma.faculty.findUnique({
        where: { id: facultyId },
        include: { _count: { select: { departments: true } } },
    });
    if (!existing) {
        const error = new Error('Faculty not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing._count.departments > 0) {
        const error = new Error('Cannot delete faculty with active departments. Remove all departments first.');
        error.statusCode = 409;
        throw error;
    }
    await prisma.faculty.delete({ where: { id: facultyId } });
    return existing;
}

export async function getFacultyStats(id) {
    const facultyId = Number(id);
    const faculty = await prisma.faculty.findUnique({
        where: { id: facultyId },
        include: { _count: { select: { departments: true } } },
    });
    if (!faculty) {
        const error = new Error('Faculty not found.');
        error.statusCode = 404;
        throw error;
    }

    const [programCount, studentCount, teacherCount] = await Promise.all([
        prisma.program.count({ where: { department: { faculty_id: facultyId } } }),
        prisma.student.count({ where: { department: { faculty_id: facultyId } } }),
        prisma.teacher.count({ where: { department: { faculty_id: facultyId } } }),
    ]);

    return {
        department_count: faculty._count.departments,
        program_count: programCount,
        student_count: studentCount,
        teacher_count: teacherCount,
    };
}