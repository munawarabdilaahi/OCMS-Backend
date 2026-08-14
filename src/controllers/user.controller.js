import { buildPaginationMeta } from '../utils/pagination.js';
import { requireAdmin } from '../utils/rbac.js';
import { serializeUser, getUsers as getUsersService, getUserById as getUserByIdService, createUser as createUserService, updateUser as updateUserService, deleteUser as deleteUserService } from '../services/user.service.js';

export async function getUsers(req, res, next) {
    try {
        const { users, total, page, limit } = await getUsersService(req.query);
        return res.status(200).json({
            success: true,
            message: 'Users retrieved successfully.',
            data: users.map(serializeUser),
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getUserById(req, res, next) {
    try {
        const user = await getUserByIdService(req.params.id);
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
        requireAdmin(req.user);
        const user = await createUserService(req.body, req.user);
        return res.status(201).json({ success: true, message: 'User created successfully.', data: serializeUser(user) });
    } catch (error) {
        next(error);
    }
}

export async function updateUser(req, res, next) {
    try {
        requireAdmin(req.user);
        const user = await updateUserService(req.params.id, req.body, req.user);
        return res.status(200).json({ success: true, message: 'User updated successfully.', data: serializeUser(user) });
    } catch (error) {
        next(error);
    }
}

export async function deleteUser(req, res, next) {
    try {
        requireAdmin(req.user);
        await deleteUserService(req.params.id);
        return res.status(200).json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
