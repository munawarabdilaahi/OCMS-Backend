import prisma from '../config/db.js';
import { getPaginationParams } from '../utils/pagination.js';

const paymentDelegate = () => prisma.payment;

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

async function updateInvoiceBalance(invoiceId, tx) {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true } });
    if (!invoice) return;
    const paidSum = invoice.payments
        .filter((p) => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Number(invoice.amount) - paidSum;
    let status = 'PENDING';
    if (balance <= 0) status = 'PAID';
    else if (paidSum > 0) status = 'PARTIAL';
    if (status !== 'PAID' && new Date(invoice.due_date) < new Date()) status = 'OVERDUE';
    await tx.invoice.update({
        where: { id: invoiceId },
        data: { paid_amount: paidSum, balance: Math.max(0, balance), status },
    });
}

export async function createPayment(data, userId) {
    const { invoice_id, amount, payment_method, reference_number, notes, status = 'COMPLETED' } = data;
    const numericAmount = Number(amount);
    const invoice = await prisma.invoice.findUnique({ where: { id: Number(invoice_id) } });
    if (!invoice) {
        const error = new Error('Invoice not found.');
        error.statusCode = 404;
        throw error;
    }

    const payment = await prisma.$transaction(async (tx) => {
        const newPayment = await tx.payment.create({
            data: {
                invoice_id: Number(invoice_id),
                amount: numericAmount,
                payment_method,
                reference_number: reference_number || null,
                notes: notes || null,
                recorded_by: userId || null,
                status,
            },
        });
        await tx.transaction.create({
            data: {
                payment_id: newPayment.id,
                type: 'CREDIT',
                amount: numericAmount,
                description: `Payment via ${payment_method}`,
                reference: reference_number || null,
            },
        });
        if (status === 'COMPLETED') {
            await updateInvoiceBalance(Number(invoice_id), tx);
        }
        return newPayment;
    });

    return paymentDelegate().findUnique({
        where: { id: payment.id },
        include: paymentInclude,
    });
}

export async function listPayments(query, user) {
    const { search, status, payment_method, student_id } = query;
    const { page, limit, skip } = getPaginationParams(query);
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
    if (user.roleName === 'Student') {
        where.invoice = { ...(where.invoice || {}), student: { user_id: user.id } };
    }
    const [payments, total] = await Promise.all([
        paymentDelegate().findMany({
            where,
            include: paymentInclude,
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
        }),
        paymentDelegate().count({ where }),
    ]);
    return { payments, total, page, limit };
}

export async function getPaymentById(id, user) {
    const payment = await paymentDelegate().findUnique({
        where: { id: Number(id) },
        include: { ...paymentInclude, transactions: true },
    });
    if (payment && user.roleName === 'Student') {
        const invoice = await prisma.invoice.findUnique({ where: { id: payment.invoice_id } });
        if (!invoice || invoice.student?.user_id !== user.id) {
            return null;
        }
    }
    return payment;
}

export async function getPaymentStats(query, user) {
    const { student_id } = query;
    const where = {};
    if (student_id) where.invoice = { student_id: Number(student_id) };
    if (user.roleName === 'Student') {
        where.invoice = { ...(where.invoice || {}), student: { user_id: user.id } };
    }

    const [totalReceived, thisMonth, completedCount, pendingCount] = await Promise.all([
        paymentDelegate().aggregate({ where: { ...where, status: 'COMPLETED' }, _sum: { amount: true } }),
        paymentDelegate().aggregate({
            where: {
                ...where,
                status: 'COMPLETED',
                created_at: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            },
            _sum: { amount: true },
        }),
        paymentDelegate().count({ where: { ...where, status: 'COMPLETED' } }),
        paymentDelegate().count({ where: { ...where, status: 'PENDING' } }),
    ]);

    return {
        total_received: Number(totalReceived._sum.amount || 0),
        this_month: Number(thisMonth._sum.amount || 0),
        completed_count: completedCount,
        pending_count: pendingCount,
    };
}

export { serializePayment };
