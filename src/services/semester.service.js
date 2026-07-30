import prisma from '../config/db.js';
import { getPaginationParams } from '../utils/pagination.js';

const semesterInclude = {
    academic_year: { select: { id: true, name: true } },
};

export function serializeSemester(s) {
    return {
        id: s.id,
        name: s.name,
        academicYearId: s.academic_year_id,
        academicYear: s.academic_year?.name || '',
        startDate: s.start_date,
        endDate: s.end_date,
        status: s.status,
        created_at: s.created_at,
        updated_at: s.updated_at,
    };
}

export async function listSemesters(query) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search?.trim();

    const where = {
        ...(search
            ? {
                OR: [
                    { name: { contains: search } },
                    { academic_year: { name: { contains: search } } },
                ],
            }
            : {}),
    };

    const [semesters, total] = await Promise.all([
        prisma.semester.findMany({
            where,
            include: semesterInclude,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
        }),
        prisma.semester.count({ where }),
    ]);

    return { semesters, total, page, limit };
}

export async function getSemesterById(id) {
    return prisma.semester.findUnique({
        where: { id: Number(id) },
        include: semesterInclude,
    });
}

export async function createSemester(data) {
    const { name, academic_year_id } = data;
    const existing = await prisma.semester.findFirst({ where: { name } });
    if (existing) {
        const error = new Error('A semester with this name already exists.');
        error.statusCode = 409;
        throw error;
    }
    const academicYear = await prisma.academicYear.findUnique({ where: { id: Number(academic_year_id) } });
    if (!academicYear) {
        const error = new Error('Academic year not found.');
        error.statusCode = 404;
        throw error;
    }
    return prisma.semester.create({ data, include: semesterInclude });
}

export async function updateSemester(id, data) {
    const semesterId = Number(id);
    const existing = await prisma.semester.findUnique({ where: { id: semesterId } });
    if (!existing) {
        const error = new Error('Semester not found.');
        error.statusCode = 404;
        throw error;
    }
    if (data.academic_year_id) {
        const academicYear = await prisma.academicYear.findUnique({ where: { id: Number(data.academic_year_id) } });
        if (!academicYear) {
            const error = new Error('Academic year not found.');
            error.statusCode = 404;
            throw error;
        }
    }
    return prisma.semester.update({ where: { id: semesterId }, data, include: semesterInclude });
}

export async function deleteSemester(id) {
    const semesterId = Number(id);
    const existing = await prisma.semester.findUnique({ where: { id: semesterId } });
    if (!existing) {
        const error = new Error('Semester not found.');
        error.statusCode = 404;
        throw error;
    }
    await prisma.semester.delete({ where: { id: semesterId } });
    return existing;
}
