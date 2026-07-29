import { buildPaginationMeta } from '../utils/pagination.js';
import { serializeInvoice, createInvoice as createInvoiceService, listInvoices as listInvoicesService, getInvoiceById as getInvoiceByIdService, getInvoiceByNumber as getInvoiceByNumberService, updateInvoice as updateInvoiceService, deleteInvoice as deleteInvoiceService, getInvoiceStats as getInvoiceStatsService } from '../services/invoice.service.js';

export async function createInvoice(req, res, next) {
    try {
        const invoice = await createInvoiceService(req.body);
        return res.status(201).json({ success: true, message: 'Invoice created successfully.', data: serializeInvoice(invoice) });
    } catch (error) {
        next(error);
    }
}

export async function listInvoices(req, res, next) {
    try {
        const { invoices, total, page, limit } = await listInvoicesService(req.query, req.user);
        return res.status(200).json({
            success: true,
            data: invoices.map(serializeInvoice),
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getInvoiceById(req, res, next) {
    try {
        const invoice = await getInvoiceByIdService(req.params.id, req.user);
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
        return res.status(200).json({ success: true, data: serializeInvoice(invoice) });
    } catch (error) {
        next(error);
    }
}

export async function getInvoiceByNumber(req, res, next) {
    try {
        const invoice = await getInvoiceByNumberService(req.params.invoiceNumber, req.user);
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
        return res.status(200).json({ success: true, data: serializeInvoice(invoice) });
    } catch (error) {
        next(error);
    }
}

export async function updateInvoice(req, res, next) {
    try {
        const invoice = await updateInvoiceService(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Invoice updated successfully.', data: serializeInvoice(invoice) });
    } catch (error) {
        next(error);
    }
}

export async function deleteInvoice(req, res, next) {
    try {
        await deleteInvoiceService(req.params.id);
        return res.status(200).json({ success: true, message: 'Invoice deleted successfully.' });
    } catch (error) {
        next(error);
    }
}

export async function getInvoiceStats(req, res, next) {
    try {
        const data = await getInvoiceStatsService(req.query, req.user);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
}
