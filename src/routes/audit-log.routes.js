import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
    listAuditLogs,
    getAuditLogById,
} from '../controllers/audit-log.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('Admin', 'SuperAdmin'), listAuditLogs);
router.get('/:id', authorize('Admin', 'SuperAdmin'), getAuditLogById);

export default router;
