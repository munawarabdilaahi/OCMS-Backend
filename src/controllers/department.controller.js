import { buildPaginationMeta } from '../utils/pagination.js';
import { requireAdmin } from '../utils/rbac.js';
import {
    serializeDepartment,
    listDepartments as listDepartmentsService,
    getDepartmentById as getDepartmentByIdService,
    createDepartment as createDepartmentService,
    updateDepartment as updateDepartmentService,
    deleteDepartment as deleteDepartmentService,
    getDepartmentStats as getDepartmentStatsService,
} from '../services/department.service.js';

export async function listDepartments(req, res, next) {
    try {
        const { departments, total, page, limit } = await listDepartmentsService(req.query);
        return res.status(200).json({
            success: true,
            message: 'Departments retrieved successfully.',
            data: departments.map(serializeDepartment),
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getDepartmentById(req, res, next) {
    try {
        const department = await getDepartmentByIdService(req.params.id);
        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found.' });
        }
        return res.status(200).json({ success: true, message: 'Department retrieved successfully.', data: serializeDepartment(department) });
    } catch (error) {
        next(error);
    }
}

export async function createDepartment(req, res, next) {
    try {
        requireAdmin(req.user);
        const department = await createDepartmentService(req.body);
        return res.status(201).json({ success: true, message: 'Department created successfully.', data: serializeDepartment(department) });
    } catch (error) {
        next(error);
    }
}

export async function updateDepartment(req, res, next) {
    try {
        requireAdmin(req.user);
        const department = await updateDepartmentService(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Department updated successfully.', data: serializeDepartment(department) });
    } catch (error) {
        next(error);
    }
}

export async function deleteDepartment(req, res, next) {
    try {
        requireAdmin(req.user);
        await deleteDepartmentService(req.params.id);
        return res.status(200).json({ success: true, message: 'Department deleted successfully.' });
    } catch (error) {
        next(error);
    }
}

export async function getDepartmentStats(req, res, next) {
    try {
        const stats = await getDepartmentStatsService(req.params.id);
        return res.status(200).json({ success: true, message: 'Department stats retrieved successfully.', data: stats });
    } catch (error) {
        next(error);
    }
}
