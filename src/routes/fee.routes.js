import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createFeeSchema, updateFeeSchema } from '../validators/fee.validator.js';
import { createFee, listFees, getFeeById, updateFee, deleteFee } from '../controllers/fee.controller.js';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /fees:
 *   get:
 *     tags: [Fees]
 *     summary: List fee structures
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Fee structures list
 */
router.get('/', authorize('Admin', 'SuperAdmin', 'Accountant'), listFees);

/**
 * @openapi
 * /fees/{id}:
 *   get:
 *     tags: [Fees]
 *     summary: Get fee structure by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Fee structure data
 */
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), getFeeById);

/**
 * @openapi
 * /fees:
 *   post:
 *     tags: [Fees]
 *     summary: Create a fee structure
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               amount: { type: number }
 *               department_id: { type: number }
 *               academic_year: { type: string }
 *               semester: { type: string }
 *     responses:
 *       201:
 *         description: Fee structure created
 */
router.post('/', authorize('Admin', 'SuperAdmin', 'Accountant'), validate(createFeeSchema), createFee);

/**
 * @openapi
 * /fees/{id}:
 *   put:
 *     tags: [Fees]
 *     summary: Update a fee structure
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               amount: { type: number }
 *               department_id: { type: number }
 *               academic_year: { type: string }
 *               semester: { type: string }
 *     responses:
 *       200:
 *         description: Fee structure updated
 */
router.put('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), validate(updateFeeSchema), updateFee);

/**
 * @openapi
 * /fees/{id}:
 *   delete:
 *     tags: [Fees]
 *     summary: Delete a fee structure
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Fee structure deleted
 */
router.delete('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), deleteFee);

export default router;
