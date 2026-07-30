import { buildPaginationMeta } from '../utils/pagination.js';
import { requireAdmin } from '../utils/rbac.js';
import {
    serializeProgram,
    listPrograms as listProgramsService,
    getProgramById as getProgramByIdService,
    createProgram as createProgramService,
    updateProgram as updateProgramService,
    deleteProgram as deleteProgramService,
} from '../services/program.service.js';

export async function listPrograms(req, res, next) {
    try {
        const { programs, total, page, limit } = await listProgramsService(req.query);
        return res.status(200).json({
            success: true,
            message: 'Programs retrieved successfully.',
            data: programs.map(serializeProgram),
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getProgramById(req, res, next) {
    try {
        const program = await getProgramByIdService(req.params.id);
        if (!program) {
            return res.status(404).json({ success: false, message: 'Program not found.' });
        }
        return res.status(200).json({ success: true, message: 'Program retrieved successfully.', data: serializeProgram(program) });
    } catch (error) {
        next(error);
    }
}

export async function createProgram(req, res, next) {
    try {
        requireAdmin(req.user);
        const program = await createProgramService(req.body);
        return res.status(201).json({ success: true, message: 'Program created successfully.', data: serializeProgram(program) });
    } catch (error) {
        next(error);
    }
}

export async function updateProgram(req, res, next) {
    try {
        requireAdmin(req.user);
        const program = await updateProgramService(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Program updated successfully.', data: serializeProgram(program) });
    } catch (error) {
        next(error);
    }
}

export async function deleteProgram(req, res, next) {
    try {
        requireAdmin(req.user);
        await deleteProgramService(req.params.id);
        return res.status(200).json({ success: true, message: 'Program deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
