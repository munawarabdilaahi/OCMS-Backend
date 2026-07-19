import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import prisma from '../config/db.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('Admin', 'SuperAdmin'), async (req, res, next) => {
    try {
        const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
        return res.status(200).json({ success: true, data: roles });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', authorize('Admin', 'SuperAdmin'), async (req, res, next) => {
    try {
        const role = await prisma.role.findUnique({ where: { id: Number(req.params.id) } });
        if (!role) return res.status(404).json({ success: false, message: 'Role not found.' });
        return res.status(200).json({ success: true, data: role });
    } catch (error) {
        next(error);
    }
});

router.post('/', authorize('Admin', 'SuperAdmin'), async (req, res, next) => {
    try {
        const { name, permissions } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Role name is required.' });

        const existing = await prisma.role.findFirst({ where: { name } });
        if (existing) return res.status(409).json({ success: false, message: 'A role with this name already exists.' });

        const role = await prisma.role.create({ data: { name, permissions: permissions || '{}' } });
        return res.status(201).json({ success: true, message: 'Role created successfully.', data: role });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', authorize('Admin', 'SuperAdmin'), async (req, res, next) => {
    try {
        const roleId = Number(req.params.id);
        const existing = await prisma.role.findUnique({ where: { id: roleId } });
        if (!existing) return res.status(404).json({ success: false, message: 'Role not found.' });

        const { name, permissions } = req.body;
        const role = await prisma.role.update({
            where: { id: roleId },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(permissions !== undefined ? { permissions } : {}),
            },
        });
        return res.status(200).json({ success: true, message: 'Role updated successfully.', data: role });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', authorize('Admin', 'SuperAdmin'), async (req, res, next) => {
    try {
        const roleId = Number(req.params.id);
        const existing = await prisma.role.findUnique({ where: { id: roleId } });
        if (!existing) return res.status(404).json({ success: false, message: 'Role not found.' });

        const userCount = await prisma.user.count({ where: { role_id: roleId } });
        if (userCount > 0) {
            return res.status(400).json({ success: false, message: `Cannot delete role with ${userCount} user(s). Reassign users first.` });
        }

        await prisma.role.delete({ where: { id: roleId } });
        return res.status(200).json({ success: true, message: 'Role deleted successfully.' });
    } catch (error) {
        next(error);
    }
});

export default router;
