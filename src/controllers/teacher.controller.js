import { buildPaginationMeta } from '../utils/pagination.js';
import { requireAdmin } from '../utils/rbac.js';
import { serializeTeacher, getTeacherById as getTeacherByIdService, getTeachers as getTeachersService, deleteTeacher as deleteTeacherService, createTeacher as createTeacherService, updateTeacher as updateTeacherService } from '../services/teacher.service.js';

export async function createTeacher(req, res, next) {
    try {
        requireAdmin(req.user);
        const teacher = await createTeacherService(req.body);
        return res.status(201).json({ success: true, message: 'Teacher created successfully.', data: serializeTeacher(teacher) });
    } catch (error) {
        next(error);
    }
}

export async function getTeachers(req, res, next) {
    try {
        const { teachers, total, page, limit } = await getTeachersService(req.query);
        return res.status(200).json({
            success: true,
            message: 'Teachers retrieved successfully.',
            data: teachers.map(serializeTeacher),
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getTeacherById(req, res, next) {
    try {
        const teacher = await getTeacherByIdService(req.params.id);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found.' });
        }
        return res.status(200).json({
            success: true,
            message: 'Teacher retrieved successfully.',
            data: serializeTeacher(teacher),
        });
    } catch (error) {
        next(error);
    }
}

export async function updateTeacher(req, res, next) {
    try {
        requireAdmin(req.user);
        const teacher = await updateTeacherService(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Teacher updated successfully.', data: serializeTeacher(teacher) });
    } catch (error) {
        next(error);
    }
}

export async function deleteTeacher(req, res, next) {
    try {
        requireAdmin(req.user);
        await deleteTeacherService(req.params.id);
        return res.status(200).json({ success: true, message: 'Teacher deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
