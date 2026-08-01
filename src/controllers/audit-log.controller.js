import { buildPaginationMeta } from '../utils/pagination.js';
import {
    serializeAuditLog,
    listAuditLogs as listAuditLogsService,
    getAuditLogById as getAuditLogByIdService,
} from '../services/audit-log.service.js';

export async function listAuditLogs(req, res, next) {
    try {
        const { entries, total, page, limit } = await listAuditLogsService(req.query);
        return res.status(200).json({
            success: true,
            message: 'Audit logs retrieved successfully.',
            data: entries.map(serializeAuditLog),
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getAuditLogById(req, res, next) {
    try {
        const entry = await getAuditLogByIdService(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Audit log not found.' });
        }
        return res.status(200).json({ success: true, message: 'Audit log retrieved successfully.', data: serializeAuditLog(entry) });
    } catch (error) {
        next(error);
    }
}
