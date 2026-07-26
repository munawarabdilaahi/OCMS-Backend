import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createRoleSchema, updateRoleSchema } from '../validators/role.validator.js';
import { listRoles, getRoleById, createRole, updateRole, deleteRole } from '../controllers/role.controller.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /roles:
 *   get:
 *     tags: [Roles]
 *     summary: List all roles
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Roles list
 */
router.get('/', authorize('Admin', 'SuperAdmin'), listRoles);

/**
 * @openapi
 * /roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Get role by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Role data
 */
router.get('/:id', authorize('Admin', 'SuperAdmin'), getRoleById);

/**
 * @openapi
 * /roles:
 *   post:
 *     tags: [Roles]
 *     summary: Create a role
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               permissions: { type: object }
 *     responses:
 *       201:
 *         description: Role created
 */
router.post('/', authorize('Admin', 'SuperAdmin'), validate(createRoleSchema), createRole);

/**
 * @openapi
 * /roles/{id}:
 *   put:
 *     tags: [Roles]
 *     summary: Update a role
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
 *               permissions: { type: object }
 *     responses:
 *       200:
 *         description: Role updated
 */
router.put('/:id', authorize('Admin', 'SuperAdmin'), validate(updateRoleSchema), updateRole);

/**
 * @openapi
 * /roles/{id}:
 *   delete:
 *     tags: [Roles]
 *     summary: Delete a role
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Role deleted
 */
router.delete('/:id', authorize('Admin', 'SuperAdmin'), deleteRole);

export default router;
