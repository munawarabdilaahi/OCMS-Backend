import { buildPaginationMeta } from '../utils/pagination.js';
import { requireAdmin } from '../utils/rbac.js';
import {
    serializeUniversity,
    listUniversities as listUniversitiesService,
    getUniversityById as getUniversityByIdService,
    createUniversity as createUniversityService,
    updateUniversity as updateUniversityService,
    deleteUniversity as deleteUniversityService,
    getUniversityStats as getUniversityStatsService,
} from '../services/university.service.js';

export async function listUniversities(req, res, next) {
    try {
        const { universities, total, page, limit } = await listUniversitiesService(req.query);
        return res.status(200).json({
            success: true,
            message: 'Universities retrieved successfully.',
            data: universities.map(serializeUniversity),
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getUniversityById(req, res, next) {
    try {
        const university = await getUniversityByIdService(req.params.id);
        if (!university) {
            return res.status(404).json({ success: false, message: 'University not found.' });
        }
        return res.status(200).json({ success: true, message: 'University retrieved successfully.', data: serializeUniversity(university) });
    } catch (error) {
        next(error);
    }
}

export async function createUniversity(req, res, next) {
    try {
        requireAdmin(req.user);
        const university = await createUniversityService(req.body);
        return res.status(201).json({ success: true, message: 'University created successfully.', data: serializeUniversity(university) });
    } catch (error) {
        next(error);
    }
}

export async function updateUniversity(req, res, next) {
    try {
        requireAdmin(req.user);
        const university = await updateUniversityService(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'University updated successfully.', data: serializeUniversity(university) });
    } catch (error) {
        next(error);
    }
}

export async function deleteUniversity(req, res, next) {
    try {
        requireAdmin(req.user);
        await deleteUniversityService(req.params.id);
        return res.status(200).json({ success: true, message: 'University deleted successfully.' });
    } catch (error) {
        next(error);
    }
}

export async function getUniversityStats(req, res, next) {
    try {
        const stats = await getUniversityStatsService(req.params.id);
        return res.status(200).json({ success: true, message: 'University stats retrieved successfully.', data: stats });
    } catch (error) {
        next(error);
    }
}
