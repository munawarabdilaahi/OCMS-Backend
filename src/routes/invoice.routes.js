import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
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
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Invoice stats
 */
router.get('/stats', authorize('Admin', 'SuperAdmin', 'Accountant'), getInvoiceStats);

/**
 * @openapi
 * /invoices:
 *   get:
 *     tags: [Invoices]
 *     summary: List invoices with pagination
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: number }
 *       - in: query
 *         name: limit
 *         schema: { type: number }
 *       - in: query
 *         name: student_id
 *         schema: { type: number }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invoices list
 */
router.get('/', authorize('Admin', 'SuperAdmin', 'Accountant'), listInvoices);

/**
 * @openapi
 * /invoices/by-number/{invoiceNumber}:
 *   get:
 *     tags: [Invoices]
 *     summary: Get invoice by invoice number
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceNumber
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invoice data
 */
router.get('/by-number/:invoiceNumber', authorize('Admin', 'SuperAdmin', 'Accountant'), getInvoiceByNumber);

/**
 * @openapi
 * /invoices/{id}:
 *   get:
 *     tags: [Invoices]
 *     summary: Get invoice by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Invoice data
 */
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), getInvoiceById);

/**
 * @openapi
 * /invoices:
 *   post:
 *     tags: [Invoices]
 *     summary: Create an invoice
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               student_id: { type: number }
 *               fee_structure_id: { type: number }
 *               amount: { type: number }
 *               due_date: { type: string, format: date }
 *               academic_year: { type: string }
 *               semester: { type: string }
 *     responses:
 *       201:
 *         description: Invoice created
 */
router.post('/', authorize('Admin', 'SuperAdmin', 'Accountant'), validate(createInvoiceSchema), createInvoice);

/**
 * @openapi
 * /invoices/{id}:
 *   put:
 *     tags: [Invoices]
 *     summary: Update an invoice
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *               status: { type: string }
 *               due_date: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Invoice updated
 */
router.put('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), validate(updateInvoiceSchema), updateInvoice);

/**
 * @openapi
 * /invoices/{id}:
 *   delete:
 *     tags: [Invoices]
 *     summary: Delete an invoice
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Invoice deleted
 */
router.delete('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), deleteInvoice);

export default router;
