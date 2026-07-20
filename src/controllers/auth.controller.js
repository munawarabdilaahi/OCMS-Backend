import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/db.js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_ALGORITHM = 'HS256';
const JWT_ISSUER = 'ocms-api';
const JWT_AUDIENCE = 'ocms-client';

const PUBLIC_ROLES = ['Student', 'Teacher', 'Staff'];
const BCRYPT_ROUNDS = 12;

function userDelegate() { return prisma.user; }
function roleDelegate() { return prisma.role; }

function signToken(user) {
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

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const user = await userDelegate().create({
            data: {
                name,
                email,
                password: hashedPassword,
                status: 'ACTIVE',
                phone,
                role_id: role_.id,
            },
            include: userInclude(),
        });

        const token = signToken(user);
        return res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            data: { token, user: serializeUser(user) },
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
        const passwordMatches = await bcrypt.compare(password, storedPassword || '');
        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        const inactiveStatuses = ['INACTIVE', 'SUSPENDED', 'DELETED', 'DISABLED'];
        if (inactiveStatuses.includes(String(user.status || '').toUpperCase())) {
            return res.status(403).json({
                success: false,
                message: 'This user account is not active.',
            });
        }

        const token = signToken(user);
        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: { token, user: serializeUser(user) },
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
        // TODO: Implement actual email sending with reset token
        return res.status(200).json({
            success: true,
            message: 'If an account exists with this email, password reset instructions have been sent.',
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
        // TODO: Implement actual token verification and password update
        return res.status(400).json({
            success: false,
            message: 'Password reset is not yet implemented. Please contact your administrator.',
        });
    } catch (error) {
        next(error);
    }
}
