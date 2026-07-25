import { serializeFee, createFee as createFeeService, listFees as listFeesService, getFeeById as getFeeByIdService, updateFee as updateFeeService, deleteFee as deleteFeeService } from '../services/fee.service.js';

export async function createFee(req, res, next) {
    try {
        const fee = await createFeeService(req.body);
        return res.status(201).json({ success: true, message: 'Fee structure created.', data: serializeFee(fee) });
    } catch (error) {
        next(error);
    }
}

export async function listFees(req, res, next) {
    try {
        const { fees, total, page, limit } = await listFeesService(req.query);
        return res.status(200).json({
            success: true,
            data: fees.map(serializeFee),
            meta: { total, page, pageSize: limit, pageCount: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
}

export async function getFeeById(req, res, next) {
    try {
        const fee = await getFeeByIdService(req.params.id);
        if (!fee) return res.status(404).json({ success: false, message: 'Fee structure not found.' });
        return res.status(200).json({ success: true, data: serializeFee(fee) });
    } catch (error) {
        next(error);
    }
}

export async function updateFee(req, res, next) {
    try {
        const fee = await updateFeeService(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Fee structure updated.', data: serializeFee(fee) });
    } catch (error) {
        next(error);
    }
}

export async function deleteFee(req, res, next) {
    try {
        await deleteFeeService(req.params.id);
        return res.status(200).json({ success: true, message: 'Fee structure deleted.' });
    } catch (error) {
        next(error);
    }
}
