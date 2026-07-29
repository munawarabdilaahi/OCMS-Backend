import swaggerJsdoc from 'swagger-jsdoc';

const schemas = {
    ErrorResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'An error occurred.' },
            errors: { type: 'object', nullable: true, example: null },
        },
    },
    SuccessResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful.' },
            data: { type: 'object', nullable: true, example: {} },
        },
    },
    PaginationMeta: {
        type: 'object',
        properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 100 },
            pageCount: { type: 'integer', example: 10 },
        },
    },
    PaginatedData: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Resources retrieved successfully.' },
            data: { type: 'array', items: { type: 'object' } },
            meta: { $ref: '#/components/schemas/PaginationMeta' },
        },
    },
    User: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@ocms.edu' },
            phone: { type: 'string', example: '+1234567890' },
            status: { type: 'string', example: 'ACTIVE' },
            role: { type: 'string', example: 'Admin' },
            created_at: { type: 'string', format: 'date-time' },
        },
    },
    Student: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Alice Smith' },
            email: { type: 'string', example: 'alice@ocms.edu' },
            phone: { type: 'string', example: '+1234567890' },
            gender: { type: 'string', example: 'FEMALE' },
            department: { type: 'string', example: 'Computer Science' },
            department_id: { type: 'integer', example: 1 },
            status: { type: 'string', example: 'ACTIVE' },
            admission_no: { type: 'string', example: '2024/001' },
            date_of_birth: { type: 'string', format: 'date', example: '2000-01-15' },
            address: { type: 'string', example: '123 University Ave' },
        },
    },
    Teacher: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Dr. Smith' },
            email: { type: 'string', example: 'smith@ocms.edu' },
            phone: { type: 'string', example: '+1234567890' },
            department: { type: 'string', example: 'Computer Science' },
            department_id: { type: 'integer', example: 1 },
            employee_no: { type: 'string', example: 'TCH001' },
            position: { type: 'string', example: 'Senior Lecturer' },
            qualification: { type: 'string', example: 'PhD' },
            gender: { type: 'string', example: 'MALE' },
            status: { type: 'string', example: 'ACTIVE' },
        },
    },
    Course: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            code: { type: 'string', example: 'CS101' },
            title: { type: 'string', example: 'Introduction to Computer Science' },
            credit_hours: { type: 'integer', example: 3 },
            semester: { type: 'string', example: 'Fall 2024' },
            status: { type: 'string', example: 'ACTIVE' },
            department: { type: 'string', example: 'Computer Science' },
            department_id: { type: 'integer', example: 1 },
            teacher: { type: 'string', example: 'Dr. Smith' },
            teacher_id: { type: 'integer', example: 1 },
        },
    },
    Department: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            code: { type: 'string', example: 'CS' },
            name: { type: 'string', example: 'Computer Science' },
        },
    },
    Attendance: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            student_id: { type: 'integer', example: 1 },
            studentName: { type: 'string', example: 'Alice Smith' },
            studentEmail: { type: 'string', example: 'alice@ocms.edu' },
            course_id: { type: 'integer', example: 1 },
            course: { type: 'string', example: 'Introduction to CS' },
            course_code: { type: 'string', example: 'CS101' },
            date: { type: 'string', format: 'date', example: '2024-09-15' },
            status: { type: 'string', example: 'PRESENT' },
            remarks: { type: 'string', example: '' },
            created_at: { type: 'string', format: 'date-time' },
        },
    },
    ExamSchedule: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            course_id: { type: 'integer', example: 1 },
            course: { type: 'object', properties: { id: { type: 'integer' }, code: { type: 'string' }, title: { type: 'string' } } },
            title: { type: 'string', example: 'Midterm Examination' },
            exam_type: { type: 'string', example: 'MIDTERM' },
            exam_date: { type: 'string', format: 'date', example: '2024-12-15' },
            start_time: { type: 'string', example: '09:00' },
            end_time: { type: 'string', example: '11:00' },
            room: { type: 'string', example: 'Hall A' },
            status: { type: 'string', example: 'SCHEDULED' },
        },
    },
    ExamResult: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            student_id: { type: 'integer', example: 1 },
            course_id: { type: 'integer', example: 1 },
            exam_schedule_id: { type: 'integer', example: 1 },
            midterm_score: { type: 'number', example: 30 },
            final_score: { type: 'number', example: 40 },
            activity_score: { type: 'number', example: 10 },
            total_score: { type: 'number', example: 80 },
            status: { type: 'string', example: 'PUBLISHED' },
            remarks: { type: 'string', example: 'Good performance' },
        },
    },
    CourseExam: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            course_id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Quiz 1' },
            instructions: { type: 'string', example: 'Answer all questions' },
            duration_minutes: { type: 'integer', example: 30 },
            questions: { type: 'array', items: { type: 'object' } },
            status: { type: 'string', example: 'DRAFT' },
        },
    },
    Enrollment: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            student_id: { type: 'integer', example: 1 },
            studentName: { type: 'string', example: 'Alice Smith' },
            studentEmail: { type: 'string', example: 'alice@ocms.edu' },
            admission_no: { type: 'string', example: '2024/001' },
            department: { type: 'string', example: 'Computer Science' },
            course_id: { type: 'integer', example: 1 },
            courseCode: { type: 'string', example: 'CS101' },
            courseTitle: { type: 'string', example: 'Intro to CS' },
            status: { type: 'string', example: 'ACTIVE' },
            created_at: { type: 'string', format: 'date-time' },
        },
    },
    FeeStructure: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Tuition Fee' },
            description: { type: 'string', example: 'Semester tuition' },
            amount: { type: 'number', example: 5000 },
            department_id: { type: 'integer', example: 1 },
            academic_year: { type: 'string', example: '2024/2025' },
            semester: { type: 'string', example: 'Fall' },
            status: { type: 'string', example: 'ACTIVE' },
        },
    },
    Invoice: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            invoice_number: { type: 'string', example: 'INV-2024-001' },
            student_id: { type: 'integer', example: 1 },
            amount: { type: 'number', example: 5000 },
            paid_amount: { type: 'number', example: 3000 },
            balance: { type: 'number', example: 2000 },
            status: { type: 'string', example: 'Partial' },
            due_date: { type: 'string', format: 'date', example: '2024-10-01' },
            academic_year: { type: 'string', example: '2024/2025' },
            semester: { type: 'string', example: 'Fall' },
        },
    },
    Payment: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            invoice_id: { type: 'integer', example: 1 },
            amount: { type: 'number', example: 2000 },
            payment_method: { type: 'string', example: 'CARD' },
            reference_number: { type: 'string', example: 'TXN123456' },
            status: { type: 'string', example: 'Completed' },
            created_at: { type: 'string', format: 'date-time' },
        },
    },
    Role: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Admin' },
            permissions: { type: 'object', example: {} },
            created_at: { type: 'string', format: 'date-time' },
        },
    },
    AdminDashboard: {
        type: 'object',
        properties: {
            students: {
                type: 'object',
                properties: {
                    total: { type: 'integer', example: 500 },
                    active: { type: 'integer', example: 450 },
                    inactive: { type: 'integer', example: 50 },
                },
            },
            teachers: { type: 'object', properties: { total: { type: 'integer', example: 30 } } },
            courses: { type: 'object', properties: { total: { type: 'integer', example: 60 } } },
            departments: { type: 'object', properties: { total: { type: 'integer', example: 8 } } },
            attendance: {
                type: 'object',
                properties: {
                    total: { type: 'integer', example: 2000 },
                    present: { type: 'integer', example: 1600 },
                    absent: { type: 'integer', example: 300 },
                    late: { type: 'integer', example: 100 },
                    rate: { type: 'integer', example: 85 },
                },
            },
            exams: {
                type: 'object',
                properties: {
                    schedules: { type: 'integer', example: 40 },
                    results: { type: 'integer', example: 800 },
                },
            },
            finance: {
                type: 'object',
                properties: {
                    total_invoiced: { type: 'number', example: 500000 },
                    outstanding: { type: 'number', example: 100000 },
                    open_invoices: { type: 'integer', example: 50 },
                    total_received: { type: 'number', example: 50000 },
                },
            },
        },
    },
    TeacherDashboard: {
        type: 'object',
        properties: {
            profile: {
                type: 'object',
                properties: {
                    name: { type: 'string', example: 'Dr. Smith' },
                    email: { type: 'string', example: 'smith@ocms.edu' },
                    employee_no: { type: 'string', example: 'TCH001' },
                    department: { type: 'string', example: 'Computer Science' },
                },
            },
            courses: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        code: { type: 'string' },
                        title: { type: 'string' },
                        studentCount: { type: 'integer', example: 30 },
                    },
                },
            },
            totalStudents: { type: 'integer', example: 90 },
            attendance: {
                type: 'object',
                properties: {
                    total: { type: 'integer', example: 500 },
                    present: { type: 'integer', example: 400 },
                    absent: { type: 'integer', example: 60 },
                    late: { type: 'integer', example: 40 },
                    rate: { type: 'integer', example: 88 },
                },
            },
            upcomingExams: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        title: { type: 'string' },
                        type: { type: 'string' },
                        course: { type: 'string' },
                        courseCode: { type: 'string' },
                        date: { type: 'string', format: 'date-time' },
                    },
                },
            },
            recentResults: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        studentName: { type: 'string' },
                        admission_no: { type: 'string' },
                        course: { type: 'string' },
                        courseCode: { type: 'string' },
                        score: { type: 'number' },
                        status: { type: 'string' },
                        date: { type: 'string', format: 'date-time' },
                    },
                },
            },
        },
    },
    StudentDashboard: {
        type: 'object',
        properties: {
            profile: {
                type: 'object',
                properties: {
                    name: { type: 'string', example: 'Alice Smith' },
                    email: { type: 'string', example: 'alice@ocms.edu' },
                    phone: { type: 'string', example: '+1234567890' },
                    admission_no: { type: 'string', example: '2024/001' },
                    department: { type: 'string', example: 'Computer Science' },
                },
            },
            courses: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        code: { type: 'string' },
                        title: { type: 'string' },
                        teacher: { type: 'string' },
                        attendanceRate: { type: 'integer', nullable: true, example: 90 },
                    },
                },
            },
            attendance: {
                type: 'object',
                properties: {
                    total: { type: 'integer', example: 100 },
                    present: { type: 'integer', example: 85 },
                    absent: { type: 'integer', example: 10 },
                    late: { type: 'integer', example: 5 },
                    rate: { type: 'integer', example: 90 },
                },
            },
            recentResults: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        course: { type: 'string' },
                        courseCode: { type: 'string' },
                        total_score: { type: 'number' },
                        status: { type: 'string' },
                        date: { type: 'string', format: 'date-time' },
                    },
                },
            },
            upcomingExams: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        title: { type: 'string' },
                        type: { type: 'string' },
                        course: { type: 'string' },
                        courseCode: { type: 'string' },
                        date: { type: 'string', format: 'date-time' },
                    },
                },
            },
            progress: {
                type: 'object',
                properties: {
                    enrolledCourses: { type: 'integer', example: 5 },
                    resultsCount: { type: 'integer', example: 8 },
                    totalScore: { type: 'number', example: 640 },
                    averageScore: { type: 'number', example: 80 },
                },
            },
        },
    },
    LoginResponse: {
        type: 'object',
        properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            user: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    name: { type: 'string', example: 'Admin User' },
                    email: { type: 'string', example: 'admin@ocms.edu' },
                    role: { type: 'string', example: 'Admin' },
                    status: { type: 'string', example: 'ACTIVE' },
                },
            },
        },
    },
    LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
            email: { type: 'string', format: 'email', example: 'admin@ocms.edu' },
            password: { type: 'string', format: 'password', example: 'password123' },
        },
    },
    RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@ocms.edu' },
            password: { type: 'string', format: 'password', example: 'password123' },
            phone: { type: 'string', example: '+1234567890' },
        },
    },
    StudentStats: {
        type: 'object',
        properties: {
            totalStudents: { type: 'integer', example: 500 },
            activeStudents: { type: 'integer', example: 450 },
            inactiveStudents: { type: 'integer', example: 50 },
            totalUsers: { type: 'integer', example: 600 },
            totalDepartments: { type: 'integer', example: 8 },
            totalExamSchedules: { type: 'integer', example: 40 },
            totalExamResults: { type: 'integer', example: 800 },
            departmentBreakdown: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', example: 'Computer Science' },
                        count: { type: 'integer', example: 100 },
                    },
                },
            },
            genderBreakdown: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', example: 'MALE' },
                        value: { type: 'integer', example: 250 },
                    },
                },
            },
            recentStudents: {
                type: 'array',
                items: { $ref: '#/components/schemas/Student' },
            },
        },
    },
    AttendanceStats: {
        type: 'object',
        properties: {
            total: { type: 'integer', example: 2000 },
            present: { type: 'integer', example: 1600 },
            absent: { type: 'integer', example: 300 },
            late: { type: 'integer', example: 100 },
            rate: { type: 'integer', example: 85 },
        },
    },
    InvoiceStats: {
        type: 'object',
        properties: {
            total_invoiced: { type: 'number', example: 500000 },
            outstanding_balance: { type: 'number', example: 100000 },
            total_paid: { type: 'number', example: 400000 },
            overdue_balance: { type: 'number', example: 50000 },
            open_invoices: { type: 'integer', example: 50 },
        },
    },
    PaymentStats: {
        type: 'object',
        properties: {
            total_received: { type: 'number', example: 400000 },
            this_month: { type: 'number', example: 50000 },
            completed_count: { type: 'integer', example: 300 },
            pending_count: { type: 'integer', example: 20 },
        },
    },
    Session: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            user_agent: { type: 'string', example: 'Mozilla/5.0...' },
            ip_address: { type: 'string', example: '192.168.1.1' },
            last_active: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
        },
    },
};

const responses = {
    Unauthorized: {
        description: 'Authentication is required or token is invalid/expired.',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { success: false, message: 'Authentication required.' },
            },
        },
    },
    Forbidden: {
        description: 'Insufficient permissions for this action.',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { success: false, message: 'Access denied. Insufficient permissions.' },
            },
        },
    },
    NotFound: {
        description: 'The requested resource was not found.',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { success: false, message: 'Resource not found.' },
            },
        },
    },
    ValidationError: {
        description: 'Request validation failed.',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Validation failed.' },
                        errors: { type: 'array', items: { type: 'object' } },
                    },
                },
                example: { success: false, message: 'Validation failed.', errors: [{ field: 'email', message: 'Invalid email format' }] },
            },
        },
    },
    Conflict: {
        description: 'Resource already exists.',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { success: false, message: 'Resource already exists.' },
            },
        },
    },
    InternalError: {
        description: 'Internal server error.',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { success: false, message: 'Internal server error.' },
            },
        },
    },
};

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'OCMS API',
            version: '1.0.0',
            description: 'Online Campus Management System REST API documentation.',
            contact: {
                name: 'OCMS Support',
                email: 'support@ocms.edu',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas,
            responses,
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.routes.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
