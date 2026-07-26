import { buildPaginationMeta } from '../utils/pagination.js';
import { serializeEnrollment, createEnrollment as createEnrollmentService, getEnrollments as getEnrollmentsService, deleteEnrollment as deleteEnrollmentService } from '../services/enrollment.service.js';

export async function createEnrollment(req, res, next) {
    try {
        const enrollment = await createEnrollmentService(req.body, req.user);
        return res.status(201).json({ success: true, message: 'Enrollment created successfully.', data: serializeEnrollment(enrollment) });
    } catch (error) {
        next(error);
    }
}

export async function getEnrollments(req, res, next) {
    try {
        const { enrollments, total, page, limit } = await getEnrollmentsService(req.query, req.user);
        return res.status(200).json({
            success: true,
            message: 'Enrollments retrieved successfully.',
            data: enrollments.map(serializeEnrollment),
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteEnrollment(req, res, next) {
    try {
        await deleteEnrollmentService(req.params.id);
        return res.status(200).json({ success: true, message: 'Enrollment deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
