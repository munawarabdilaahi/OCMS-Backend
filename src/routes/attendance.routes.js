import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { createAttendance, deleteAttendance, getAttendance, getAttendanceStats, bulkCreateAttendance, updateAttendance } from '../controllers/attendance.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Admin', 'SuperAdmin', 'Teacher'), createAttendance);
router.post('/bulk', authorize('Admin', 'SuperAdmin', 'Teacher'), bulkCreateAttendance);
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getAttendance);
router.get('/stats', authorize('Admin', 'SuperAdmin', 'Teacher', 'Student'), getAttendanceStats);
router.put('/:id', authorize('Admin', 'SuperAdmin', 'Teacher'), updateAttendance);
router.delete('/:id', authorize('Admin', 'SuperAdmin'), deleteAttendance);

export default router;
