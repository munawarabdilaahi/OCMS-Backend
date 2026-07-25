import { serializeDepartmentList, listDepartments as listDepartmentsService, getDepartmentById as getDepartmentByIdService, createDepartment as createDepartmentService, updateDepartment as updateDepartmentService, deleteDepartment as deleteDepartmentService } from '../services/department.service.js';

export async function listDepartments(req, res, next) {
    try {
        const departments = await listDepartmentsService();
        return res.status(200).json({
            success: true,
            data: departments.map(serializeDepartmentList),
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
        return res.status(200).json({ success: true, data: department });
    } catch (error) {
        next(error);
    }
}

export async function createDepartment(req, res, next) {
    try {
        const department = await createDepartmentService(req.body);
        return res.status(201).json({ success: true, message: 'Department created successfully.', data: department });
    } catch (error) {
        next(error);
    }
}

export async function updateDepartment(req, res, next) {
    try {
        const department = await updateDepartmentService(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Department updated successfully.', data: department });
    } catch (error) {
        next(error);
    }
}

export async function deleteDepartment(req, res, next) {
    try {
        await deleteDepartmentService(req.params.id);
        return res.status(200).json({ success: true, message: 'Department deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
