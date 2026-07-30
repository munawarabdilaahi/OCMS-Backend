import prisma from '../config/db.js';
import { getPaginationParams } from '../utils/pagination.js';

export function serializeAcademicYear(a) {
    return {
        id: a.id,
        name: a.name,
        startDate: a.start_date,
        endDate: a.end_date,
        status: a.status,
        created_at: a.created_at,
        updated_at: a.updated_at,
    };
}

export async function listAcademicYears(query) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search?.trim();

    const where = {
        ...(search
            ? {
                OR: [
                    { name: { contains: search } },
                ],
            }
            : {}),
    };

    const [academicYears, total] = await Promise.all([
        prisma.academicYear.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
        }),
        prisma.academicYear.count({ where }),
    ]);

    return { academicYears, total, page, limit };
}

export async function getAcademicYearById(id) {
    return prisma.academicYear.findUnique({ where: { id: Number(id) } });
}

export async function createAcademicYear(data) {
    const { name } = data;
    const existing = await prisma.academicYear.findFirst({ where: { name } });
    if (existing) {
        const error = new Error('An academic year with this name already exists.');
        error.statusCode = 409;
        throw error;
    }
    return prisma.academicYear.create({ data });
}

export async function updateAcademicYear(id, data) {
    const academicYearId = Number(id);
    const existing = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
    if (!existing) {
        const error = new Error('Academic year not found.');
        error.statusCode = 404;
        throw error;
    }
    return prisma.academicYear.update({ where: { id: academicYearId }, data });
}

export async function deleteAcademicYear(id) {
    const academicYearId = Number(id);
    const existing = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
    if (!existing) {
        const error = new Error('Academic year not found.');
        error.statusCode = 404;
        throw error;
    }
    await prisma.academicYear.delete({ where: { id: academicYearId } });
    return existing;
}
