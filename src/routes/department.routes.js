import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../validators/department.validator.js';
import { listDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment } from '../controllers/department.controller.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /departments:
 *   get:
 *     tags: [Departments]
 *     summary: List departments
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Departments list
 */
router.get('/', authorize('Admin', 'SuperAdmin', 'Teacher'), listDepartments);

/**
 * @openapi
 * /departments/{id}:
 *   get:
 *     tags: [Departments]
 *     summary: Get department by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Department data
 *       404:
 *         description: Department not found
 */
router.get('/:id', authorize('Admin', 'SuperAdmin', 'Teacher'), getDepartmentById);

/**
 * @openapi
 * /departments:
 *   post:
 *     tags: [Departments]
 *     summary: Create a department
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *     responses:
 *       201:
 *         description: Department created
 */
router.post('/', authorize('Admin', 'SuperAdmin'), validate(createDepartmentSchema), createDepartment);

/**
 * @openapi
 * /departments/{id}:
 *   put:
 *     tags: [Departments]
 *     summary: Update a department
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
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Department updated
 */
router.put('/:id', authorize('Admin', 'SuperAdmin'), validate(updateDepartmentSchema), updateDepartment);

/**
 * @openapi
 * /departments/{id}:
 *   delete:
 *     tags: [Departments]
 *     summary: Delete a department
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Department deleted
 */
router.delete('/:id', authorize('Admin', 'SuperAdmin'), deleteDepartment);

export default router;
