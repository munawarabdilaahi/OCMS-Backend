import prisma from '../config/db.js';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.js';
import { normalizePermissions } from '../middlewares/auth.middleware.js';
import { CANONICAL_ROLES } from '../constants/permissions.js';

const BUILT_IN_ROLES = new Set(CANONICAL_ROLES);

function assertNotBuiltIn(name, action) {
    if (BUILT_IN_ROLES.has(name)) {
        const error = new Error(`Cannot ${action} the built-in role "${name}".`);
        error.statusCode = 400;
        throw error;
    }
}

export async function listRoles(query) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search?.trim();

    const where = search ? { name: { contains: search } } : {};

    const [roles, total] = await Promise.all([
        prisma.role.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
        prisma.role.count({ where }),
    ]);

    return { data: roles, meta: buildPaginationMeta(page, limit, total) };
}

export async function getRoleById(id) {
    return prisma.role.findUnique({ where: { id: Number(id) } });
}

export async function createRole(data) {
    const { name, permissions } = data;
    const existing = await prisma.role.findFirst({ where: { name } });
    if (existing) {
        const error = new Error('A role with this name already exists.');
        error.statusCode = 409;
        throw error;
    }
    return prisma.role.create({ data: { name, permissions: normalizePermissions(permissions) } });
}

export async function updateRole(id, data) {
    const roleId = Number(id);
    const existing = await prisma.role.findUnique({ where: { id: roleId } });
    if (!existing) {
        const error = new Error('Role not found.');
        error.statusCode = 404;
        throw error;
    }
    const { name, permissions } = data;
    if (name !== undefined && name !== existing.name) {
        assertNotBuiltIn(existing.name, 'rename');
    }
    return prisma.role.update({
        where: { id: roleId },
        data: {
            ...(name !== undefined ? { name } : {}),
            ...(permissions !== undefined ? { permissions: normalizePermissions(permissions) } : {}),
        },
    });
}

export async function deleteRole(id) {
    const roleId = Number(id);
    const existing = await prisma.role.findUnique({ where: { id: roleId } });
    if (!existing) {
        const error = new Error('Role not found.');
        error.statusCode = 404;
        throw error;
    }
    assertNotBuiltIn(existing.name, 'delete');
    const userCount = await prisma.user.count({ where: { role_id: roleId } });
    if (userCount > 0) {
        const error = new Error(`Cannot delete role with ${userCount} user(s). Reassign users first.`);
        error.statusCode = 400;
        throw error;
    }
    await prisma.role.delete({ where: { id: roleId } });
    return existing;
}
