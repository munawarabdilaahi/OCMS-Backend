import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/db.js';
import { hashToken } from '../utils/hash.js';
import { generateToken } from '../utils/crypto.js';
import { isInactive } from '../utils/validation.js';
import { hashPassword, comparePassword } from '../utils/password.js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_REFRESH_EXPIRES_IN = '7d';
const JWT_ALGORITHM = 'HS256';
const JWT_ISSUER = 'ocms-api';
const JWT_AUDIENCE = 'ocms-client';

const SESSION_EXPIRY_DAYS = 30;
const PUBLIC_ROLES = ['Student', 'Teacher', 'Staff'];
const RESET_TOKEN_EXPIRY_MINUTES = 60;
const EMAIL_VERIFY_EXPIRY_MINUTES = 1440;

function userDelegate() { return prisma.user; }

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

export function userInclude() {
    return { role: true };
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

function signRefreshToken(userId, sessionId) {
    return jwt.sign(
        { id: userId, sid: sessionId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN, algorithm: JWT_ALGORITHM }
    );
}

async function createRefreshToken(user, session, userAgent, ipAddress) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const rawToken = signRefreshToken(user.id, session.id);
    const tokenHash = hashToken(rawToken);
    await prisma.refreshToken.create({
        data: {
            token: tokenHash,
            user_id: user.id,
            session_id: session.id,
            user_agent: userAgent || null,
            ip_address: ipAddress || null,
            expires_at: expiresAt,
        },
    });
    return rawToken;
}

export async function getMe(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            role: true,
            student: { select: { id: true, admission_no: true, department_id: true } },
            teacher: { select: { id: true, employee_no: true, department_id: true } },
        },
    });
    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }
    if (isInactive(user.status)) {
        const error = new Error('This user account is not active.');
        error.statusCode = 403;
        throw error;
    }
    return user;
}

export async function register(data, headers, ip) {
    const { name, email, password, phone, role, roleName } = data;
    const requestedRoleName = roleName || role;

    if (requestedRoleName && !PUBLIC_ROLES.includes(requestedRoleName)) {
        const error = new Error(`Cannot self-register with role "${requestedRoleName}". Allowed roles: ${PUBLIC_ROLES.join(', ')}.`);
        error.statusCode = 403;
        throw error;
    }

    const existingUser = await userDelegate().findUnique({ where: { email } });
    if (existingUser) {
        const error = new Error('A user with this email already exists.');
        error.statusCode = 409;
        throw error;
    }

    const role_ = await resolveRole(data);
    if (!role_) {
        const error = new Error('A valid role is required before a user can be registered.');
        error.statusCode = 400;
        throw error;
    }

    const hashedPassword = await hashPassword(password);
    const now = new Date();
    const user = await userDelegate().create({
        data: {
            name,
            email,
            password: hashedPassword,
            status: 'ACTIVE',
            phone,
            role_id: role_.id,
            last_login: now,
        },
        include: userInclude(),
    });

    const session = await createSession(user, headers['user-agent'], ip);
    const refreshToken = await createRefreshToken(user, session, headers['user-agent'], ip);
    const accessToken = signAccessToken(user);

    return { user, accessToken, refreshToken };
}

export async function login(data, headers, ip) {
    const { email, password } = data;
    const user = await userDelegate().findUnique({
        where: { email },
        include: userInclude(),
    });
    if (!user) {
        const error = new Error('Invalid email or password.');
        error.statusCode = 401;
        throw error;
    }

    const storedPassword = user.password || user.password_hash || user.passwordHash;
    const passwordMatches = await comparePassword(password, storedPassword || '');
    if (!passwordMatches) {
        const error = new Error('Invalid email or password.');
        error.statusCode = 401;
        throw error;
    }

    if (isInactive(user.status)) {
        const error = new Error('This user account is not active.');
        error.statusCode = 403;
        throw error;
    }

    await userDelegate().update({
        where: { id: user.id },
        data: { last_login: new Date() },
    });

    const session = await createSession(user, headers['user-agent'], ip);
    const refreshToken = await createRefreshToken(user, session, headers['user-agent'], ip);
    const accessToken = signAccessToken(user);

    return { user, accessToken, refreshToken };
}

export async function refreshToken(rawRefreshToken, headers, ip) {
    if (!rawRefreshToken) {
        const error = new Error('Refresh token is required.');
        error.statusCode = 400;
        throw error;
    }

    let decoded;
    try {
        decoded = jwt.verify(rawRefreshToken, process.env.JWT_REFRESH_SECRET, {
            algorithms: [JWT_ALGORITHM],
        });
    } catch {
        const error = new Error('Invalid or expired refresh token.');
        error.statusCode = 401;
        throw error;
    }

    if (decoded.type !== 'refresh') {
        const error = new Error('Invalid token type.');
        error.statusCode = 401;
        throw error;
    }

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
        where: { token: tokenHash },
        include: { session: true },
    });

    if (!storedToken) {
        const error = new Error('Refresh token not found.');
        error.statusCode = 401;
        throw error;
    }

    if (storedToken.revoked_at) {
        await prisma.session.updateMany({
            where: { user_id: storedToken.user_id },
            data: { revoked_at: new Date() },
        });
        const error = new Error('Refresh token has been revoked. All sessions invalidated.');
        error.statusCode = 401;
        throw error;
    }

    if (new Date() > storedToken.expires_at) {
        const error = new Error('Refresh token has expired.');
        error.statusCode = 401;
        throw error;
    }

    const user = await prisma.user.findUnique({
        where: { id: storedToken.user_id },
        include: userInclude(),
    });
    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 401;
        throw error;
    }

    if (isInactive(user.status)) {
        const error = new Error('Account is not active.');
        error.statusCode = 403;
        throw error;
    }

    await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked_at: new Date() },
    });

    const newRefreshToken = await createRefreshToken(
        user,
        storedToken.session,
        headers['user-agent'],
        ip,
    );
    const newAccessToken = signAccessToken(user);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(rawRefreshToken, userId) {
    if (rawRefreshToken) {
        const tokenHash = hashToken(rawRefreshToken);
        await prisma.refreshToken.updateMany({
            where: { token: tokenHash, revoked_at: null },
            data: { revoked_at: new Date() },
        });
    }

    if (userId) {
        await prisma.session.updateMany({
            where: { user_id: userId, revoked_at: null },
            data: { revoked_at: new Date() },
        });
    }
}

export async function forgotPassword(email) {
    const user = await userDelegate().findUnique({ where: { email } });

    if (!user) {
        return { resetToken: null };
    }

    await prisma.passwordResetToken.updateMany({
        where: { user_id: user.id, used_at: null },
        data: { used_at: new Date() },
    });

    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + RESET_TOKEN_EXPIRY_MINUTES);

    await prisma.passwordResetToken.create({
        data: {
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: expiresAt,
        },
    });

    return { resetToken: rawToken };
}

export async function resetPassword(token, password) {
    const tokenHash = hashToken(token);
    const resetRecord = await prisma.passwordResetToken.findUnique({
        where: { token_hash: tokenHash },
    });

    if (!resetRecord) {
        const error = new Error('Invalid or expired reset token.');
        error.statusCode = 400;
        throw error;
    }

    if (resetRecord.used_at) {
        const error = new Error('This reset token has already been used.');
        error.statusCode = 400;
        throw error;
    }

    if (new Date() > resetRecord.expires_at) {
        const error = new Error('Reset token has expired. Please request a new one.');
        error.statusCode = 400;
        throw error;
    }

    const hashedPassword = await hashPassword(password);

    await prisma.$transaction([
        prisma.user.update({
            where: { id: resetRecord.user_id },
            data: { password: hashedPassword },
        }),
        prisma.passwordResetToken.update({
            where: { id: resetRecord.id },
            data: { used_at: new Date() },
        }),
        prisma.refreshToken.updateMany({
            where: { user_id: resetRecord.user_id },
            data: { revoked_at: new Date() },
        }),
        prisma.session.updateMany({
            where: { user_id: resetRecord.user_id },
            data: { revoked_at: new Date() },
        }),
    ]);
}

export async function generateEmailVerification(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }

    if (user.email_verified) {
        return { alreadyVerified: true };
    }

    await prisma.emailVerifyToken.updateMany({
        where: { user_id: userId, verified_at: null },
        data: { verified_at: new Date() },
    });

    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + EMAIL_VERIFY_EXPIRY_MINUTES);

    await prisma.emailVerifyToken.create({
        data: {
            user_id: userId,
            token_hash: tokenHash,
            expires_at: expiresAt,
        },
    });

    return { verifyToken: rawToken, alreadyVerified: false };
}

export async function verifyEmail(token) {
    const tokenHash = hashToken(token);
    const verifyRecord = await prisma.emailVerifyToken.findUnique({
        where: { token_hash: tokenHash },
    });

    if (!verifyRecord) {
        const error = new Error('Invalid verification token.');
        error.statusCode = 400;
        throw error;
    }

    if (verifyRecord.verified_at) {
        return { alreadyVerified: true };
    }

    if (new Date() > verifyRecord.expires_at) {
        const error = new Error('Verification token has expired. Please request a new one.');
        error.statusCode = 400;
        throw error;
    }

    await prisma.$transaction([
        prisma.user.update({
            where: { id: verifyRecord.user_id },
            data: { email_verified: true },
        }),
        prisma.emailVerifyToken.update({
            where: { id: verifyRecord.id },
            data: { verified_at: new Date() },
        }),
    ]);

    return { alreadyVerified: false };
}

export async function getSessions(userId) {
    return prisma.session.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        select: {
            id: true,
            user_agent: true,
            ip_address: true,
            last_active: true,
            expires_at: true,
            revoked_at: true,
            created_at: true,
        },
    });
}

export async function revokeSession(sessionId, userId) {
    const session = await prisma.session.findFirst({
        where: { id: Number(sessionId), user_id: userId },
    });
    if (!session) {
        const error = new Error('Session not found.');
        error.statusCode = 404;
        throw error;
    }
    await prisma.$transaction([
        prisma.session.update({
            where: { id: session.id },
            data: { revoked_at: new Date() },
        }),
        prisma.refreshToken.updateMany({
            where: { session_id: session.id, revoked_at: null },
            data: { revoked_at: new Date() },
        }),
    ]);
}

export async function revokeAllSessions(userId) {
    await prisma.$transaction([
        prisma.session.updateMany({
            where: { user_id: userId, revoked_at: null },
            data: { revoked_at: new Date() },
        }),
        prisma.refreshToken.updateMany({
            where: { user_id: userId, revoked_at: null },
            data: { revoked_at: new Date() },
        }),
    ]);
}
