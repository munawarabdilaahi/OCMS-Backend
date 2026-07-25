import prisma from '../config/db.js';
import { getPaginationParams } from '../utils/pagination.js';

const feeDelegate = () => prisma.feeStructure;

const feeInclude = {
    department: { select: { name: true } },
};

export function serializeFee(fee) {
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

export async function createFee(data) {
    const { name, description, amount, department_id, academic_year, semester, status = 'ACTIVE' } = data;
    const numericAmount = Number(amount);
    return feeDelegate().create({
        data: { name, description, amount: numericAmount, department_id: department_id || null, academic_year, semester, status },
        include: feeInclude,
    });
}

export async function listFees(query) {
    const { search, status, academic_year } = query;
    const { page, limit, skip } = getPaginationParams(query);
    const where = {};
    if (search) where.name = { contains: search };
    if (status) where.status = status;
    if (academic_year) where.academic_year = academic_year;
    const [fees, total] = await Promise.all([
        feeDelegate().findMany({
            where,
            include: feeInclude,
            orderBy: { name: 'asc' },
            skip,
            take: limit,
        }),
        feeDelegate().count({ where }),
    ]);
    return { fees, total, page, limit };
}

export async function getFeeById(id) {
    return feeDelegate().findUnique({
        where: { id: Number(id) },
        include: feeInclude,
    });
}

export async function updateFee(id, data) {
    const feeId = Number(id);
    const existing = await feeDelegate().findUnique({ where: { id: feeId } });
    if (!existing) {
        const error = new Error('Fee structure not found.');
        error.statusCode = 404;
        throw error;
    }
    const { name, description, amount, department_id, academic_year, semester, status } = data;
    return feeDelegate().update({
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
        include: feeInclude,
    });
}

export async function deleteFee(id) {
    const feeId = Number(id);
    const existing = await feeDelegate().findUnique({ where: { id: feeId } });
    if (!existing) {
        const error = new Error('Fee structure not found.');
        error.statusCode = 404;
        throw error;
    }
    const invoiceCount = await prisma.invoice.count({ where: { fee_structure_id: feeId } });
    if (invoiceCount > 0) {
        const error = new Error(`Cannot delete fee with ${invoiceCount} invoice(s). Remove invoices first.`);
        error.statusCode = 400;
        throw error;
    }
    await feeDelegate().delete({ where: { id: feeId } });
    return existing;
}
