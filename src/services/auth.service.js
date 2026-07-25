import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/db.js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_ALGORITHM = 'HS256';
const JWT_ISSUER = 'ocms-api';
const JWT_AUDIENCE = 'ocms-client';

const SESSION_EXPIRY_DAYS = 30;

export function serializeUser(user) {
    if (!user) return null;
    const safeUser = { ...user };
    delete safeUser.password;
    delete safeUser.password_hash;
    delete safeUser.passwordHash;
    delete safeUser.reset_token;
    delete safeUser.resetToken;
    return {
        ...safeUser,
        role: user.role ? { ...user.role, permissions: user.role.permissions || {} } : null,
    };
}

export async function createSession(user, userAgent, ipAddress) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);
    return prisma.session.create({
        data: {
            user_id: user.id,
            user_agent: userAgent || null,
            ip_address: ipAddress || null,
            expires_at: expiresAt,
        },
    });
}

export async function resolveRole({ role_id, roleId, role, roleName }) {
    const requestedRoleId = role_id || roleId;
    const requestedRoleName = roleName || role;
    if (requestedRoleId) {
        return prisma.role.findUnique({ where: { id: Number(requestedRoleId) } });
    }
    if (requestedRoleName) {
        return prisma.role.findFirst({ where: { name: requestedRoleName } });
    }
    return prisma.role.findFirst({ where: { name: 'Student' } });
}

export function userInclude() {
    return { role: true };
}

export function signAccessToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        role_id: user.role_id ?? user.role?.id,
        jti: crypto.randomUUID(),
    };
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        algorithm: JWT_ALGORITHM,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    });
}
