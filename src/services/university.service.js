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

const VALID_TRANSITIONS = {
    ACTIVE: ['INACTIVE', 'SUSPENDED'],
    INACTIVE: ['ACTIVE'],
    SUSPENDED: ['INACTIVE'],
    CLOSED: [],
};

export function serializeUniversity(u) {
    return {
        id: u.id,
        name: u.name,
        code: u.code,
        type: u.type,
        established_date: u.established_date,
        accreditation_body: u.accreditation_body,
        accreditation_status: u.accreditation_status,
        accreditation_expiry: u.accreditation_expiry,
        address: u.address,
        phone: u.phone,
        email: u.email,
        website: u.website,
        timezone: u.timezone,
        locale: u.locale,
        currency: u.currency,
        logo_url: u.logo_url,
        favicon_url: u.favicon_url,
        primary_color: u.primary_color,
        secondary_color: u.secondary_color,
        contact_person_name: u.contact_person_name,
        contact_person_email: u.contact_person_email,
        contact_person_phone: u.contact_person_phone,
        mission_statement: u.mission_statement,
        vision_statement: u.vision_statement,
        motto: u.motto,
        max_campuses: u.max_campuses,
        max_students: u.max_students,
        status: u.status,
        campus_count: u._count?.campuses ?? u.campuses?.length ?? 0,
        created_at: u.created_at,
        updated_at: u.updated_at,
    };
}

const listInclude = {
    _count: {
        select: { campuses: true },
    },
};

export async function listUniversities(query) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search?.trim();
    const type = query.type?.trim();
    const status = query.status?.trim();

    const where = {
        ...(search
            ? {
                OR: [
                    { name: { contains: search } },
                    { code: { contains: search } },
                ],
            }
            : {}),
        ...(type ? { type: type.toUpperCase() } : {}),
        ...(status ? { status: status.toUpperCase() } : {}),
    };

    const [universities, total] = await Promise.all([
        prisma.university.findMany({
            where,
            include: listInclude,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
        }),
        prisma.university.count({ where }),
    ]);

    return { universities, total, page, limit };
}

export async function getUniversityById(id) {
    return prisma.university.findUnique({
        where: { id: Number(id) },
        include: {
            ...listInclude,
            campuses: {
                where: { status: 'ACTIVE' },
                select: { id: true, name: true, code: true, status: true },
            },
        },
    });
}

export async function createUniversity(data) {
    const { name, code } = data;

    const existing = await prisma.university.findFirst({
        where: {
            OR: [
                { name: { equals: name, mode: 'insensitive' } },
                ...(code ? [{ code: { equals: code, mode: 'insensitive' } }] : []),
            ],
        },
    });
    if (existing) {
        const field = existing.name.toLowerCase() === name.toLowerCase() ? 'name' : 'code';
        const error = new Error(`A university with this ${field} already exists.`);
        error.statusCode = 409;
        throw error;
    }

    let finalCode = (code || name.substring(0, 4).toUpperCase()).toUpperCase();
    const codeConflict = await prisma.university.findUnique({ where: { code: finalCode } });
    if (codeConflict) {
        let counter = 1;
        let uniqueCode = finalCode;
        while (await prisma.university.findUnique({ where: { code: uniqueCode } })) {
            uniqueCode = finalCode.substring(0, 3) + counter;
            counter++;
        }
        finalCode = uniqueCode;
    }

    return prisma.university.create({
        data: {
            name,
            code: finalCode,
            type: data.type || 'PUBLIC',
            established_date: data.established_date ? parseValidDate(data.established_date) : undefined,
            accreditation_body: data.accreditation_body || undefined,
            accreditation_status: data.accreditation_status || undefined,
            accreditation_expiry: data.accreditation_expiry ? parseValidDate(data.accreditation_expiry) : undefined,
            address: data.address || undefined,
            phone: data.phone || undefined,
            email: data.email || undefined,
            website: data.website || undefined,
            timezone: data.timezone || 'UTC',
            locale: data.locale || 'en',
            currency: data.currency || 'USD',
            logo_url: data.logo_url || undefined,
            favicon_url: data.favicon_url || undefined,
            primary_color: data.primary_color || undefined,
            secondary_color: data.secondary_color || undefined,
            contact_person_name: data.contact_person_name || undefined,
            contact_person_email: data.contact_person_email || undefined,
            contact_person_phone: data.contact_person_phone || undefined,
            mission_statement: data.mission_statement || undefined,
            vision_statement: data.vision_statement || undefined,
            motto: data.motto || undefined,
            max_campuses: data.max_campuses !== undefined && data.max_campuses !== '' ? Number(data.max_campuses) : undefined,
            max_students: data.max_students !== undefined && data.max_students !== '' ? Number(data.max_students) : undefined,
            status: data.status || 'ACTIVE',
        },
    });
}

export async function updateUniversity(id, data) {
    const universityId = Number(id);
    const existing = await prisma.university.findUnique({
        where: { id: universityId },
        include: { _count: { select: { campuses: true } } },
    });
    if (!existing) {
        const error = new Error('University not found.');
        error.statusCode = 404;
        throw error;
    }

    if (data.name) {
        const conflict = await prisma.university.findFirst({
            where: { name: { equals: data.name, mode: 'insensitive' }, id: { not: universityId } },
        });
        if (conflict) {
            const error = new Error('A university with this name already exists.');
            error.statusCode = 409;
            throw error;
        }
    }

    if (data.code) {
        const conflict = await prisma.university.findFirst({
            where: { code: { equals: data.code, mode: 'insensitive' }, id: { not: universityId } },
        });
        if (conflict) {
            const error = new Error('A university with this code already exists.');
            error.statusCode = 409;
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

    if (data.max_campuses !== undefined && existing._count.campuses > Number(data.max_campuses)) {
        const error = new Error(`Cannot set max_campuses to ${data.max_campuses} when ${existing._count.campuses} campuses already exist.`);
        error.statusCode = 422;
        throw error;
    }

    const updateData = {};
    const fields = [
        'name', 'code', 'type', 'address', 'phone', 'email', 'website',
        'timezone', 'locale', 'currency', 'logo_url', 'favicon_url',
        'primary_color', 'secondary_color', 'contact_person_name',
        'contact_person_email', 'contact_person_phone', 'mission_statement',
        'vision_statement', 'motto', 'accreditation_body', 'accreditation_status',
        'status', 'max_campuses', 'max_students',
    ];

    for (const field of fields) {
        if (data[field] !== undefined) {
            if (field === 'max_campuses' || field === 'max_students') {
                updateData[field] = Number(data[field]);
            } else {
                updateData[field] = data[field];
            }
        }
    }

    if (data.established_date !== undefined) {
        updateData.established_date = parseValidDate(data.established_date);
    }
    if (data.accreditation_expiry !== undefined) {
        updateData.accreditation_expiry = parseValidDate(data.accreditation_expiry);
    }

    return prisma.university.update({
        where: { id: universityId },
        data: updateData,
        include: listInclude,
    });
}

export async function deleteUniversity(id) {
    const universityId = Number(id);
    const existing = await prisma.university.findUnique({
        where: { id: universityId },
        include: { _count: { select: { campuses: true } } },
    });
    if (!existing) {
        const error = new Error('University not found.');
        error.statusCode = 404;
        throw error;
    }

    if (existing._count.campuses > 0) {
        const error = new Error('Cannot delete university with active campuses. Remove all campuses first.');
        error.statusCode = 409;
        throw error;
    }

    await prisma.university.delete({ where: { id: universityId } });
    return existing;
}

export async function getUniversityStats(id) {
    const universityId = Number(id);
    const university = await prisma.university.findUnique({
        where: { id: universityId },
        include: {
            _count: {
                select: {
                    campuses: true,
                },
            },
        },
    });
    if (!university) {
        const error = new Error('University not found.');
        error.statusCode = 404;
        throw error;
    }

    const campusIds = (
        await prisma.campus.findMany({
            where: { university_id: universityId },
            select: { id: true },
        })
    ).map((c) => c.id);

    const [facultyCount, departmentCount, programCount, studentCount, teacherCount] =
        await Promise.all([
            campusIds.length > 0
                ? prisma.faculty.count({ where: { campus_id: { in: campusIds } } })
                : 0,
            campusIds.length > 0
                ? prisma.department.count({
                    where: { faculty: { campus_id: { in: campusIds } } },
                })
                : 0,
            campusIds.length > 0
                ? prisma.program.count({
                    where: { department: { faculty: { campus_id: { in: campusIds } } } },
                })
                : 0,
            campusIds.length > 0
                ? prisma.student.count({
                    where: { department: { faculty: { campus_id: { in: campusIds } } } },
                })
                : 0,
            campusIds.length > 0
                ? prisma.teacher.count({
                    where: { department: { faculty: { campus_id: { in: campusIds } } } },
                })
                : 0,
        ]);

    return {
        campus_count: university._count.campuses,
        faculty_count: facultyCount,
        department_count: departmentCount,
        program_count: programCount,
        student_count: studentCount,
        teacher_count: teacherCount,
    };
}
