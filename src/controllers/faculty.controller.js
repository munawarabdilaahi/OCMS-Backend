import { buildPaginationMeta } from '../utils/pagination.js';
import { requireAdmin } from '../utils/rbac.js';
import {
    serializeFaculty,
    listFaculties as listFacultiesService,
    getFacultyById as getFacultyByIdService,
    createFaculty as createFacultyService,
    updateFaculty as updateFacultyService,
    deleteFaculty as deleteFacultyService,
    getFacultyStats as getFacultyStatsService,
} from '../services/faculty.service.js';

export async function listFaculties(req, res, next) {
    try {
        const { faculties, total, page, limit } = await listFacultiesService(req.query);
        return res.status(200).json({
            success: true,
            message: 'Faculties retrieved successfully.',
            data: faculties.map(serializeFaculty),
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getFacultyById(req, res, next) {
    try {
        const faculty = await getFacultyByIdService(req.params.id);
        if (!faculty) {
            return res.status(404).json({ success: false, message: 'Faculty not found.' });
        }
        return res.status(200).json({ success: true, message: 'Faculty retrieved successfully.', data: serializeFaculty(faculty) });
    } catch (error) {
        next(error);
    }
}

export async function createFaculty(req, res, next) {
    try {
        requireAdmin(req.user);
        const faculty = await createFacultyService(req.body);
        return res.status(201).json({ success: true, message: 'Faculty created successfully.', data: serializeFaculty(faculty) });
    } catch (error) {
        next(error);
    }
}

export async function updateFaculty(req, res, next) {
    try {
        requireAdmin(req.user);
        const faculty = await updateFacultyService(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Faculty updated successfully.', data: serializeFaculty(faculty) });
    } catch (error) {
        next(error);
    }
}

export async function deleteFaculty(req, res, next) {
    try {
        requireAdmin(req.user);
        await deleteFacultyService(req.params.id);
        return res.status(200).json({ success: true, message: 'Faculty deleted successfully.' });
    } catch (error) {
        next(error);
    }
}

export async function getFacultyStats(req, res, next) {
    try {
        const stats = await getFacultyStatsService(req.params.id);
        return res.status(200).json({ success: true, message: 'Faculty stats retrieved successfully.', data: stats });
    } catch (error) {
        next(error);
    }
}