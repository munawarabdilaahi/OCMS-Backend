import prisma from '../config/db.js';

const paymentDelegate = () => prisma.payment;

function serializePayment(payment) {
    if (!payment) return null;
    return {
        id: payment.id,
        invoice_id: payment.invoice_id,
        invoice_number: payment.invoice?.invoice_number || '',
        student: payment.invoice?.student?.user?.name || '',
        student_id: payment.invoice?.student_id || null,
        amount: Number(payment.amount),
        payment_method: payment.payment_method,
        reference_number: payment.reference_number || '',
        status: payment.status,
        notes: payment.notes || '',
        recorded_by: payment.recorded_by,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
    };
}

const paymentInclude = {
    invoice: {
        include: {
            student: {
                include: {
                    user: { select: { name: true, email: true } },
                },
            },
        },
    },
};

async function updateInvoiceBalance(invoiceId, tx) {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true } });
    if (!invoice) return;
    const paidSum = invoice.payments
        .filter((p) => p.status === 'Completed')
        .reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Number(invoice.amount) - paidSum;
    let status = 'Pending';
    if (balance <= 0) status = 'Paid';
    else if (paidSum > 0) status = 'Partial';
    if (status !== 'Paid' && new Date(invoice.due_date) < new Date()) status = 'Overdue';
    await tx.invoice.update({
        where: { id: invoiceId },
        data: { paid_amount: paidSum, balance: Math.max(0, balance), status },
    });
}

export async function createPayment(req, res, next) {
    try {
        const { invoice_id, amount, payment_method, reference_number, notes, status = 'Completed' } = req.body;
        if (!invoice_id || !amount || !payment_method) {
            return res.status(400).json({ success: false, message: 'invoice_id, amount, and payment_method are required.' });
        }
        const invoice = await prisma.invoice.findUnique({ where: { id: Number(invoice_id) } });
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

        const payment = await prisma.$transaction(async (tx) => {
            const newPayment = await tx.payment.create({
                data: {
                    invoice_id: Number(invoice_id),
                    amount: Number(amount),
                    payment_method,
                    reference_number: reference_number || null,
                    notes: notes || null,
                    recorded_by: req.user?.id || null,
                    status,
                },
            });
            await tx.transaction.create({
                data: {
                    payment_id: newPayment.id,
                    type: 'CREDIT',
                    amount: Number(amount),
                    description: `Payment via ${payment_method}`,
                    reference: reference_number || null,
                },
            });
            if (status === 'Completed') {
                await updateInvoiceBalance(Number(invoice_id), tx);
            }
            return newPayment;
        });

        const full = await paymentDelegate().findUnique({
            where: { id: payment.id },
            include: paymentInclude,
        });
        return res.status(201).json({ success: true, message: 'Payment recorded.', data: serializePayment(full) });
    } catch (error) {
        next(error);
    }
}

export async function listPayments(req, res, next) {
    try {
        const { search, status, payment_method, student_id, page = 1, pageSize = 20 } = req.query;
        const where = {};
        if (status) where.status = status;
        if (payment_method) where.payment_method = payment_method;
        if (student_id) where.invoice = { student_id: Number(student_id) };
        if (search) {
            where.OR = [
                { reference_number: { contains: search } },
                { invoice: { invoice_number: { contains: search } } },
                { invoice: { student: { user: { name: { contains: search } } } } },
            ];
        }
        const skip = (Number(page) - 1) * Number(pageSize);
        const [payments, total] = await Promise.all([
            paymentDelegate().findMany({
                where,
                include: paymentInclude,
                orderBy: { created_at: 'desc' },
                skip,
                take: Number(pageSize),
            }),
            paymentDelegate().count({ where }),
        ]);
        return res.status(200).json({
            success: true,
            data: payments.map(serializePayment),
            meta: { total, page: Number(page), pageSize: Number(pageSize), pageCount: Math.ceil(total / Number(pageSize)) },
        });
    } catch (error) {
        next(error);
    }
}

export async function getPaymentById(req, res, next) {
    try {
        const payment = await paymentDelegate().findUnique({
            where: { id: Number(req.params.id) },
            include: { ...paymentInclude, transactions: true },
        });
        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
        return res.status(200).json({ success: true, data: serializePayment(payment) });
    } catch (error) {
        next(error);
    }
}

export async function getPaymentStats(req, res, next) {
    try {
        const { student_id } = req.query;
        const where = {};
        if (student_id) where.invoice = { student_id: Number(student_id) };

        const [totalReceived, thisMonth, completedCount, pendingCount] = await Promise.all([
            paymentDelegate().aggregate({ where: { ...where, status: 'Completed' }, _sum: { amount: true } }),
            paymentDelegate().aggregate({
                where: {
                    ...where,
                    status: 'Completed',
                    created_at: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
                },
                _sum: { amount: true },
            }),
            paymentDelegate().count({ where: { ...where, status: 'Completed' } }),
            paymentDelegate().count({ where: { ...where, status: 'Pending' } }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                total_received: Number(totalReceived._sum.amount || 0),
                this_month: Number(thisMonth._sum.amount || 0),
                completed_count: completedCount,
                pending_count: pendingCount,
            },
        });
    } catch (error) {
        next(error);
    }
}
