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

const PUBLIC_ROLES = ['Student', 'Teacher', 'Staff'];
const SESSION_EXPIRY_DAYS = 30;
const RESET_TOKEN_EXPIRY_MINUTES = 60;
const EMAIL_VERIFY_EXPIRY_MINUTES = 1440;

function userDelegate() { return prisma.user; }
function roleDelegate() { return prisma.role; }

function signAccessToken(user) {
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
        process.env.JWT_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN, algorithm: JWT_ALGORITHM }
    );
}

function userInclude() {
    return { role: true };
}

function serializeUser(user) {
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

async function resolveRole({ role_id, roleId, role, roleName }) {
    const requestedRoleId = role_id || roleId;
    const requestedRoleName = roleName || role;
    if (requestedRoleId) {
        return roleDelegate().findUnique({ where: { id: Number(requestedRoleId) } });
    }
    if (requestedRoleName) {
        return roleDelegate().findFirst({ where: { name: requestedRoleName } });
    }
    return roleDelegate().findFirst({ where: { name: 'Student' } });
}

async function createSession(user, userAgent, ipAddress) {
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

export async function getMe(req, res, next) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                role: true,
                student: { select: { id: true, admission_no: true, department_id: true } },
                teacher: { select: { id: true, employee_no: true, department_id: true } },
            },
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        if (isInactive(user.status)) {
            return res.status(403).json({ success: false, message: 'This user account is not active.' });
        }
        return res.status(200).json({
            success: true,
            data: serializeUser(user),
        });
    } catch (error) {
        next(error);
    }
}

export async function register(req, res, next) {
    try {
        const { name, email, password, phone, role, roleName } = req.body;
        const requestedRoleName = roleName || role;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required.',
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long.',
            });
        }

        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least one uppercase letter.',
            });
        }

        if (!/[a-z]/.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least one lowercase letter.',
            });
        }

        if (!/\d/.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least one digit.',
            });
        }

        if (requestedRoleName && !PUBLIC_ROLES.includes(requestedRoleName)) {
            return res.status(403).json({
                success: false,
                message: `Cannot self-register with role "${requestedRoleName}". Allowed roles: ${PUBLIC_ROLES.join(', ')}.`,
            });
        }

        const existingUser = await userDelegate().findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'A user with this email already exists.',
            });
        }

        const role_ = await resolveRole(req.body);
        if (!role_) {
            return res.status(400).json({
                success: false,
                message: 'A valid role is required before a user can be registered.',
            });
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

        const session = await createSession(user, req.headers['user-agent'], req.ip);
        const refreshToken = await createRefreshToken(user, session, req.headers['user-agent'], req.ip);
        const accessToken = signAccessToken(user);

        return res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            data: {
                token: accessToken,
                refreshToken,
                user: serializeUser(user),
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.',
            });
        }

        const user = await userDelegate().findUnique({
            where: { email },
            include: userInclude(),
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        const storedPassword = user.password || user.password_hash || user.passwordHash;
        const passwordMatches = await comparePassword(password, storedPassword || '');
        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        if (isInactive(user.status)) {
            return res.status(403).json({
                success: false,
                message: 'This user account is not active.',
            });
        }

        await userDelegate().update({
            where: { id: user.id },
            data: { last_login: new Date() },
        });

        const session = await createSession(user, req.headers['user-agent'], req.ip);
        const refreshToken = await createRefreshToken(user, session, req.headers['user-agent'], req.ip);
        const accessToken = signAccessToken(user);

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                token: accessToken,
                refreshToken,
                user: serializeUser(user),
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function refreshToken(req, res, next) {
    try {
        const { refreshToken: rawRefreshToken } = req.body;
        if (!rawRefreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required.',
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(rawRefreshToken, process.env.JWT_SECRET, {
                algorithms: [JWT_ALGORITHM],
            });
        } catch {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token.',
            });
        }

        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token type.',
            });
        }

        const tokenHash = hashToken(rawRefreshToken);
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: tokenHash },
            include: { session: true },
        });

        if (!storedToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token not found.',
            });
        }

        if (storedToken.revoked_at) {
            await prisma.session.updateMany({
                where: { user_id: storedToken.user_id },
                data: { revoked_at: new Date() },
            });
            return res.status(401).json({
                success: false,
                message: 'Refresh token has been revoked. All sessions invalidated.',
            });
        }

        if (new Date() > storedToken.expires_at) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token has expired.',
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: storedToken.user_id },
            include: userInclude(),
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found.',
            });
        }

        if (isInactive(user.status)) {
            return res.status(403).json({
                success: false,
                message: 'Account is not active.',
            });
        }

        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revoked_at: new Date() },
        });

        const newRefreshToken = await createRefreshToken(
            user,
            storedToken.session,
            req.headers['user-agent'],
            req.ip,
        );
        const newAccessToken = signAccessToken(user);

        return res.status(200).json({
            success: true,
            data: {
                token: newAccessToken,
                refreshToken: newRefreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function logout(req, res, next) {
    try {
        const { refreshToken: rawRefreshToken } = req.body;

        if (rawRefreshToken) {
            const tokenHash = hashToken(rawRefreshToken);
            await prisma.refreshToken.updateMany({
                where: { token: tokenHash, revoked_at: null },
                data: { revoked_at: new Date() },
            });
        }

        if (req.user?.id) {
            await prisma.session.updateMany({
                where: { user_id: req.user.id, revoked_at: null },
                data: { revoked_at: new Date() },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully.',
        });
    } catch (error) {
        next(error);
    }
}

export async function forgotPassword(req, res, next) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required.',
            });
        }

        const user = await userDelegate().findUnique({ where: { email } });

        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, password reset instructions have been sent.',
            });
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

        return res.status(200).json({
            success: true,
            message: 'If an account exists with this email, password reset instructions have been sent.',
            ...(process.env.NODE_ENV !== 'production' && { resetToken: rawToken }),
        });
    } catch (error) {
        next(error);
    }
}

export async function resetPassword(req, res, next) {
    try {
        const { token, password, confirmPassword } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Reset token is required.',
            });
        }
        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters.',
            });
        }
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least one uppercase letter.',
            });
        }
        if (!/[a-z]/.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least one lowercase letter.',
            });
        }
        if (!/\d/.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least one digit.',
            });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords must match.',
            });
        }

        const tokenHash = hashToken(token);
        const resetRecord = await prisma.passwordResetToken.findUnique({
            where: { token_hash: tokenHash },
        });

        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token.',
            });
        }

        if (resetRecord.used_at) {
            return res.status(400).json({
                success: false,
                message: 'This reset token has already been used.',
            });
        }

        if (new Date() > resetRecord.expires_at) {
            return res.status(400).json({
                success: false,
                message: 'Reset token has expired. Please request a new one.',
            });
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

        return res.status(200).json({
            success: true,
            message: 'Password has been reset successfully. Please sign in with your new password.',
        });
    } catch (error) {
        next(error);
    }
}

export async function generateEmailVerification(req, res, next) {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (user.email_verified) {
            return res.status(200).json({
                success: true,
                message: 'Email is already verified.',
            });
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

        return res.status(200).json({
            success: true,
            message: 'Verification email sent.',
            ...(process.env.NODE_ENV !== 'production' && { verifyToken: rawToken }),
        });
    } catch (error) {
        next(error);
    }
}

export async function verifyEmail(req, res, next) {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required.',
            });
        }

        const tokenHash = hashToken(token);
        const verifyRecord = await prisma.emailVerifyToken.findUnique({
            where: { token_hash: tokenHash },
        });

        if (!verifyRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification token.',
            });
        }

        if (verifyRecord.verified_at) {
            return res.status(200).json({
                success: true,
                message: 'Email is already verified.',
            });
        }

        if (new Date() > verifyRecord.expires_at) {
            return res.status(400).json({
                success: false,
                message: 'Verification token has expired. Please request a new one.',
            });
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

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully.',
        });
    } catch (error) {
        next(error);
    }
}

export async function getSessions(req, res, next) {
    try {
        const sessions = await prisma.session.findMany({
            where: { user_id: req.user.id },
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
        return res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        next(error);
    }
}

export async function revokeSession(req, res, next) {
    try {
        const { sessionId } = req.params;
        const session = await prisma.session.findFirst({
            where: { id: Number(sessionId), user_id: req.user.id },
        });
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found.' });
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
        return res.status(200).json({ success: true, message: 'Session revoked.' });
    } catch (error) {
        next(error);
    }
}

export async function revokeAllSessions(req, res, next) {
    try {
        await prisma.$transaction([
            prisma.session.updateMany({
                where: { user_id: req.user.id, revoked_at: null },
                data: { revoked_at: new Date() },
            }),
            prisma.refreshToken.updateMany({
                where: { user_id: req.user.id, revoked_at: null },
                data: { revoked_at: new Date() },
            }),
        ]);
        return res.status(200).json({ success: true, message: 'All sessions revoked.' });
    } catch (error) {
        next(error);
    }
}
