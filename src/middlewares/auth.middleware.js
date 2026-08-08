import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { isInactive } from '../utils/validation.js';

const JWT_ALGORITHM = 'HS256';
const JWT_ISSUER = 'ocms-api';
const JWT_AUDIENCE = 'ocms-client';

export function authenticate(req, res, next) {
    const header = req.headers.authorization;
    let token = null;

    if (header && header.startsWith('Bearer ')) {
        token = header.split(' ')[1];
    } else if (req.cookies?.access_token) {
        token = req.cookies.access_token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please provide a valid token.',
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: [JWT_ALGORITHM],
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token has expired.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token.' });
        }
        if (error.name === 'NotBeforeError') {
            return res.status(401).json({ success: false, message: 'Token not yet active.' });
        }
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
}

export function normalizePermissions(permissions) {
    if (permissions === null || permissions === undefined) {
        return [];
    }
    if (Array.isArray(permissions)) {
        return permissions.filter((permission) => typeof permission === 'string');
    }
    if (typeof permissions === 'string') {
        const trimmed = permissions.trim();
        if (!trimmed) {
            return [];
        }
        try {
            const parsed = JSON.parse(trimmed);
            return normalizePermissions(parsed);
        } catch {
            return [trimmed];
        }
    }
    if (typeof permissions === 'object') {
        return Object.keys(permissions).filter((key) => permissions[key]);
    }
    return [];
}

export function authorize(...allowedRoles) {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { role: true },
            });
            if (!user) {
                return res.status(401).json({ success: false, message: 'User not found.' });
            }
            if (isInactive(user.status)) {
                return res.status(403).json({ success: false, message: 'Account is not active.' });
            }
            const roleName = user.role?.name;
            if (!roleName) {
                return res.status(403).json({ success: false, message: 'User has no assigned role.' });
            }
            if (allowedRoles.length > 0 && !allowedRoles.includes(roleName)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
                });
            }
            req.user.roleName = roleName;
            req.user.dbUserId = user.id;
            req.user.permissions = normalizePermissions(user.role?.permissions);
            next();
        } catch (error) {
            next(error);
        }
    };
}

export function requirePermission(...requiredPermissions) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        if (requiredPermissions.length === 0) {
            return next();
        }
        const permissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
        const granted = permissions.includes('*') || requiredPermissions.every((permission) => permissions.includes(permission));
        if (!granted) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required permission: ${requiredPermissions.join(' and ')}.`,
            });
        }
        next();
    };
}
