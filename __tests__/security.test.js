import { describe, it, expect, jest, afterEach } from '@jest/globals';
import prisma from '../src/config/db.js';
import { listRoles, getRoleById, createRole, updateRole, deleteRole } from '../src/services/role.service.js';
import { createStudent } from '../src/services/student.service.js';
import { generateRandomPassword } from '../src/utils/password.js';
import { passwordSchema } from '../src/middlewares/validate.middleware.js';

describe('access token lifetime matches the cookie (SEC-3)', () => {
    it('defaults to 15m when JWT_EXPIRES_IN is unset', async () => {
        jest.resetModules();
        const previous = process.env.JWT_EXPIRES_IN;
        delete process.env.JWT_EXPIRES_IN;
        try {
            const mod = await import('../src/services/auth.service.js');
            expect(mod.JWT_EXPIRES_IN).toBe('15m');
        } finally {
            if (previous === undefined) {
                delete process.env.JWT_EXPIRES_IN;
            } else {
                process.env.JWT_EXPIRES_IN = previous;
            }
        }
    });

    it('honors an explicit JWT_EXPIRES_IN override', async () => {
        jest.resetModules();
        const previous = process.env.JWT_EXPIRES_IN;
        process.env.JWT_EXPIRES_IN = '45m';
        try {
            const mod = await import('../src/services/auth.service.js');
            expect(mod.JWT_EXPIRES_IN).toBe('45m');
        } finally {
            if (previous === undefined) {
                delete process.env.JWT_EXPIRES_IN;
            } else {
                process.env.JWT_EXPIRES_IN = previous;
            }
        }
    });
});

describe('built-in roles cannot be deleted or renamed (SEC-7)', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('blocks deleting the Admin role regardless of user count', async () => {
        jest.spyOn(prisma.role, 'findUnique').mockResolvedValue({ id: 1, name: 'Admin', permissions: ['*'] });
        const deleteSpy = jest.spyOn(prisma.role, 'delete').mockResolvedValue({});
        const countSpy = jest.spyOn(prisma.user, 'count').mockResolvedValue(0);

        await expect(deleteRole(1)).rejects.toMatchObject({ statusCode: 400 });
        expect(countSpy).not.toHaveBeenCalled();
        expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('blocks deleting the SuperAdmin role', async () => {
        jest.spyOn(prisma.role, 'findUnique').mockResolvedValue({ id: 2, name: 'SuperAdmin', permissions: ['*'] });
        const deleteSpy = jest.spyOn(prisma.role, 'delete').mockResolvedValue({});

        await expect(deleteRole(2)).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('built-in role') });
        expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('blocks deleting any canonical role (e.g. Registrar)', async () => {
        jest.spyOn(prisma.role, 'findUnique').mockResolvedValue({ id: 3, name: 'Registrar', permissions: [] });

        await expect(deleteRole(3)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('still deletes a custom role with no users', async () => {
        jest.spyOn(prisma.role, 'findUnique').mockResolvedValue({ id: 10, name: 'Librarian', permissions: [] });
        jest.spyOn(prisma.user, 'count').mockResolvedValue(0);
        const deleteSpy = jest.spyOn(prisma.role, 'delete').mockResolvedValue({ id: 10, name: 'Librarian' });

        await expect(deleteRole(10)).resolves.toEqual({ id: 10, name: 'Librarian', permissions: [] });
        expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 10 } });
    });

    it('still blocks deleting a custom role that has assigned users', async () => {
        jest.spyOn(prisma.role, 'findUnique').mockResolvedValue({ id: 11, name: 'Librarian', permissions: [] });
        jest.spyOn(prisma.user, 'count').mockResolvedValue(3);

        await expect(deleteRole(11)).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('3 user(s)') });
    });

    it('returns 404 for a missing role on delete', async () => {
        jest.spyOn(prisma.role, 'findUnique').mockResolvedValue(null);

        await expect(deleteRole(999)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('blocks renaming a built-in role', async () => {
        jest.spyOn(prisma.role, 'findUnique').mockResolvedValue({ id: 1, name: 'Admin', permissions: ['*'] });
        const updateSpy = jest.spyOn(prisma.role, 'update').mockResolvedValue({});

        await expect(updateRole(1, { name: 'Administrator' })).rejects.toMatchObject({ statusCode: 400 });
        expect(updateSpy).not.toHaveBeenCalled();
    });

    it('blocks renaming a canonical role even when permissions are also supplied', async () => {
        jest.spyOn(prisma.role, 'findUnique').mockResolvedValue({ id: 3, name: 'Registrar', permissions: [] });
        const updateSpy = jest.spyOn(prisma.role, 'update').mockResolvedValue({});

        await expect(updateRole(3, { name: 'Registrar Office', permissions: ['students:view'] })).rejects.toMatchObject({ statusCode: 400 });
        expect(updateSpy).not.toHaveBeenCalled();
    });

    it('allows permission updates on a built-in role when the name is unchanged', async () => {
        jest.spyOn(prisma.role, 'findUnique').mockResolvedValue({ id: 3, name: 'Registrar', permissions: [] });
        const updateSpy = jest.spyOn(prisma.role, 'update').mockResolvedValue({ id: 3, name: 'Registrar', permissions: ['students:view'] });

        await expect(updateRole(3, { permissions: ['students:view'] })).resolves.toEqual({ id: 3, name: 'Registrar', permissions: ['students:view'] });
        expect(updateSpy).toHaveBeenCalledWith({ where: { id: 3 }, data: { permissions: ['students:view'] } });
    });

    it('allows renaming a custom role', async () => {
        jest.spyOn(prisma.role, 'findUnique').mockResolvedValue({ id: 12, name: 'Librarian', permissions: [] });
        const updateSpy = jest.spyOn(prisma.role, 'update').mockResolvedValue({ id: 12, name: 'Head Librarian', permissions: [] });

        await expect(updateRole(12, { name: 'Head Librarian' })).resolves.toEqual({ id: 12, name: 'Head Librarian', permissions: [] });
        expect(updateSpy).toHaveBeenCalledWith({ where: { id: 12 }, data: { name: 'Head Librarian' } });
    });

    it('returns 404 for a missing role on update', async () => {
        jest.spyOn(prisma.role, 'findUnique').mockResolvedValue(null);

        await expect(updateRole(999, { name: 'Anything' })).rejects.toMatchObject({ statusCode: 404 });
    });
});

describe('generateRandomPassword (SEC-2)', () => {
    it('always satisfies the strong password policy', () => {
        expect(passwordSchema().safeParse(generateRandomPassword()).success).toBe(true);
    });

    it('defaults to 16 characters', () => {
        expect(generateRandomPassword()).toHaveLength(16);
    });

    it('generates independent values', () => {
        expect(generateRandomPassword()).not.toBe(generateRandomPassword());
    });
});

describe('server-generated credentials for admin-created accounts (SEC-2)', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('generates a strong password, stores it hashed, and never returns it in plaintext', async () => {
        jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
        jest.spyOn(prisma.role, 'findFirst').mockResolvedValue({ id: 5 });
        const userCreate = jest.fn(async (data) => ({ id: 1, ...data }));
        const txMock = {
            user: { create: userCreate },
            student: { create: async (data) => ({ id: 10, ...data }) },
        };
        jest.spyOn(prisma, '$transaction').mockImplementation(async (cb) => cb(txMock));

        const student = await createStudent({ name: 'Jane Doe', email: 'jane@ocms.edu', department_id: 1 });

        expect(student).toMatchObject({ id: 10 });
        expect(student).not.toHaveProperty('password');
        const storedData = userCreate.mock.calls[0][0].data;
        expect(storedData.password).toMatch(/^\$2[aby]\$/);
        expect(storedData.password).not.toContain('campus');
    });

    it('hashes the supplied password when one is given', async () => {
        jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
        jest.spyOn(prisma.role, 'findFirst').mockResolvedValue({ id: 5 });
        const userCreate = jest.fn(async (data) => ({ id: 1, ...data }));
        const txMock = {
            user: { create: userCreate },
            student: { create: async (data) => ({ id: 10, ...data }) },
        };
        jest.spyOn(prisma, '$transaction').mockImplementation(async (cb) => cb(txMock));

        await createStudent({ name: 'Jane Doe', email: 'jane@ocms.edu', department_id: 1, password: 'Adm1nPass!' });

        const storedData = userCreate.mock.calls[0][0].data;
        expect(storedData.password).toMatch(/^\$2[aby]\$/);
        expect(storedData.password).not.toBe('Adm1nPass!');
    });
});