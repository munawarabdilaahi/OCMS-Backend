import { serializeUser, getMe as getMeService, register as registerService, login as loginService, refreshToken as refreshTokenService, logout as logoutService, forgotPassword as forgotPasswordService, resetPassword as resetPasswordService, generateEmailVerification as generateEmailVerificationService, verifyEmail as verifyEmailService, getSessions as getSessionsService, revokeSession as revokeSessionService, revokeAllSessions as revokeAllSessionsService } from '../services/auth.service.js';

const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
};

function setAuthCookies(res, accessToken, refreshToken) {
    res.cookie('access_token', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
        ...COOKIE_OPTIONS,
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}

function clearAuthCookies(res) {
    res.clearCookie('access_token', { ...COOKIE_OPTIONS });
    res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, path: '/api/auth' });
}

export async function getMe(req, res, next) {
    try {
        const user = await getMeService(req.user.id);
        return res.status(200).json({ success: true, data: serializeUser(user) });
    } catch (error) {
        next(error);
    }
}

export async function register(req, res, next) {
    try {
        const { user, accessToken, refreshToken } = await registerService(req.body, req.headers, req.ip);
        setAuthCookies(res, accessToken, refreshToken);
        return res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            data: { user: serializeUser(user) },
        });
    } catch (error) {
        next(error);
    }
}

export async function login(req, res, next) {
    try {
        const { user, accessToken, refreshToken } = await loginService(req.body, req.headers, req.ip);
        setAuthCookies(res, accessToken, refreshToken);
        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: { user: serializeUser(user) },
        });
    } catch (error) {
        next(error);
    }
}

export async function refreshToken(req, res, next) {
    try {
        const refreshTokenValue = req.body.refreshToken || req.cookies?.refresh_token;
        if (!refreshTokenValue) {
            return res.status(401).json({ success: false, message: 'Refresh token required.' });
        }
        const tokens = await refreshTokenService(refreshTokenValue, req.headers, req.ip);
        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
        return res.status(200).json({ success: true, message: 'Token refreshed successfully.' });
    } catch (error) {
        next(error);
    }
}

export async function logout(req, res, next) {
    try {
        const refreshTokenValue = req.body.refreshToken || req.cookies?.refresh_token;
        await logoutService(refreshTokenValue, req.user?.id);
        clearAuthCookies(res);
        return res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
        next(error);
    }
}

export async function forgotPassword(req, res, next) {
    try {
        const result = await forgotPasswordService(req.body.email);
        return res.status(200).json({
            success: true,
            message: 'If an account exists with this email, password reset instructions have been sent.',
            ...(process.env.NODE_ENV !== 'production' && result.resetToken ? { resetToken: result.resetToken } : {}),
        });
    } catch (error) {
        next(error);
    }
}

export async function resetPassword(req, res, next) {
    try {
        await resetPasswordService(req.body.token, req.body.password);
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
        const result = await generateEmailVerificationService(req.user.id);
        if (result.alreadyVerified) {
            return res.status(200).json({ success: true, message: 'Email is already verified.' });
        }
        return res.status(200).json({
            success: true,
            message: 'Verification email sent.',
            ...(process.env.NODE_ENV !== 'production' ? { verifyToken: result.verifyToken } : {}),
        });
    } catch (error) {
        next(error);
    }
}

export async function verifyEmail(req, res, next) {
    try {
        const result = await verifyEmailService(req.body.token);
        if (result.alreadyVerified) {
            return res.status(200).json({ success: true, message: 'Email is already verified.' });
        }
        return res.status(200).json({ success: true, message: 'Email verified successfully.' });
    } catch (error) {
        next(error);
    }
}

export async function getSessions(req, res, next) {
    try {
        const sessions = await getSessionsService(req.user.id);
        return res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        next(error);
    }
}

export async function revokeSession(req, res, next) {
    try {
        await revokeSessionService(req.params.sessionId, req.user.id);
        return res.status(200).json({ success: true, message: 'Session revoked.' });
    } catch (error) {
        next(error);
    }
}

export async function revokeAllSessions(req, res, next) {
    try {
        await revokeAllSessionsService(req.user.id);
        return res.status(200).json({ success: true, message: 'All sessions revoked.' });
    } catch (error) {
        next(error);
    }
}
