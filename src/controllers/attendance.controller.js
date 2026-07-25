import { buildPaginationMeta } from '../utils/pagination.js';
import { serializeAttendance, createAttendance as createAttendanceService, getAttendance as getAttendanceService, getAttendanceStats as getAttendanceStatsService, updateAttendance as updateAttendanceService, deleteAttendance as deleteAttendanceService, bulkCreateAttendance as bulkCreateAttendanceService } from '../services/attendance.service.js';

export async function createAttendance(req, res, next) {
    try {
        const record = await createAttendanceService(req.body);
        return res.status(201).json({ success: true, message: 'Attendance recorded successfully.', data: serializeAttendance(record) });
    } catch (error) {
        next(error);
    }
}

export async function getAttendance(req, res, next) {
    try {
        const { records, total, page, limit } = await getAttendanceService(req.query, req.user);
        return res.status(200).json({
            success: true,
            message: 'Attendance records retrieved successfully.',
            data: records.map(serializeAttendance),
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getAttendanceStats(req, res, next) {
    try {
        const data = await getAttendanceStatsService(req.query, req.user);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
}

export async function updateAttendance(req, res, next) {
    try {
        const record = await updateAttendanceService(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Attendance updated successfully.', data: serializeAttendance(record) });
    } catch (error) {
        next(error);
    }
}

export async function deleteAttendance(req, res, next) {
    try {
        await deleteAttendanceService(req.params.id);
        return res.status(200).json({ success: true, message: 'Attendance record deleted successfully.' });
    } catch (error) {
        next(error);
    }
}

export async function bulkCreateAttendance(req, res, next) {
    try {
        const { count, results } = await bulkCreateAttendanceService(req.body);
        return res.status(201).json({ success: true, message: `${count} attendance record(s) processed.`, data: results });
    } catch (error) {
        next(error);
    }
}
