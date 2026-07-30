import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { auditLog } from '../middlewares/audit.middleware.js';
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
 *     description: Returns aggregate payment statistics including total collected, by method, by period, and recent transactions.
 *     operationId: getPaymentStats
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Payment statistics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/PaymentStats'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/stats', authorize('Admin', 'SuperAdmin', 'Accountant', 'Student'), getPaymentStats);

/**
 * @openapi
 * /payments:
 *   get:
 *     tags: [Payments]
 *     summary: List payments with pagination
 *     description: Returns a paginated list of payments with optional invoice filtering.
 *     operationId: listPayments
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: invoice_id
 *         schema:
 *           type: integer
 *         description: Filter by invoice ID
 *     responses:
 *       200:
 *         description: Payments list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedData'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', authorize('Admin', 'SuperAdmin', 'Accountant', 'Student'), listPayments);

/**
 * @openapi
 * /payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment by ID
 *     description: Returns details of a specific payment transaction.
 *     operationId: getPaymentById
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Payment ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Payment data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Payment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Accountant', 'Student'), getPaymentById);

/**
 * @openapi
 * /payments:
 *   post:
 *     tags: [Payments]
 *     summary: Record a payment
 *     description: Records a payment against an invoice.
 *     operationId: createPayment
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Payment'
 *           example:
 *             invoice_id: 1
 *             amount: 50000
 *             payment_method: BANK_TRANSFER
 *             reference_number: TXN-123456
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Payment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', authorize('Admin', 'SuperAdmin', 'Accountant'), auditLog('CREATE_PAYMENT'), validate(createPaymentSchema), createPayment);

export default router;
