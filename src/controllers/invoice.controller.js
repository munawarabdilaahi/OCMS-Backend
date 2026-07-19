import prisma from '../config/db.js';

const invoiceDelegate = () => prisma.invoice;

function generateInvoiceNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INV-${timestamp}-${random}`;
}

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

export async function createInvoice(req, res, next) {
    try {
        const { student_id, fee_structure_id, amount, due_date, academic_year, semester, notes } = req.body;
        if (!student_id || !amount || !due_date) {
            return res.status(400).json({ success: false, message: 'student_id, amount, and due_date are required.' });
        }
        const student = await prisma.student.findUnique({ where: { id: Number(student_id) } });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

        const invoice = await invoiceDelegate().create({
            data: {
                invoice_number: generateInvoiceNumber(),
                student_id: Number(student_id),
                fee_structure_id: fee_structure_id ? Number(fee_structure_id) : null,
                amount: Number(amount),
                balance: Number(amount),
                due_date: new Date(due_date),
                academic_year: academic_year || null,
                semester: semester || null,
                notes: notes || null,
            },
            include: invoiceInclude,
        });
        return res.status(201).json({ success: true, message: 'Invoice created.', data: serializeInvoice(invoice) });
    } catch (error) {
        next(error);
    }
}

export async function listInvoices(req, res, next) {
    try {
        const { search, status, student_id, academic_year, page = 1, pageSize = 20 } = req.query;
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
        const skip = (Number(page) - 1) * Number(pageSize);
        const [invoices, total] = await Promise.all([
            invoiceDelegate().findMany({
                where,
                include: invoiceInclude,
                orderBy: { created_at: 'desc' },
                skip,
                take: Number(pageSize),
            }),
            invoiceDelegate().count({ where }),
        ]);
        return res.status(200).json({
            success: true,
            data: invoices.map(serializeInvoice),
            meta: { total, page: Number(page), pageSize: Number(pageSize), pageCount: Math.ceil(total / Number(pageSize)) },
        });
    } catch (error) {
        next(error);
    }
}

export async function getInvoiceById(req, res, next) {
    try {
        const invoice = await invoiceDelegate().findUnique({
            where: { id: Number(req.params.id) },
            include: {
                ...invoiceInclude,
                payments: { orderBy: { created_at: 'desc' } },
            },
        });
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
        return res.status(200).json({ success: true, data: serializeInvoice(invoice) });
    } catch (error) {
        next(error);
    }
}

export async function getInvoiceByNumber(req, res, next) {
    try {
        const invoice = await invoiceDelegate().findUnique({
            where: { invoice_number: req.params.invoiceNumber },
            include: {
                ...invoiceInclude,
                payments: { orderBy: { created_at: 'desc' } },
            },
        });
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
        return res.status(200).json({ success: true, data: serializeInvoice(invoice) });
    } catch (error) {
        next(error);
    }
}

export async function updateInvoice(req, res, next) {
    try {
        const invoiceId = Number(req.params.id);
        const existing = await invoiceDelegate().findUnique({ where: { id: invoiceId } });
        if (!existing) return res.status(404).json({ success: false, message: 'Invoice not found.' });
        const { due_date, academic_year, semester, notes, status } = req.body;
        const invoice = await invoiceDelegate().update({
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
        return res.status(200).json({ success: true, message: 'Invoice updated.', data: serializeInvoice(invoice) });
    } catch (error) {
        next(error);
    }
}

export async function deleteInvoice(req, res, next) {
    try {
        const invoiceId = Number(req.params.id);
        const existing = await invoiceDelegate().findUnique({ where: { id: invoiceId } });
        if (!existing) return res.status(404).json({ success: false, message: 'Invoice not found.' });
        const paymentCount = await prisma.payment.count({ where: { invoice_id: invoiceId } });
        if (paymentCount > 0) {
            return res.status(400).json({ success: false, message: `Cannot delete invoice with ${paymentCount} payment(s). Remove payments first.` });
        }
        await invoiceDelegate().delete({ where: { id: invoiceId } });
        return res.status(200).json({ success: true, message: 'Invoice deleted.' });
    } catch (error) {
        next(error);
    }
}

export async function getInvoiceStats(req, res, next) {
    try {
        const { student_id } = req.query;
        const where = {};
        if (student_id) where.student_id = Number(student_id);

        const [totalInvoiced, outstanding, paid, overdue, openCount] = await Promise.all([
            invoiceDelegate().aggregate({ where, _sum: { amount: true } }),
            invoiceDelegate().aggregate({ where: { ...where, status: { in: ['Pending', 'Partial', 'Overdue'] } }, _sum: { balance: true } }),
            invoiceDelegate().aggregate({ where: { ...where, status: 'Paid' }, _sum: { amount: true } }),
            invoiceDelegate().aggregate({ where: { ...where, status: 'Overdue' }, _sum: { balance: true } }),
            invoiceDelegate().count({ where: { ...where, status: { in: ['Pending', 'Partial', 'Overdue'] } } }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                total_invoiced: Number(totalInvoiced._sum.amount || 0),
                outstanding_balance: Number(outstanding._sum.balance || 0),
                total_paid: Number(paid._sum.amount || 0),
                overdue_balance: Number(overdue._sum.balance || 0),
                open_invoices: openCount,
            },
        });
    } catch (error) {
        next(error);
    }
}
