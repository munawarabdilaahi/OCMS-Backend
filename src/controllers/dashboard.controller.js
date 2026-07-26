import { getAdminDashboard as getAdminDashboardService, getTeacherDashboard as getTeacherDashboardService, getStudentDashboard as getStudentDashboardService } from '../services/dashboard.service.js';

export async function getAdminDashboard(req, res, next) {
    try {
        const data = await getAdminDashboardService();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
}

export async function getTeacherDashboard(req, res, next) {
    try {
        const data = await getTeacherDashboardService(req.user);
        if (!data) {
            return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
        }
        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
}

export async function getStudentDashboard(req, res, next) {
    try {
        const data = await getStudentDashboardService(req.user);
        if (!data) {
            return res.status(404).json({ success: false, message: 'Student profile not found.' });
        }
        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
}
