import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { createPayment, listPayments, getPaymentById, getPaymentStats } from '../controllers/payment.controller.js';

const router = Router();
router.use(authenticate);

router.get('/stats', authorize('Admin', 'SuperAdmin', 'Accountant'), getPaymentStats);
router.get('/', authorize('Admin', 'SuperAdmin', 'Accountant'), listPayments);
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), getPaymentById);
router.post('/', authorize('Admin', 'SuperAdmin', 'Accountant'), createPayment);

export default router;
