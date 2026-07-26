import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createFeeSchema, updateFeeSchema } from '../validators/fee.validator.js';
import { createFee, listFees, getFeeById, updateFee, deleteFee } from '../controllers/fee.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('Admin', 'SuperAdmin', 'Accountant'), listFees);
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), getFeeById);
router.post('/', authorize('Admin', 'SuperAdmin', 'Accountant'), validate(createFeeSchema), createFee);
router.put('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), validate(updateFeeSchema), updateFee);
router.delete('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), deleteFee);

export default router;
