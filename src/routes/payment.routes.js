import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createPaymentSchema } from '../validators/payment.validator.js';
import { createPayment, listPayments, getPaymentById, getPaymentStats } from '../controllers/payment.controller.js';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /payments/stats:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment statistics
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Payment stats
 */
router.get('/stats', authorize('Admin', 'SuperAdmin', 'Accountant'), getPaymentStats);

/**
 * @openapi
 * /payments:
 *   get:
 *     tags: [Payments]
 *     summary: List payments with pagination
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: number }
 *       - in: query
 *         name: limit
 *         schema: { type: number }
 *       - in: query
 *         name: invoice_id
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Payments list
 */
router.get('/', authorize('Admin', 'SuperAdmin', 'Accountant'), listPayments);

/**
 * @openapi
 * /payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Payment data
 */
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), getPaymentById);

/**
 * @openapi
 * /payments:
 *   post:
 *     tags: [Payments]
 *     summary: Record a payment
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoice_id: { type: number }
 *               amount: { type: number }
 *               payment_method: { type: string, enum: [CASH, CARD, BANK_TRANSFER, CHEQUE, ONLINE] }
 *               reference_number: { type: string }
 *     responses:
 *       201:
 *         description: Payment recorded
 */
router.post('/', authorize('Admin', 'SuperAdmin', 'Accountant'), validate(createPaymentSchema), createPayment);

export default router;
