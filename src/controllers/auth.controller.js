import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const userDelegate = () => prisma.user;
const roleDelegate = () => prisma.role;
function signToken(user) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is required to sign authentication tokens.');
    }
    return jwt.sign({
        id: user.id,
        email: user.email,
        role_id: user.role_id ?? user.roleId ?? user.role?.id,
    }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function userInclude() {
    return {
        role: true,
    };
}
function serializeUser(user) {
    if (!user)
        return null;
    const safeUser = { ...user };
    delete safeUser.password;
    delete safeUser.password_hash;
    delete safeUser.passwordHash;
    delete safeUser.reset_token;
    delete safeUser.resetToken;
    return {
        ...safeUser,
        role: user.role
            ? {
                ...user.role,
                permissions: user.role.permissions || {},
            }
            : null,
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
        const { name, email, password, status = 'ACTIVE', phone } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required.',
            });
        }
        const existingUser = await userDelegate().findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'A user with this email already exists.',
            });
        }
        const role = await resolveRole(req.body);
        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'A valid role is required before a user can be registered.',
            });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await userDelegate().create({
            data: {
                name,
                email,
                password: hashedPassword,
                status,
                phone,
                role_id: role.id,
            },
            include: userInclude(),
        });
        const token = signToken(user);
        return res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            data: {
                token,
                user: serializeUser(user),
            },
        });
    }
    catch (error) {
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
            data: {
                token,
                user: serializeUser(user),
            },
        });
    }
    catch (error) {
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
        return res.status(200).json({
            success: true,
            message: 'If this account exists, password reset instructions will be sent.',
            data: { email },
        });
    }
    catch (error) {
        next(error);
    }
}
export async function resetPassword(req, res, next) {
    try {
        const { password, confirmPassword } = req.body;
        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters.',
            });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords must match.',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Password reset request processed.',
            data: null,
        });
    }
    catch (error) {
        next(error);
    }
}
