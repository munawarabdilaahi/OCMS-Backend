import { listRoles as listRolesService, getRoleById as getRoleByIdService, createRole as createRoleService, updateRole as updateRoleService, deleteRole as deleteRoleService } from '../services/role.service.js';

export async function listRoles(req, res, next) {
    try {
        const roles = await listRolesService();
        return res.status(200).json({ success: true, data: roles });
    } catch (error) {
        next(error);
    }
}

export async function getRoleById(req, res, next) {
    try {
        const role = await getRoleByIdService(req.params.id);
        if (!role) return res.status(404).json({ success: false, message: 'Role not found.' });
        return res.status(200).json({ success: true, data: role });
    } catch (error) {
        next(error);
    }
}

export async function createRole(req, res, next) {
    try {
        const role = await createRoleService(req.body);
        return res.status(201).json({ success: true, message: 'Role created successfully.', data: role });
    } catch (error) {
        next(error);
    }
}

export async function updateRole(req, res, next) {
    try {
        const role = await updateRoleService(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Role updated successfully.', data: role });
    } catch (error) {
        next(error);
    }
}

export async function deleteRole(req, res, next) {
    try {
        await deleteRoleService(req.params.id);
        return res.status(200).json({ success: true, message: 'Role deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
