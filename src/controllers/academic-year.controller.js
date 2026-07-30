import { buildPaginationMeta } from '../utils/pagination.js';
import { requireAdmin } from '../utils/rbac.js';
import {
    serializeAcademicYear,
    listAcademicYears as listAcademicYearsService,
    getAcademicYearById as getAcademicYearByIdService,
    createAcademicYear as createAcademicYearService,
    updateAcademicYear as updateAcademicYearService,
    deleteAcademicYear as deleteAcademicYearService,
} from '../services/academic-year.service.js';

export async function listAcademicYears(req, res, next) {
    try {
        const { academicYears, total, page, limit } = await listAcademicYearsService(req.query);
        return res.status(200).json({
            success: true,
            message: 'Academic years retrieved successfully.',
            data: academicYears.map(serializeAcademicYear),
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getAcademicYearById(req, res, next) {
    try {
        const academicYear = await getAcademicYearByIdService(req.params.id);
        if (!academicYear) {
            return res.status(404).json({ success: false, message: 'Academic year not found.' });
        }
        return res.status(200).json({ success: true, message: 'Academic year retrieved successfully.', data: serializeAcademicYear(academicYear) });
    } catch (error) {
        next(error);
    }
}

export async function createAcademicYear(req, res, next) {
    try {
        requireAdmin(req.user);
        const academicYear = await createAcademicYearService(req.body);
        return res.status(201).json({ success: true, message: 'Academic year created successfully.', data: serializeAcademicYear(academicYear) });
    } catch (error) {
        next(error);
    }
}

export async function updateAcademicYear(req, res, next) {
    try {
        requireAdmin(req.user);
        const academicYear = await updateAcademicYearService(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Academic year updated successfully.', data: serializeAcademicYear(academicYear) });
    } catch (error) {
        next(error);
    }
}

export async function deleteAcademicYear(req, res, next) {
    try {
        requireAdmin(req.user);
        await deleteAcademicYearService(req.params.id);
        return res.status(200).json({ success: true, message: 'Academic year deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
