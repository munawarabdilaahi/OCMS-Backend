import prisma from '../config/db.js';
import { getPaginationParams } from '../utils/pagination.js';

const levelInclude = {
    program: { select: { id: true, name: true, code: true } },
};

export function serializeLevel(l) {
    return {
        id: l.id,
        name: l.name,
        code: l.code,
        programId: l.program_id,
        program: l.program?.name || '',
        sortOrder: l.sort_order,
        status: l.status,
        created_at: l.created_at,
        updated_at: l.updated_at,
    };
}

export async function listLevels(query) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search?.trim();

    const where = {
        ...(search
            ? {
                OR: [
                    { name: { contains: search } },
                    { code: { contains: search } },
                    { program: { name: { contains: search } } },
                ],
            }
            : {}),
    };

    const [levels, total] = await Promise.all([
        prisma.level.findMany({
            where,
            include: levelInclude,
            skip,
            take: limit,
            orderBy: { sort_order: 'asc' },
        }),
        prisma.level.count({ where }),
    ]);

    return { levels, total, page, limit };
}

export async function getLevelById(id) {
    return prisma.level.findUnique({
        where: { id: Number(id) },
        include: levelInclude,
    });
}

export async function createLevel(data) {
    const { name, program_id } = data;
    const existing = await prisma.level.findFirst({ where: { name } });
    if (existing) {
        const error = new Error('A level with this name already exists.');
        error.statusCode = 409;
        throw error;
    }
    const program = await prisma.program.findUnique({ where: { id: Number(program_id) } });
    if (!program) {
        const error = new Error('Program not found.');
        error.statusCode = 404;
        throw error;
    }
    return prisma.level.create({ data, include: levelInclude });
}

export async function updateLevel(id, data) {
    const levelId = Number(id);
    const existing = await prisma.level.findUnique({ where: { id: levelId } });
    if (!existing) {
        const error = new Error('Level not found.');
        error.statusCode = 404;
        throw error;
    }
    if (data.program_id) {
        const program = await prisma.program.findUnique({ where: { id: Number(data.program_id) } });
        if (!program) {
            const error = new Error('Program not found.');
            error.statusCode = 404;
            throw error;
        }
    }
    return prisma.level.update({ where: { id: levelId }, data, include: levelInclude });
}

export async function deleteLevel(id) {
    const levelId = Number(id);
    const existing = await prisma.level.findUnique({ where: { id: levelId } });
    if (!existing) {
        const error = new Error('Level not found.');
        error.statusCode = 404;
        throw error;
    }
    await prisma.level.delete({ where: { id: levelId } });
    return existing;
}
