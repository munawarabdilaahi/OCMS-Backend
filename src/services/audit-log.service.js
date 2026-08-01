import prisma from '../config/db.js';
import { getPaginationParams } from '../utils/pagination.js';

const auditLogInclude = {
    user: { select: { id: true, name: true, email: true } },
};

export function serializeAuditLog(entry) {
    return {
        id: entry.id,
        userId: entry.user_id,
        action: entry.action,
        resource: entry.resource,
        method: entry.method,
        statusCode: entry.status_code,
        ipAddress: entry.ip_address,
        userAgent: entry.user_agent,
        metadata: entry.metadata,
        createdAt: entry.created_at,
        user: entry.user
            ? { id: entry.user.id, name: entry.user.name, email: entry.user.email }
            : null,
    };
}

export async function listAuditLogs(query) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search?.trim();
    const action = query.action?.trim();
    const userId = query.user_id ? Number(query.user_id) : undefined;

    const where = {
        ...(action ? { action } : {}),
        ...(userId ? { user_id: userId } : {}),
        ...(search
            ? {
                OR: [
                    { action: { contains: search } },
                    { resource: { contains: search } },
                    { user: { name: { contains: search } } },
                    { user: { email: { contains: search } } },
                ],
            }
            : {}),
    };

    const [entries, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            include: auditLogInclude,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        }),
        prisma.auditLog.count({ where }),
    ]);

    return { entries, total, page, limit };
}

export async function getAuditLogById(id) {
    return prisma.auditLog.findUnique({
        where: { id: Number(id) },
        include: auditLogInclude,
    });
}
