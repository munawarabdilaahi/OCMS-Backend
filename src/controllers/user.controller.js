import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';

const userDelegate = () => prisma.user;
const roleDelegate = () => prisma.role;

function serializeUser(user) {
    if (!user) return null;
    const { password, ...safe } = user;
    return {
        ...safe,
        role: user.role?.name || null,
        role_id: user.role_id,
    };
}

export async function getUsers(req, res, next) {
    try {
        const page = Math.max(Number(req.query.page || 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
        const search = req.query.search?.trim();
        const role_id = req.query.role_id ? Number(req.query.role_id) : undefined;
        const status = req.query.status?.trim();
        const skip = (page - 1) * limit;

        const where = {
            ...(role_id ? { role_id } : {}),
            ...(status ? { status } : {}),
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };

        const [users, total] = await Promise.all([
            userDelegate().findMany({ where, include: { role: true }, skip, take: limit, orderBy: { created_at: 'desc' } }),
            userDelegate().count({ where }),
        ]);

        return res.status(200).json({
            success: true,
            message: 'Users retrieved successfully.',
            data: users.map(serializeUser),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
}

export async function getUserById(req, res, next) {
    try {
        const user = await userDelegate().findUnique({ where: { id: Number(req.params.id) }, include: { role: true } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        return res.status(200).json({ success: true, message: 'User retrieved successfully.', data: serializeUser(user) });
    } catch (error) {
        next(error);
    }
}

export async function createUser(req, res, next) {
    try {
        const { name, email, password, phone, role_id, roleId, status = 'ACTIVE' } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        }

        const existing = await userDelegate().findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
        }

        const resolvedRoleId = role_id || roleId;
        if (!resolvedRoleId) {
            return res.status(400).json({ success: false, message: 'role_id is required.' });
        }

        const role = await roleDelegate().findUnique({ where: { id: Number(resolvedRoleId) } });
        if (!role) {
            return res.status(400).json({ success: false, message: 'Invalid role.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await userDelegate().create({
            data: { name, email, password: hashedPassword, phone, role_id: Number(resolvedRoleId), status },
            include: { role: true },
        });

        return res.status(201).json({ success: true, message: 'User created successfully.', data: serializeUser(user) });
    } catch (error) {
        next(error);
    }
}

export async function updateUser(req, res, next) {
    try {
        const userId = Number(req.params.id);
        const existing = await userDelegate().findUnique({ where: { id: userId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const { name, email, phone, role_id, roleId, status, password } = req.body;

        if (email && email !== existing.email) {
            const dup = await userDelegate().findUnique({ where: { email } });
            if (dup) {
                return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
            }
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (status !== undefined) updateData.status = status;
        if (role_id !== undefined || roleId !== undefined) updateData.role_id = Number(role_id || roleId);
        if (password) updateData.password = await bcrypt.hash(password, 12);

        const user = await userDelegate().update({ where: { id: userId }, data: updateData, include: { role: true } });
        return res.status(200).json({ success: true, message: 'User updated successfully.', data: serializeUser(user) });
    } catch (error) {
        next(error);
    }
}

export async function deleteUser(req, res, next) {
    try {
        const userId = Number(req.params.id);
        const existing = await userDelegate().findUnique({ where: { id: userId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        await userDelegate().update({ where: { id: userId }, data: { status: 'DELETED' } });
        return res.status(200).json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
