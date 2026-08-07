import prisma from '../config/db.js';
import { getPaginationParams } from '../utils/pagination.js';
import { getCached, invalidateCache } from '../utils/cache.js';

const REF_CACHE_TTL = 5 * 60 * 1000;

const programInclude = {
    department: { select: { id: true, name: true, code: true } },
};

export function serializeProgram(p) {
    return {
        id: p.id,
        name: p.name,
        code: p.code,
        departmentId: p.department_id,
        department: p.department?.name || '',
        durationYears: p.duration_years,
        type: p.type,
        status: p.status,
        created_at: p.created_at,
        updated_at: p.updated_at,
    };
}

export async function listPrograms(query) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search?.trim();

    const cacheKey = `programs:${page}:${limit}:${search || ''}`;

    if (!search) {
        return getCached(cacheKey, REF_CACHE_TTL, async () => {
            const [programs, total] = await Promise.all([
                prisma.program.findMany({ include: programInclude, skip, take: limit, orderBy: { name: 'asc' } }),
                prisma.program.count(),
            ]);
            return { programs, total, page, limit };
        });
    }

    const where = {
        OR: [
            { name: { contains: search } },
            { code: { contains: search } },
            { department: { name: { contains: search } } },
        ],
    };

    const [programs, total] = await Promise.all([
        prisma.program.findMany({ where, include: programInclude, skip, take: limit, orderBy: { name: 'asc' } }),
        prisma.program.count({ where }),
    ]);

    return { programs, total, page, limit };
}

export async function getProgramById(id) {
    return prisma.program.findUnique({
        where: { id: Number(id) },
        include: programInclude,
    });
}

export async function createProgram(data) {
    const { name, department_id } = data;
    const existing = await prisma.program.findFirst({ where: { name } });
    if (existing) {
        const error = new Error('A program with this name already exists.');
        error.statusCode = 409;
        throw error;
    }
    const department = await prisma.department.findUnique({ where: { id: Number(department_id) } });
    if (!department) {
        const error = new Error('Department not found.');
        error.statusCode = 404;
        throw error;
    }
    invalidateCache('programs:');
    return prisma.program.create({ data, include: programInclude });
}

export async function updateProgram(id, data) {
    invalidateCache('programs:');
    const programId = Number(id);
    const existing = await prisma.program.findUnique({ where: { id: programId } });
    if (!existing) {
        const error = new Error('Program not found.');
        error.statusCode = 404;
        throw error;
    }
    if (data.department_id) {
        const department = await prisma.department.findUnique({ where: { id: Number(data.department_id) } });
        if (!department) {
            const error = new Error('Department not found.');
            error.statusCode = 404;
            throw error;
        }
    }
    return prisma.program.update({ where: { id: programId }, data, include: programInclude });
}

export async function deleteProgram(id) {
    const programId = Number(id);
    const existing = await prisma.program.findUnique({ where: { id: programId } });
    if (!existing) {
        const error = new Error('Program not found.');
        error.statusCode = 404;
        throw error;
    }
    invalidateCache('programs:');
    await prisma.program.delete({ where: { id: programId } });
    return existing;
}
