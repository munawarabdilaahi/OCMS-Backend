import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createInvoiceSchema, updateInvoiceSchema } from '../validators/invoice.validator.js';
import { createInvoice, listInvoices, getInvoiceById, getInvoiceByNumber, updateInvoice, deleteInvoice, getInvoiceStats } from '../controllers/invoice.controller.js';

const router = Router();
router.use(authenticate);

router.get('/stats', authorize('Admin', 'SuperAdmin', 'Accountant'), getInvoiceStats);
router.get('/', authorize('Admin', 'SuperAdmin', 'Accountant'), listInvoices);
router.get('/by-number/:invoiceNumber', authorize('Admin', 'SuperAdmin', 'Accountant'), getInvoiceByNumber);
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), getInvoiceById);
router.post('/', authorize('Admin', 'SuperAdmin', 'Accountant'), validate(createInvoiceSchema), createInvoice);
router.put('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), validate(updateInvoiceSchema), updateInvoice);
router.delete('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), deleteInvoice);

export default router;
