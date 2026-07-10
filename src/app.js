import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import examRoutes from './routes/exam.routes.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

export function createApp() {
    const app = express();

    // CORS Qaabaynta saxda ah ee IP-gaaga React-ka
    app.use(cors({
        origin: ['http://192.168.100.88:3000', 'http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }));

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Health Check Endpoint
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

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/students', studentRoutes);
    app.use('/api/exams', examRoutes);

    // Error Handlers (Waa inay ugu dambeeyaan mar walba)
    app.use(notFound);
    app.use(errorHandler);

    return app;
}