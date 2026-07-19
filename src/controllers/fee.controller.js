import prisma from '../config/db.js';

const feeDelegate = () => prisma.feeStructure;

function serializeFee(fee) {
    if (!fee) return null;
    return {
        id: fee.id,
        name: fee.name,
        description: fee.description || '',
        amount: Number(fee.amount),
        department_id: fee.department_id,
        department: fee.department?.name || null,
        academic_year: fee.academic_year,
        semester: fee.semester || '',
        status: fee.status,
        created_at: fee.created_at,
        updated_at: fee.updated_at,
    };
}

export async function createFee(req, res, next) {
    try {
        const { name, description, amount, department_id, academic_year, semester, status = 'ACTIVE' } = req.body;
        if (!name || amount === undefined || !academic_year) {
            return res.status(400).json({ success: false, message: 'Name, amount, and academic_year are required.' });
        }
        const fee = await feeDelegate().create({
            data: { name, description, amount: Number(amount), department_id: department_id || null, academic_year, semester, status },
            include: { department: { select: { name: true } } },
        });
        return res.status(201).json({ success: true, message: 'Fee structure created.', data: serializeFee(fee) });
    } catch (error) {
        next(error);
    }
}

export async function listFees(req, res, next) {
    try {
        const { search, status, academic_year, page = 1, pageSize = 20 } = req.query;
        const where = {};
        if (search) where.name = { contains: search };
        if (status) where.status = status;
        if (academic_year) where.academic_year = academic_year;
        const skip = (Number(page) - 1) * Number(pageSize);
        const [fees, total] = await Promise.all([
            feeDelegate().findMany({
                where,
                include: { department: { select: { name: true } } },
                orderBy: { name: 'asc' },
                skip,
                take: Number(pageSize),
            }),
            feeDelegate().count({ where }),
        ]);
        return res.status(200).json({
            success: true,
            data: fees.map(serializeFee),
            meta: { total, page: Number(page), pageSize: Number(pageSize), pageCount: Math.ceil(total / Number(pageSize)) },
        });
    } catch (error) {
        next(error);
    }
}

export async function getFeeById(req, res, next) {
    try {
        const fee = await feeDelegate().findUnique({
            where: { id: Number(req.params.id) },
            include: { department: { select: { name: true } } },
        });
        if (!fee) return res.status(404).json({ success: false, message: 'Fee structure not found.' });
        return res.status(200).json({ success: true, data: serializeFee(fee) });
    } catch (error) {
        next(error);
    }
}

export async function updateFee(req, res, next) {
    try {
        const feeId = Number(req.params.id);
        const existing = await feeDelegate().findUnique({ where: { id: feeId } });
        if (!existing) return res.status(404).json({ success: false, message: 'Fee structure not found.' });
        const { name, description, amount, department_id, academic_year, semester, status } = req.body;
        const fee = await feeDelegate().update({
            where: { id: feeId },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(amount !== undefined ? { amount: Number(amount) } : {}),
                ...(department_id !== undefined ? { department_id: department_id || null } : {}),
                ...(academic_year !== undefined ? { academic_year } : {}),
                ...(semester !== undefined ? { semester } : {}),
                ...(status !== undefined ? { status } : {}),
            },
            include: { department: { select: { name: true } } },
        });
        return res.status(200).json({ success: true, message: 'Fee structure updated.', data: serializeFee(fee) });
    } catch (error) {
        next(error);
    }
}

export async function deleteFee(req, res, next) {
    try {
        const feeId = Number(req.params.id);
        const existing = await feeDelegate().findUnique({ where: { id: feeId } });
        if (!existing) return res.status(404).json({ success: false, message: 'Fee structure not found.' });
        const invoiceCount = await prisma.invoice.count({ where: { fee_structure_id: feeId } });
        if (invoiceCount > 0) {
            return res.status(400).json({ success: false, message: `Cannot delete fee with ${invoiceCount} invoice(s). Remove invoices first.` });
        }
        await feeDelegate().delete({ where: { id: feeId } });
        return res.status(200).json({ success: true, message: 'Fee structure deleted.' });
    } catch (error) {
        next(error);
    }
}
