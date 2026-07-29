import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { auditLog } from '../middlewares/audit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createInvoiceSchema, updateInvoiceSchema } from '../validators/invoice.validator.js';
import { createInvoice, listInvoices, getInvoiceById, getInvoiceByNumber, updateInvoice, deleteInvoice, getInvoiceStats } from '../controllers/invoice.controller.js';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /invoices/stats:
 *   get:
 *     tags: [Invoices]
 *     summary: Get invoice statistics
 *     description: Returns aggregate invoice statistics including totals by status, payment methods, and recent invoices.
 *     operationId: getInvoiceStats
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Invoice statistics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/InvoiceStats'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/stats', authorize('Admin', 'SuperAdmin', 'Accountant'), getInvoiceStats);

/**
 * @openapi
 * /invoices:
 *   get:
 *     tags: [Invoices]
 *     summary: List invoices with pagination
 *     description: Returns a paginated list of invoices with optional student and status filtering.
 *     operationId: listInvoices
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
 *         name: student_id
 *         schema:
 *           type: integer
 *         description: Filter by student ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED]
 *         description: Filter by invoice status
 *     responses:
 *       200:
 *         description: Invoices list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedData'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Invoice'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', authorize('Admin', 'SuperAdmin', 'Accountant'), listInvoices);

/**
 * @openapi
 * /invoices/by-number/{invoiceNumber}:
 *   get:
 *     tags: [Invoices]
 *     summary: Get invoice by invoice number
 *     description: Returns an invoice by its unique invoice number.
 *     operationId: getInvoiceByNumber
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceNumber
 *         required: true
 *         description: Invoice number (e.g. INV-2024-0001)
 *         schema:
 *           type: string
 *           example: INV-2024-0001
 *     responses:
 *       200:
 *         description: Invoice data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Invoice'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/by-number/:invoiceNumber', authorize('Admin', 'SuperAdmin', 'Accountant'), getInvoiceByNumber);

/**
 * @openapi
 * /invoices/{id}:
 *   get:
 *     tags: [Invoices]
 *     summary: Get invoice by ID
 *     description: Returns an invoice by its internal ID.
 *     operationId: getInvoiceById
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Invoice ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Invoice data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Invoice'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), getInvoiceById);

/**
 * @openapi
 * /invoices:
 *   post:
 *     tags: [Invoices]
 *     summary: Create an invoice
 *     description: Creates a new invoice for a student based on a fee structure.
 *     operationId: createInvoice
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Invoice'
 *           example:
 *             student_id: 1
 *             fee_structure_id: 1
 *             amount: 50000
 *             due_date: "2024-10-01"
 *             academic_year: "2024/2025"
 *             semester: FIRST
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Invoice'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', authorize('Admin', 'SuperAdmin', 'Accountant'), auditLog('CREATE_INVOICE'), validate(createInvoiceSchema), createInvoice);

/**
 * @openapi
 * /invoices/{id}:
 *   put:
 *     tags: [Invoices]
 *     summary: Update an invoice
 *     description: Updates invoice details such as amount, status, or due date.
 *     operationId: updateInvoice
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Invoice ID
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 55000
 *               status:
 *                 type: string
 *                 enum: [PENDING, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED]
 *                 example: PAID
 *               due_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-10-15"
 *     responses:
 *       200:
 *         description: Invoice updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Invoice'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), auditLog('UPDATE_INVOICE'), validate(updateInvoiceSchema), updateInvoice);

/**
 * @openapi
 * /invoices/{id}:
 *   delete:
 *     tags: [Invoices]
 *     summary: Delete an invoice
 *     description: Deletes an invoice by its ID.
 *     operationId: deleteInvoice
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Invoice ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Invoice deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), auditLog('DELETE_INVOICE'), deleteInvoice);

export default router;
