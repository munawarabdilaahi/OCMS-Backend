import prisma from '../config/db.js';
import { hashPassword } from '../utils/password.js';
import { getPaginationParams } from '../utils/pagination.js';
import { resolveAccountPassword } from './account.service.js';

const userDelegate = () => prisma.user;
const roleDelegate = () => prisma.role;

function serializeUser(user) {
    if (!user) return null;
    const { password: _password, ...safe } = user;
    return {
        ...safe,
        role: user.role?.name || null,
        role_id: user.role_id,
    };
}

function assertCanAssignRole(user, role) {
    if (role?.name === 'SuperAdmin' && user?.roleName !== 'SuperAdmin') {
        const error = new Error('Access denied. Only SuperAdmin can assign the SuperAdmin role.');
        error.statusCode = 403;
        throw error;
    }
}

export async function getUsers(query) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search?.trim();
    const role_id = query.role_id ? Number(query.role_id) : undefined;
    const status = query.status?.trim();

    const where = {
        ...(role_id ? { role_id } : {}),
        ...(status ? { status } : {}),
        ...(search
            ? {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } },
                ],
            }
            : {}),
    };

    const [users, total] = await Promise.all([
        userDelegate().findMany({ where, include: { role: true }, skip, take: limit, orderBy: { created_at: 'desc' } }),
        userDelegate().count({ where }),
    ]);

    return { users, total, page, limit };
}

export async function getUserById(id) {
    return userDelegate().findUnique({ where: { id: Number(id) }, include: { role: true } });
}

export async function createUser(data, user) {
    const { name, email, password, phone, role_id, roleId, status = 'ACTIVE' } = data;

    const existing = await userDelegate().findUnique({ where: { email } });
    if (existing) {
        const error = new Error('A user with this email already exists.');
        error.statusCode = 409;
        throw error;
    }

    const resolvedRoleId = role_id || roleId;

    const role = await roleDelegate().findUnique({ where: { id: Number(resolvedRoleId) } });
    if (!role) {
        const error = new Error('Invalid role.');
        error.statusCode = 400;
        throw error;
    }
    assertCanAssignRole(user, role);

    const { password: plainPassword } = await resolveAccountPassword(email, password, 'Administrator');
    const hashedPassword = await hashPassword(plainPassword);
    return userDelegate().create({
        data: { name, email, password: hashedPassword, phone, role_id: Number(resolvedRoleId), status },
        include: { role: true },
    });
}

export async function updateUser(id, data, user) {
    const userId = Number(id);
    const existing = await userDelegate().findUnique({ where: { id: userId } });
    if (!existing) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }

    const { name, email, phone, role_id, roleId, status, password } = data;

    if (email && email !== existing.email) {
        const dup = await userDelegate().findUnique({ where: { email } });
        if (dup) {
            const error = new Error('A user with this email already exists.');
            error.statusCode = 409;
            throw error;
        }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (status !== undefined) updateData.status = status;
    if (role_id !== undefined || roleId !== undefined) {
        const resolvedRoleId = Number(role_id || roleId);
        const role = await roleDelegate().findUnique({ where: { id: resolvedRoleId } });
        if (!role) {
            const error = new Error('Invalid role.');
            error.statusCode = 400;
            throw error;
        }
        assertCanAssignRole(user, role);
        updateData.role_id = resolvedRoleId;
    }
    if (password) updateData.password = await hashPassword(password);

    return userDelegate().update({ where: { id: userId }, data: updateData, include: { role: true } });
}

export async function deleteUser(id) {
    const userId = Number(id);
    const existing = await userDelegate().findUnique({ where: { id: userId } });
    if (!existing) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }

    await userDelegate().update({ where: { id: userId }, data: { status: 'DELETED' } });
    return existing;
}

export { serializeUser };
