import { buildPaginationMeta } from '../utils/pagination.js';
import { requireAdmin } from '../utils/rbac.js';
import {
    serializeSemester,
    listSemesters as listSemestersService,
    getSemesterById as getSemesterByIdService,
    createSemester as createSemesterService,
    updateSemester as updateSemesterService,
    deleteSemester as deleteSemesterService,
} from '../services/semester.service.js';

export async function listSemesters(req, res, next) {
    try {
        const { semesters, total, page, limit } = await listSemestersService(req.query);
        return res.status(200).json({
            success: true,
            message: 'Semesters retrieved successfully.',
            data: semesters.map(serializeSemester),
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getSemesterById(req, res, next) {
    try {
        const semester = await getSemesterByIdService(req.params.id);
        if (!semester) {
            return res.status(404).json({ success: false, message: 'Semester not found.' });
        }
        return res.status(200).json({ success: true, message: 'Semester retrieved successfully.', data: serializeSemester(semester) });
    } catch (error) {
        next(error);
    }
}

export async function createSemester(req, res, next) {
    try {
        requireAdmin(req.user);
        const semester = await createSemesterService(req.body);
        return res.status(201).json({ success: true, message: 'Semester created successfully.', data: serializeSemester(semester) });
    } catch (error) {
        next(error);
    }
}

export async function updateSemester(req, res, next) {
    try {
        requireAdmin(req.user);
        const semester = await updateSemesterService(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Semester updated successfully.', data: serializeSemester(semester) });
    } catch (error) {
        next(error);
    }
}

export async function deleteSemester(req, res, next) {
    try {
        requireAdmin(req.user);
        await deleteSemesterService(req.params.id);
        return res.status(200).json({ success: true, message: 'Semester deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
