import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import examRoutes from './routes/exam.routes';
import { errorHandler, notFound } from './middlewares/error.middleware';
export function createApp() {
    const app = express();
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    app.use(cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.get('/api/health', (req, res) => {
        res.status(200).json({
            success: true,
            message: 'OCMS API is running',
            data: {
                service: 'Online Campus Management System API',
                timestamp: new Date().toISOString(),
            },
        });
    });
    app.use('/api/auth', authRoutes);
    app.use('/api/students', studentRoutes);
    app.use('/api/exams', examRoutes);
    app.use(notFound);
    app.use(errorHandler);
    return app;
}
