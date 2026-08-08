import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import prisma from '../src/config/db.js';
import {
    authorize,
    requirePermission,
    normalizePermissions,
} from '../src/middlewares/auth.middleware.js';
import {
    PERMISSIONS,
    ROLE_PERMISSIONS_DEFAULTS,
    CANONICAL_ROLES,
    ALL_PERMISSION_KEYS,
} from '../src/constants/permissions.js';
import { createRoleSchema, updateRoleSchema } from '../src/validators/role.validator.js';

function mockReq(overrides = {}) {
    return {
        method: 'GET',
        originalUrl: '/api/roles',
        headers: {},
        user: { id: 1 },
        ...overrides,
    };
}

function mockRes() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };
}

async function runAuthorize(allowedRoles, user) {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user);
    await authorize(...allowedRoles)(req, res, next);
    return { req, res, next };
}

describe('permission catalog', () => {
    it('exposes the expected 11 permission keys', () => {
        expect(PERMISSIONS).toHaveLength(11);
        expect(ALL_PERMISSION_KEYS).toEqual([
            'dashboard:view',
            'students:manage',
            'courses:manage',
            'courses:view',
            'attendance:manage',
            'attendance:view',
            'results:manage',
            'results:view',
            'payments:manage',
            'payments:view',
            'settings:manage',
        ]);
    });

    it('defines defaults for the six canonical roles', () => {
        expect(CANONICAL_ROLES).toEqual(['Admin', 'SuperAdmin', 'Registrar', 'Teacher', 'Accountant', 'Student']);
        expect(ROLE_PERMISSIONS_DEFAULTS.Admin).toEqual(['*']);
        expect(ROLE_PERMISSIONS_DEFAULTS.SuperAdmin).toEqual(['*']);
    });

    it('every default permission key is a known permission key or the "*" wildcard', () => {
        for (const role of CANONICAL_ROLES) {
            const defaults = ROLE_PERMISSIONS_DEFAULTS[role];
            expect(defaults).toBeDefined();
            for (const permission of defaults) {
                expect(permission === '*' || ALL_PERMISSION_KEYS.includes(permission)).toBe(true);
            }
        }
    });
});

describe('normalizePermissions', () => {
    it('passes through string arrays', () => {
        expect(normalizePermissions(['students:manage', 'courses:view'])).toEqual(['students:manage', 'courses:view']);
    });

    it('parses JSON-string arrays', () => {
        expect(normalizePermissions('["students:manage","courses:view"]')).toEqual(['students:manage', 'courses:view']);
    });

    it('parses a JSON-string object into its truthy keys', () => {
        expect(normalizePermissions('{"students:manage":true,"courses:view":false}')).toEqual(['students:manage']);
    });

    it('treats an object as its truthy keys', () => {
        expect(normalizePermissions({ 'students:manage': true, 'courses:view': false })).toEqual(['students:manage']);
    });

    it('returns [] for null, undefined, empty array, empty string, and empty object', () => {
        expect(normalizePermissions(null)).toEqual([]);
        expect(normalizePermissions(undefined)).toEqual([]);
        expect(normalizePermissions([])).toEqual([]);
        expect(normalizePermissions('')).toEqual([]);
        expect(normalizePermissions({})).toEqual([]);
    });

    it('falls back to a single-key string when not valid JSON', () => {
        expect(normalizePermissions('students:manage')).toEqual(['students:manage']);
    });

    it('filters non-string entries out of arrays', () => {
        expect(normalizePermissions(['students:manage', 42, null])).toEqual(['students:manage']);
    });
});

describe('authorize middleware', () => {
    beforeEach(() => {
        jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
            id: 1,
            status: 'ACTIVE',
            role: { name: 'Admin', permissions: ['*'] },
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('rejects when no user is attached', async () => {
        const res = mockRes();
        const next = jest.fn();
        await authorize('Admin')(mockReq({ user: null }), res, next);
        expect(res.statusCode).toBe(401);
    });

    it('rejects when the user has no assigned role', async () => {
        jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 1, status: 'ACTIVE', role: null });
        const res = mockRes();
        const next = jest.fn();
        await authorize('Admin')(mockReq(), res, next);
        expect(res.statusCode).toBe(403);
    });

    it('denies when the role name is not allowed', async () => {
        const res = mockRes();
        const next = jest.fn();
        await authorize('Student')(mockReq(), res, next);
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toContain('Required role');
    });

    it('rejects when allowedRoles excludes the assigned role', async () => {
        jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
            id: 1,
            status: 'ACTIVE',
            role: { name: 'Student', permissions: [] },
        });
        const res = mockRes();
        const next = jest.fn();
        await authorize('Admin', 'SuperAdmin')(mockReq(), res, next);
        expect(res.statusCode).toBe(403);
    });

    it('allows the assigned role and attaches roleName, dbUserId, and permissions array', async () => {
        const { req, res, next } = await runAuthorize(['Admin'], {
            id: 1,
            status: 'ACTIVE',
            role: { name: 'Admin', permissions: ['students:manage'] },
        });
        expect(res.statusCode).toBe(200);
        expect(next).toHaveBeenCalled();
        expect(req.user.roleName).toBe('Admin');
        expect(req.user.dbUserId).toBe(1);
        expect(Array.isArray(req.user.permissions)).toBe(true);
        expect(req.user.permissions).toEqual(['students:manage']);
    });

    it('attaches normalized JSON-string permissions as an array', async () => {
        const { req } = await runAuthorize(['Admin'], {
            id: 1,
            status: 'ACTIVE',
            role: { name: 'Admin', permissions: '["students:manage","settings:manage"]' },
        });
        expect(req.user.permissions).toEqual(['students:manage', 'settings:manage']);
    });

    it('attaches normalized JSON-object permissions as an array', async () => {
        const { req } = await runAuthorize(['Admin'], {
            id: 1,
            status: 'ACTIVE',
            role: { name: 'Admin', permissions: { 'students:manage': true, 'courses:view': false } },
        });
        expect(req.user.permissions).toEqual(['students:manage']);
    });

    it('attaches [] when permissions are null or undefined', async () => {
        const { req } = await runAuthorize(['Admin'], {
            id: 1,
            status: 'ACTIVE',
            role: { name: 'Admin', permissions: null },
        });
        expect(req.user.permissions).toEqual([]);
    });

    it('does not authenticate when no token context exists (unchanged behavior)', async () => {
        const req = mockReq({ user: null });
        const res = mockRes();
        const next = jest.fn();
        await authorize('Admin')(req, res, next);
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toContain('Authentication required');
    });
});

describe('requirePermission middleware', () => {
    it('allows when permissions include "*"', () => {
        const req = mockReq({ user: { id: 1, permissions: ['*'] } });
        const res = mockRes();
        const next = jest.fn();
        requirePermission('students:manage')(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.statusCode).toBe(200);
    });

    it('allows when the exact permission is present', () => {
        const req = mockReq({ user: { id: 1, permissions: ['students:manage'] } });
        const res = mockRes();
        const next = jest.fn();
        requirePermission('students:manage')(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('returns 403 when the required permission is missing', () => {
        const req = mockReq({ user: { id: 1, permissions: ['courses:view'] } });
        const res = mockRes();
        const next = jest.fn();
        requirePermission('students:manage')(req, res, next);
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toContain('Required permission');
        expect(next).not.toHaveBeenCalled();
    });

    it('requires all permissions when multiple are given', () => {
        const req = mockReq({ user: { id: 1, permissions: ['students:manage'] } });
        const res = mockRes();
        const next = jest.fn();
        requirePermission('students:manage', 'courses:manage')(req, res, next);
        expect(res.statusCode).toBe(403);
    });

    it('allows when all of multiple required permissions are present', () => {
        const req = mockReq({ user: { id: 1, permissions: ['students:manage', 'courses:manage'] } });
        const res = mockRes();
        const next = jest.fn();
        requirePermission('students:manage', 'courses:manage')(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('returns 403 when permissions are empty or missing', () => {
        const empty = mockReq({ user: { id: 1, permissions: [] } });
        const missing = mockReq({ user: { id: 1 } });
        const res = mockRes();
        const next = jest.fn();
        requirePermission('students:manage')(empty, res, next);
        expect(res.statusCode).toBe(403);
        requirePermission('students:manage')(missing, res, next);
        expect(res.statusCode).toBe(403);
    });
});

describe('role validators', () => {
    it('accepts optional string arrays for createRoleSchema', () => {
        expect(createRoleSchema.safeParse({ name: 'Librarian' }).success).toBe(true);
        expect(createRoleSchema.safeParse({ name: 'Librarian', permissions: ['courses:view'] }).success).toBe(true);
    });

    it('rejects non-array permissions for createRoleSchema', () => {
        expect(createRoleSchema.safeParse({ name: 'Librarian', permissions: 'courses:view' }).success).toBe(false);
        expect(createRoleSchema.safeParse({ name: 'Librarian', permissions: { courses: true } }).success).toBe(false);
        expect(createRoleSchema.safeParse({ name: 'Librarian', permissions: 42 }).success).toBe(false);
    });

    it('accepts optional string arrays for updateRoleSchema', () => {
        expect(updateRoleSchema.safeParse({ name: 'Librarian' }).success).toBe(true);
        expect(updateRoleSchema.safeParse({ permissions: ['courses:view'] }).success).toBe(true);
    });

    it('rejects non-array permissions for updateRoleSchema', () => {
        expect(updateRoleSchema.safeParse({ permissions: 'courses:view' }).success).toBe(false);
        expect(updateRoleSchema.safeParse({ permissions: null }).success).toBe(false);
    });
});
