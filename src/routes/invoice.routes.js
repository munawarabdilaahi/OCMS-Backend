import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { createInvoice, listInvoices, getInvoiceById, getInvoiceByNumber, updateInvoice, deleteInvoice, getInvoiceStats } from '../controllers/invoice.controller.js';

const router = Router();
router.use(authenticate);

router.get('/stats', authorize('Admin', 'SuperAdmin', 'Accountant'), getInvoiceStats);
router.get('/', authorize('Admin', 'SuperAdmin', 'Accountant'), listInvoices);
router.get('/by-number/:invoiceNumber', authorize('Admin', 'SuperAdmin', 'Accountant'), getInvoiceByNumber);
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), getInvoiceById);
router.post('/', authorize('Admin', 'SuperAdmin', 'Accountant'), createInvoice);
router.put('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), updateInvoice);
router.delete('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), deleteInvoice);

export default router;
