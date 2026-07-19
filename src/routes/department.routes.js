import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import prisma from '../config/db.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher'), async (req, res, next) => {
    try {
        const departments = await prisma.department.findMany({
            include: { _count: { select: { students: true, courses: true } } },
            orderBy: { name: 'asc' },
        });
        return res.status(200).json({
            success: true,
            data: departments.map((d) => ({
                id: d.id,
                code: d.code,
                name: d.name,
                studentCount: d._count.students,
                courseCount: d._count.courses,
                created_at: d.created_at,
            })),
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher'), async (req, res, next) => {
    try {
        const department = await prisma.department.findUnique({
            where: { id: Number(req.params.id) },
            include: { _count: { select: { students: true, courses: true } } },
        });
        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found.' });
        }
        return res.status(200).json({ success: true, data: department });
    } catch (error) {
        next(error);
    }
});

router.post('/', authorize('Admin', 'SuperAdmin'), async (req, res, next) => {
    try {
        const { name, code } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Department name is required.' });
        }
        const existing = await prisma.department.findFirst({ where: { name } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'A department with this name already exists.' });
        }
        const department = await prisma.department.create({ data: { name, code } });
        return res.status(201).json({ success: true, message: 'Department created successfully.', data: department });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', authorize('Admin', 'SuperAdmin'), async (req, res, next) => {
    try {
        const { name, code } = req.body;
        const existing = await prisma.department.findUnique({ where: { id: Number(req.params.id) } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Department not found.' });
        }
        const department = await prisma.department.update({
            where: { id: Number(req.params.id) },
            data: { ...(name !== undefined ? { name } : {}), ...(code !== undefined ? { code } : {}) },
        });
        return res.status(200).json({ success: true, message: 'Department updated successfully.', data: department });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', authorize('Admin', 'SuperAdmin'), async (req, res, next) => {
    try {
        const existing = await prisma.department.findUnique({ where: { id: Number(req.params.id) } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Department not found.' });
        }
        const studentCount = await prisma.student.count({ where: { department_id: Number(req.params.id) } });
        if (studentCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete department with ${studentCount} student(s). Reassign students first.`,
            });
        }
        await prisma.department.delete({ where: { id: Number(req.params.id) } });
        return res.status(200).json({ success: true, message: 'Department deleted successfully.' });
    } catch (error) {
        next(error);
    }
});

export default router;
