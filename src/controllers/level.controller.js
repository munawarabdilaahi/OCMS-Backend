import { buildPaginationMeta } from '../utils/pagination.js';
import { requireAdmin } from '../utils/rbac.js';
import {
    serializeLevel,
    listLevels as listLevelsService,
    getLevelById as getLevelByIdService,
    createLevel as createLevelService,
    updateLevel as updateLevelService,
    deleteLevel as deleteLevelService,
} from '../services/level.service.js';

export async function listLevels(req, res, next) {
    try {
        const { levels, total, page, limit } = await listLevelsService(req.query);
        return res.status(200).json({
            success: true,
            message: 'Levels retrieved successfully.',
            data: levels.map(serializeLevel),
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getLevelById(req, res, next) {
    try {
        const level = await getLevelByIdService(req.params.id);
        if (!level) {
            return res.status(404).json({ success: false, message: 'Level not found.' });
        }
        return res.status(200).json({ success: true, message: 'Level retrieved successfully.', data: serializeLevel(level) });
    } catch (error) {
        next(error);
    }
}

export async function createLevel(req, res, next) {
    try {
        requireAdmin(req.user);
        const level = await createLevelService(req.body);
        return res.status(201).json({ success: true, message: 'Level created successfully.', data: serializeLevel(level) });
    } catch (error) {
        next(error);
    }
}

export async function updateLevel(req, res, next) {
    try {
        requireAdmin(req.user);
        const level = await updateLevelService(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Level updated successfully.', data: serializeLevel(level) });
    } catch (error) {
        next(error);
    }
}

export async function deleteLevel(req, res, next) {
    try {
        requireAdmin(req.user);
        await deleteLevelService(req.params.id);
        return res.status(200).json({ success: true, message: 'Level deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
