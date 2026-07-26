import { buildPaginationMeta } from '../utils/pagination.js';
import { serializePayment, createPayment as createPaymentService, listPayments as listPaymentsService, getPaymentById as getPaymentByIdService, getPaymentStats as getPaymentStatsService } from '../services/payment.service.js';

export async function createPayment(req, res, next) {
    try {
        const payment = await createPaymentService(req.body, req.user?.id);
        return res.status(201).json({ success: true, message: 'Payment created successfully.', data: serializePayment(payment) });
    } catch (error) {
        next(error);
    }
}

export async function listPayments(req, res, next) {
    try {
        const { payments, total, page, limit } = await listPaymentsService(req.query);
        return res.status(200).json({
            success: true,
            data: payments.map(serializePayment),
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getPaymentById(req, res, next) {
    try {
        const payment = await getPaymentByIdService(req.params.id);
        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
        return res.status(200).json({ success: true, data: serializePayment(payment) });
    } catch (error) {
        next(error);
    }
}

export async function getPaymentStats(req, res, next) {
    try {
        const data = await getPaymentStatsService(req.query);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
}
