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
 *     summary: List fee structures with pagination
 *     description: Returns a paginated list of fee structures with optional department and academic year filtering.
 *     operationId: listFeeStructures
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: integer
 *         description: Filter by department ID
 *       - in: query
 *         name: academic_year
 *         schema:
 *           type: string
 *         description: Filter by academic year (e.g. "2024/2025")
 *     responses:
 *       200:
 *         description: Fee structures list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedData'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FeeStructure'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', authorize('Admin', 'SuperAdmin', 'Accountant'), listFees);

/**
 * @openapi
 * /fees/{id}:
 *   get:
 *     tags: [Fees]
 *     summary: Get fee structure by ID
 *     description: Returns details of a specific fee structure.
 *     operationId: getFeeStructureById
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Fee structure ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Fee structure data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/FeeStructure'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), getFeeById);

/**
 * @openapi
 * /fees:
 *   post:
 *     tags: [Fees]
 *     summary: Create a fee structure
 *     description: Creates a new fee structure for a department and academic year.
 *     operationId: createFeeStructure
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeeStructure'
 *           example:
 *             name: Tuition Fee - CS 2024
 *             amount: 50000
 *             department_id: 1
 *             academic_year: "2024/2025"
 *             semester: FIRST
 *     responses:
 *       201:
 *         description: Fee structure created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/FeeStructure'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', authorize('Admin', 'SuperAdmin', 'Accountant'), validate(createFeeSchema), createFee);

/**
 * @openapi
 * /fees/{id}:
 *   put:
 *     tags: [Fees]
 *     summary: Update a fee structure
 *     description: Updates an existing fee structure's details.
 *     operationId: updateFeeStructure
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Fee structure ID
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Tuition Fee - CS 2024 Updated
 *               amount:
 *                 type: number
 *                 example: 55000
 *               department_id:
 *                 type: integer
 *                 example: 1
 *               academic_year:
 *                 type: string
 *                 example: "2024/2025"
 *               semester:
 *                 type: string
 *                 enum: [FIRST, SECOND, SUMMER]
 *                 example: FIRST
 *     responses:
 *       200:
 *         description: Fee structure updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/FeeStructure'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), validate(updateFeeSchema), updateFee);

/**
 * @openapi
 * /fees/{id}:
 *   delete:
 *     tags: [Fees]
 *     summary: Delete a fee structure
 *     description: Deletes a fee structure by its ID.
 *     operationId: deleteFeeStructure
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Fee structure ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Fee structure deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:id', authorize('Admin', 'SuperAdmin', 'Accountant'), deleteFee);

export default router;
