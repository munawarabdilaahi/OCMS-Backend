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

const listInclude = {
    university: { select: { id: true, name: true, code: true, status: true } },
    _count: { select: { faculties: true } },
};

export function serializeCampus(c) {
    return {
        id: c.id,
        name: c.name,
        code: c.code,
        type: c.type,
        established_date: c.established_date,
        address: c.address,
        phone: c.phone,
        email: c.email,
        website: c.website,
        timezone: c.timezone,
        locale: c.locale,
        currency: c.currency,
        campus_director: c.campus_director,
        director_email: c.director_email,
        director_phone: c.director_phone,
        max_capacity: c.max_capacity,
        facilities: c.facilities,
        accreditation_body: c.accreditation_body,
        accreditation_status: c.accreditation_status,
        accreditation_expiry: c.accreditation_expiry,
        operating_hours: c.operating_hours,
        emergency_contact: c.emergency_contact,
        emergency_phone: c.emergency_phone,
        campus_size: c.campus_size,
        buildings_count: c.buildings_count,
        virtual_campus_url: c.virtual_campus_url,
        parking_capacity: c.parking_capacity,
        transport_routes: c.transport_routes,
        library_hours: c.library_hours,
        cafeteria_count: c.cafeteria_count,
        sports_facilities: c.sports_facilities,
        medical_facilities: c.medical_facilities,
        security_details: c.security_details,
        university_id: c.university_id,
        university_name: c.university?.name || '',
        university_status: c.university?.status || '',
        faculty_count: c._count?.faculties ?? c.faculties?.length ?? 0,
        status: c.status,
        created_at: c.created_at,
        updated_at: c.updated_at,
    };
}

export async function listCampuses(query) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search?.trim();
    const type = query.type?.trim();
    const status = query.status?.trim();
    const university_id = query.university_id ? Number(query.university_id) : undefined;

    const where = {
        ...(search
            ? {
                OR: [
                    { name: { contains: search } },
                    { code: { contains: search } },
                    { university: { name: { contains: search } } },
                ],
            }
            : {}),
        ...(type ? { type: type.toUpperCase() } : {}),
        ...(status ? { status: status.toUpperCase() } : {}),
        ...(university_id ? { university_id } : {}),
    };

    const [campuses, total] = await Promise.all([
        prisma.campus.findMany({
            where,
            include: listInclude,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
        }),
        prisma.campus.count({ where }),
    ]);

    return { campuses, total, page, limit };
}

export async function getCampusById(id) {
    return prisma.campus.findUnique({
        where: { id: Number(id) },
        include: listInclude,
    });
}

export async function createCampus(data) {
    const { name, university_id } = data;

    const university = await prisma.university.findUnique({
        where: { id: Number(university_id) },
        include: { _count: { select: { campuses: true } } },
    });
    if (!university) {
        const error = new Error('University not found.');
        error.statusCode = 404;
        throw error;
    }
    if (university.status !== 'ACTIVE') {
        const error = new Error('Cannot add campuses to a non-active university.');
        error.statusCode = 422;
        throw error;
    }
    if (university.max_campuses && university._count.campuses >= university.max_campuses) {
        const error = new Error(`University campus limit (${university.max_campuses}) reached.`);
        error.statusCode = 422;
        throw error;
    }

    const existingName = await prisma.campus.findFirst({
        where: { name: { equals: name, mode: 'insensitive' }, university_id: university.id },
    });
    if (existingName) {
        const error = new Error('A campus with this name already exists in this university.');
        error.statusCode = 409;
        throw error;
    }

    let finalCode = (data.code || name.substring(0, 4).toUpperCase()).toUpperCase();
    let codeConflict = await prisma.campus.findUnique({ where: { code: finalCode } });
    if (codeConflict) {
        let counter = 1;
        let uniqueCode = finalCode;
        while (await prisma.campus.findUnique({ where: { code: uniqueCode } })) {
            uniqueCode = finalCode.substring(0, 3) + counter;
            counter++;
        }
        finalCode = uniqueCode;
    }

    if (data.type === 'VIRTUAL' && !data.virtual_campus_url) {
        const error = new Error('Virtual campus URL is required for VIRTUAL campus type.');
        error.statusCode = 422;
        throw error;
    }

    return prisma.campus.create({
        data: {
            name,
            code: finalCode,
            type: data.type || 'MAIN',
            established_date: data.established_date && data.established_date !== '' ? parseValidDate(data.established_date) : undefined,
            address: data.address || undefined,
            phone: data.phone || undefined,
            email: data.email || undefined,
            website: data.website || undefined,
            timezone: data.timezone || undefined,
            locale: data.locale || undefined,
            currency: data.currency || undefined,
            campus_director: data.campus_director || undefined,
            director_email: data.director_email || undefined,
            director_phone: data.director_phone || undefined,
            max_capacity: data.max_capacity !== undefined && data.max_capacity !== '' ? Number(data.max_capacity) : undefined,
            facilities: data.facilities !== undefined ? (typeof data.facilities === 'string' ? JSON.parse(data.facilities) : data.facilities) : undefined,
            accreditation_body: data.accreditation_body || undefined,
            accreditation_status: data.accreditation_status || undefined,
            accreditation_expiry: data.accreditation_expiry && data.accreditation_expiry !== '' ? parseValidDate(data.accreditation_expiry) : undefined,
            operating_hours: data.operating_hours || undefined,
            emergency_contact: data.emergency_contact || undefined,
            emergency_phone: data.emergency_phone || undefined,
            campus_size: data.campus_size !== undefined && data.campus_size !== '' ? Number(data.campus_size) : undefined,
            buildings_count: data.buildings_count !== undefined && data.buildings_count !== '' ? Number(data.buildings_count) : undefined,
            virtual_campus_url: data.virtual_campus_url || undefined,
            parking_capacity: data.parking_capacity !== undefined && data.parking_capacity !== '' ? Number(data.parking_capacity) : undefined,
            transport_routes: data.transport_routes !== undefined ? (typeof data.transport_routes === 'string' ? JSON.parse(data.transport_routes) : data.transport_routes) : undefined,
            library_hours: data.library_hours || undefined,
            cafeteria_count: data.cafeteria_count !== undefined && data.cafeteria_count !== '' ? Number(data.cafeteria_count) : undefined,
            sports_facilities: data.sports_facilities !== undefined ? (typeof data.sports_facilities === 'string' ? JSON.parse(data.sports_facilities) : data.sports_facilities) : undefined,
            medical_facilities: data.medical_facilities || undefined,
            security_details: data.security_details || undefined,
            university_id: university.id,
            status: data.status || 'ACTIVE',
        },
        include: listInclude,
    });
}

export async function updateCampus(id, data) {
    const campusId = Number(id);
    const existing = await prisma.campus.findUnique({
        where: { id: campusId },
        include: {
            university: { select: { id: true, name: true, status: true } },
            _count: { select: { faculties: true } },
        },
    });
    if (!existing) {
        const error = new Error('Campus not found.');
        error.statusCode = 404;
        throw error;
    }

    if (data.name) {
        const conflict = await prisma.campus.findFirst({
            where: { name: { equals: data.name, mode: 'insensitive' }, university_id: existing.university_id, id: { not: campusId } },
        });
        if (conflict) {
            const error = new Error('A campus with this name already exists in this university.');
            error.statusCode = 409;
            throw error;
        }
    }

    if (data.code) {
        const conflict = await prisma.campus.findFirst({
            where: { code: { equals: data.code, mode: 'insensitive' }, id: { not: campusId } },
        });
        if (conflict) {
            const error = new Error('A campus with this code already exists.');
            error.statusCode = 409;
            throw error;
        }
    }

    if (data.university_id && Number(data.university_id) !== existing.university_id) {
        const university = await prisma.university.findUnique({
            where: { id: Number(data.university_id) },
            include: { _count: { select: { campuses: true } } },
        });
        if (!university) {
            const error = new Error('Target university not found.');
            error.statusCode = 404;
            throw error;
        }
        if (university.status !== 'ACTIVE') {
            const error = new Error('Cannot move campus to a non-active university.');
            error.statusCode = 422;
            throw error;
        }
        if (university.max_campuses && university._count.campuses >= university.max_campuses) {
            const error = new Error(`Target university campus limit (${university.max_campuses}) reached.`);
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

    if (data.max_capacity !== undefined && existing._count.faculties > 0) {
        const currentStudentCount = await prisma.student.count({
            where: { department: { faculty: { campus_id: campusId } } },
        });
        if (currentStudentCount > Number(data.max_capacity)) {
            const error = new Error(`Cannot set max_capacity to ${data.max_capacity} when ${currentStudentCount} students are currently enrolled.`);
            error.statusCode = 422;
            throw error;
        }
    }

    if (data.type === 'VIRTUAL' && !data.virtual_campus_url) {
        const error = new Error('Virtual campus URL is required for VIRTUAL campus type.');
        error.statusCode = 422;
        throw error;
    }

    const updateData = {};
    const fields = [
        'name', 'code', 'type', 'address', 'phone', 'email', 'website',
        'timezone', 'locale', 'currency', 'campus_director', 'director_email',
        'director_phone', 'accreditation_body', 'accreditation_status',
        'operating_hours', 'emergency_contact', 'emergency_phone',
        'virtual_campus_url', 'library_hours', 'medical_facilities',
        'security_details', 'status', 'university_id',
    ];

    for (const field of fields) {
        if (data[field] !== undefined) {
            updateData[field] = data[field] === '' && !['name', 'code', 'type', 'status', 'university_id'].includes(field) ? null : data[field];
        }
    }

    const numericFields = ['max_capacity', 'campus_size', 'buildings_count', 'parking_capacity', 'cafeteria_count'];
    for (const field of numericFields) {
        if (data[field] !== undefined && data[field] !== '') {
            updateData[field] = Number(data[field]);
        }
    }

    const jsonFields = ['facilities', 'transport_routes', 'sports_facilities'];
    for (const field of jsonFields) {
        if (data[field] !== undefined) {
            updateData[field] = typeof data[field] === 'string' ? JSON.parse(data[field]) : data[field];
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

    return prisma.campus.update({
        where: { id: campusId },
        data: updateData,
        include: listInclude,
    });
}

export async function deleteCampus(id) {
    const campusId = Number(id);
    const existing = await prisma.campus.findUnique({
        where: { id: campusId },
        include: { _count: { select: { faculties: true } } },
    });
    if (!existing) {
        const error = new Error('Campus not found.');
        error.statusCode = 404;
        throw error;
    }
    if (existing._count.faculties > 0) {
        const error = new Error('Cannot delete campus with active faculties. Remove all faculties first.');
        error.statusCode = 409;
        throw error;
    }
    await prisma.campus.delete({ where: { id: campusId } });
    return existing;
}

export async function getCampusStats(id) {
    const campusId = Number(id);
    const campus = await prisma.campus.findUnique({
        where: { id: campusId },
        include: { _count: { select: { faculties: true } } },
    });
    if (!campus) {
        const error = new Error('Campus not found.');
        error.statusCode = 404;
        throw error;
    }

    const facultyIds = (
        await prisma.faculty.findMany({
            where: { campus_id: campusId },
            select: { id: true },
        })
    ).map((f) => f.id);

    const [departmentCount, programCount, studentCount, teacherCount] =
        await Promise.all([
            facultyIds.length > 0
                ? prisma.department.count({ where: { faculty_id: { in: facultyIds } } })
                : 0,
            facultyIds.length > 0
                ? prisma.program.count({ where: { department: { faculty_id: { in: facultyIds } } } })
                : 0,
            facultyIds.length > 0
                ? prisma.student.count({ where: { department: { faculty_id: { in: facultyIds } } } })
                : 0,
            facultyIds.length > 0
                ? prisma.teacher.count({ where: { department: { faculty_id: { in: facultyIds } } } })
                : 0,
        ]);

    return {
        faculty_count: campus._count.faculties,
        department_count: departmentCount,
        program_count: programCount,
        student_count: studentCount,
        teacher_count: teacherCount,
    };
}