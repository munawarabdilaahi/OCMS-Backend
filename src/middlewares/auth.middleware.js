import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const JWT_ALGORITHM = 'HS256';
const JWT_ISSUER = 'ocms-api';
const JWT_AUDIENCE = 'ocms-client';

export function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please provide a valid token.',
        });
    }
    const token = header.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Invalid token format.' });
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
            const inactiveStatuses = ['INACTIVE', 'SUSPENDED', 'DELETED', 'DISABLED'];
            if (inactiveStatuses.includes(String(user.status || '').toUpperCase())) {
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
            next();
        } catch (error) {
            next(error);
        }
    };
}
