import { buildPaginationMeta } from '../utils/pagination.js';
import { requireAdmin } from '../utils/rbac.js';
import {
    serializeCampus,
    listCampuses as listCampusesService,
    getCampusById as getCampusByIdService,
    createCampus as createCampusService,
    updateCampus as updateCampusService,
    deleteCampus as deleteCampusService,
    getCampusStats as getCampusStatsService,
} from '../services/campus.service.js';

export async function listCampuses(req, res, next) {
    try {
        const { campuses, total, page, limit } = await listCampusesService(req.query);
        return res.status(200).json({
            success: true,
            message: 'Campuses retrieved successfully.',
            data: campuses.map(serializeCampus),
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getCampusById(req, res, next) {
    try {
        const campus = await getCampusByIdService(req.params.id);
        if (!campus) {
            return res.status(404).json({ success: false, message: 'Campus not found.' });
        }
        return res.status(200).json({ success: true, message: 'Campus retrieved successfully.', data: serializeCampus(campus) });
    } catch (error) {
        next(error);
    }
}

export async function createCampus(req, res, next) {
    try {
        requireAdmin(req.user);
        const campus = await createCampusService(req.body);
        return res.status(201).json({ success: true, message: 'Campus created successfully.', data: serializeCampus(campus) });
    } catch (error) {
        next(error);
    }
}

export async function updateCampus(req, res, next) {
    try {
        requireAdmin(req.user);
        const campus = await updateCampusService(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Campus updated successfully.', data: serializeCampus(campus) });
    } catch (error) {
        next(error);
    }
}

export async function deleteCampus(req, res, next) {
    try {
        requireAdmin(req.user);
        await deleteCampusService(req.params.id);
        return res.status(200).json({ success: true, message: 'Campus deleted successfully.' });
    } catch (error) {
        next(error);
    }
}

export async function getCampusStats(req, res, next) {
    try {
        const stats = await getCampusStatsService(req.params.id);
        return res.status(200).json({ success: true, message: 'Campus stats retrieved successfully.', data: stats });
    } catch (error) {
        next(error);
    }
}