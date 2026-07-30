import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import courseRoutes from './routes/course.routes.js';
import examRoutes from './routes/exam.routes.js';
import departmentRoutes from './routes/department.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import userRoutes from './routes/user.routes.js';
import roleRoutes from './routes/role.routes.js';
import feeRoutes from './routes/fee.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import enrollmentRoutes from './routes/enrollment.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import universityRoutes from './routes/university.routes.js';
import campusRoutes from './routes/campus.routes.js';
import facultyRoutes from './routes/faculty.routes.js';
import programRoutes from './routes/program.routes.js';
import academicYearRoutes from './routes/academic-year.routes.js';
import semesterRoutes from './routes/semester.routes.js';
import levelRoutes from './routes/level.routes.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { globalLimiter } from './middlewares/rateLimit.middleware.js';
import { sanitize } from './middlewares/sanitize.middleware.js';
import { csrfProtection } from './middlewares/csrf.middleware.js';

const isProduction = process.env.NODE_ENV === 'production';

export function createApp() {
    const app = express();

    if (isProduction) {
        app.set('trust proxy', 1);
        app.use((req, res, next) => {
            if (req.headers['x-forwarded-proto'] !== 'https' && !req.hostname.includes('localhost')) {
                return res.redirect(301, `https://${req.headers.host}${req.url}`);
            }
            next();
        });
    }

    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                fontSrc: ["'self'"],
                connectSrc: ["'self'"],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
                upgradeInsecureRequests: isProduction ? [] : null,
            },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: 'same-site' },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
        xFrameOptions: { action: 'deny' },
        xContentTypeOptions: true,
    }));

    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
        : ['http://localhost:3000'];

    app.use(cors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
        credentials: true,
        maxAge: 86400,
    }));

    app.use('/api-docs', (req, res, next) => {
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'");
        next();
    }, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    app.use(globalLimiter);
    app.use(cookieParser());
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));
    app.use(sanitize);
    app.use(csrfProtection);

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
    app.use('/api/teachers', teacherRoutes);
    app.use('/api/courses', courseRoutes);
    app.use('/api/exams', examRoutes);
    app.use('/api/departments', departmentRoutes);
    app.use('/api/attendance', attendanceRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/roles', roleRoutes);
    app.use('/api/fees', feeRoutes);
    app.use('/api/invoices', invoiceRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/enrollments', enrollmentRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/universities', universityRoutes);
    app.use('/api/campuses', campusRoutes);
    app.use('/api/faculties', facultyRoutes);
    app.use('/api/programs', programRoutes);
    app.use('/api/academic-years', academicYearRoutes);
    app.use('/api/semesters', semesterRoutes);
    app.use('/api/levels', levelRoutes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}
