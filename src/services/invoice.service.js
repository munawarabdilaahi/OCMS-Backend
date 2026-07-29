import prisma from '../config/db.js';
import { generateInvoiceNumber } from '../utils/crypto.js';
import { getPaginationParams } from '../utils/pagination.js';

const invoiceDelegate = () => prisma.invoice;

const invoiceInclude = {
    student: {
        include: {
            user: { select: { name: true, email: true } },
            department: { select: { name: true } },
        },
    },
    fee_structure: { select: { name: true } },
    payments: { select: { id: true } },
};

function serializeInvoice(invoice) {
    if (!invoice) return null;
    return {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        student_id: invoice.student_id,
        student: invoice.student?.user?.name || '',
        student_email: invoice.student?.user?.email || '',
        admission_no: invoice.student?.admission_no || '',
        department: invoice.student?.department?.name || '',
        fee_structure_id: invoice.fee_structure_id,
        fee_name: invoice.fee_structure?.name || '',
        amount: Number(invoice.amount),
        paid_amount: Number(invoice.paid_amount),
        balance: Number(invoice.balance),
        status: invoice.status,
        due_date: invoice.due_date,
        academic_year: invoice.academic_year || '',
        semester: invoice.semester || '',
        notes: invoice.notes || '',
        payment_count: invoice.payments?.length || 0,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
    };
}

export async function createInvoice(data) {
    const { student_id, fee_structure_id, amount, due_date, academic_year, semester, notes } = data;
    const numericAmount = Number(amount);
    const student = await prisma.student.findUnique({ where: { id: Number(student_id) } });
    if (!student) {
        const error = new Error('Student not found.');
        error.statusCode = 404;
        throw error;
    }

    return invoiceDelegate().create({
        data: {
            invoice_number: generateInvoiceNumber(),
            student_id: Number(student_id),
            fee_structure_id: fee_structure_id ? Number(fee_structure_id) : null,
            amount: numericAmount,
            balance: numericAmount,
            due_date: new Date(due_date),
            academic_year: academic_year || null,
            semester: semester || null,
            notes: notes || null,
        },
        include: invoiceInclude,
    });
}

export async function listInvoices(query, user) {
    const { search, status, student_id, academic_year } = query;
    const { page, limit, skip } = getPaginationParams(query);
    const where = {};
    if (status) where.status = status;
    if (student_id) where.student_id = Number(student_id);
    if (academic_year) where.academic_year = academic_year;
    if (search) {
        where.OR = [
            { invoice_number: { contains: search } },
            { student: { user: { name: { contains: search } } } },
        ];
    }
    if (user.roleName === 'Student') {
        where.student = { user_id: user.id };
    }
    const [invoices, total] = await Promise.all([
        invoiceDelegate().findMany({
            where,
            include: invoiceInclude,
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
        }),
        invoiceDelegate().count({ where }),
    ]);
    return { invoices, total, page, limit };
}

export async function getInvoiceById(id, user) {
    const invoice = await invoiceDelegate().findUnique({
        where: { id: Number(id) },
        include: {
            ...invoiceInclude,
            payments: { orderBy: { created_at: 'desc' } },
        },
    });
    if (invoice && user.roleName === 'Student' && invoice.student?.user_id !== user.id) {
        return null;
    }
    return invoice;
}

export async function getInvoiceByNumber(invoiceNumber, user) {
    const invoice = await invoiceDelegate().findUnique({
        where: { invoice_number: invoiceNumber },
        include: {
            ...invoiceInclude,
            payments: { orderBy: { created_at: 'desc' } },
        },
    });
    if (invoice && user.roleName === 'Student' && invoice.student?.user_id !== user.id) {
        return null;
    }
    return invoice;
}

export async function updateInvoice(id, data) {
    const invoiceId = Number(id);
    const existing = await invoiceDelegate().findUnique({ where: { id: invoiceId } });
    if (!existing) {
        const error = new Error('Invoice not found.');
        error.statusCode = 404;
        throw error;
    }
    const { due_date, academic_year, semester, notes, status } = data;
    return invoiceDelegate().update({
        where: { id: invoiceId },
        data: {
            ...(due_date !== undefined ? { due_date: new Date(due_date) } : {}),
            ...(academic_year !== undefined ? { academic_year } : {}),
            ...(semester !== undefined ? { semester } : {}),
            ...(notes !== undefined ? { notes } : {}),
            ...(status !== undefined ? { status } : {}),
        },
        include: invoiceInclude,
    });
}

export async function deleteInvoice(id) {
    const invoiceId = Number(id);
    const existing = await invoiceDelegate().findUnique({ where: { id: invoiceId } });
    if (!existing) {
        const error = new Error('Invoice not found.');
        error.statusCode = 404;
        throw error;
    }
    const paymentCount = await prisma.payment.count({ where: { invoice_id: invoiceId } });
    if (paymentCount > 0) {
        const error = new Error(`Cannot delete invoice with ${paymentCount} payment(s). Remove payments first.`);
        error.statusCode = 400;
        throw error;
    }
    await invoiceDelegate().delete({ where: { id: invoiceId } });
    return existing;
}

export async function getInvoiceStats(query, user) {
    const { student_id } = query;
    const where = {};
    if (student_id) where.student_id = Number(student_id);
    if (user.roleName === 'Student') {
        where.student = { user_id: user.id };
    }

    const [totalInvoiced, outstanding, paid, overdue, openCount] = await Promise.all([
        invoiceDelegate().aggregate({ where, _sum: { amount: true } }),
        invoiceDelegate().aggregate({ where: { ...where, status: { in: ['Pending', 'Partial', 'Overdue'] } }, _sum: { balance: true } }),
        invoiceDelegate().aggregate({ where: { ...where, status: 'Paid' }, _sum: { amount: true } }),
        invoiceDelegate().aggregate({ where: { ...where, status: 'Overdue' }, _sum: { balance: true } }),
        invoiceDelegate().count({ where: { ...where, status: { in: ['Pending', 'Partial', 'Overdue'] } } }),
    ]);

    return {
        total_invoiced: Number(totalInvoiced._sum.amount || 0),
        outstanding_balance: Number(outstanding._sum.balance || 0),
        total_paid: Number(paid._sum.amount || 0),
        overdue_balance: Number(overdue._sum.balance || 0),
        open_invoices: openCount,
    };
}

export { serializeInvoice };
