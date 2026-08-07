import { describe, it, expect } from '@jest/globals';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema, verifyEmailSchema } from '../src/validators/auth.validator.js';
import { createStudentSchema, updateStudentSchema, updateStudentStatusSchema } from '../src/validators/student.validator.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../src/validators/department.validator.js';
import { createCourseSchema, updateCourseSchema } from '../src/validators/course.validator.js';
import { createTeacherSchema, updateTeacherSchema } from '../src/validators/teacher.validator.js';
import { createExamScheduleSchema, submitExamResultSchema, updateExamScheduleSchema } from '../src/validators/exam.validator.js';

describe('loginSchema', () => {
    it('accepts valid login data', () => {
        expect(loginSchema.safeParse({ email: 'admin@ocms.edu', password: 'Password123' }).success).toBe(true);
    });
    it('rejects invalid email', () => {
        expect(loginSchema.safeParse({ email: 'not-an-email', password: 'Password123' }).success).toBe(false);
    });
    it('rejects empty password', () => {
        expect(loginSchema.safeParse({ email: 'admin@ocms.edu', password: '' }).success).toBe(false);
    });
    it('rejects empty email', () => {
        expect(loginSchema.safeParse({ email: '', password: 'Password123' }).success).toBe(false);
    });
});

describe('registerSchema', () => {
    it('accepts valid registration', () => {
        expect(registerSchema.safeParse({ name: 'New', email: 'new@ocms.edu', password: 'StrongPass1!', role: 'Student' }).success).toBe(true);
    });
    it('rejects weak password', () => {
        expect(registerSchema.safeParse({ name: 'New', email: 'new@ocms.edu', password: 'weak!', role: 'Student' }).success).toBe(false);
    });
    it('rejects missing name', () => {
        expect(registerSchema.safeParse({ email: 'new@ocms.edu', password: 'StrongPass1!' }).success).toBe(false);
    });
});

describe('forgotPasswordSchema', () => {
    it('accepts valid email', () => {
        expect(forgotPasswordSchema.safeParse({ email: 'user@ocms.edu' }).success).toBe(true);
    });
    it('rejects invalid email', () => {
        expect(forgotPasswordSchema.safeParse({ email: 'bad' }).success).toBe(false);
    });
});

describe('resetPasswordSchema', () => {
    it('accepts valid reset data', () => {
        const result = resetPasswordSchema.safeParse({ token: 'abc123', password: 'NewPass1!', confirmPassword: 'NewPass1!' });
        expect(result.success).toBe(true);
    });
    it('rejects mismatched passwords', () => {
        const result = resetPasswordSchema.safeParse({ token: 'abc123', password: 'NewPass1!', confirmPassword: 'Different1!' });
        expect(result.success).toBe(false);
    });
});

describe('refreshTokenSchema', () => {
    it('accepts valid refresh token', () => {
        expect(refreshTokenSchema.safeParse({ refreshToken: 'token-here' }).success).toBe(true);
    });
    it('rejects empty token', () => {
        expect(refreshTokenSchema.safeParse({ refreshToken: '' }).success).toBe(false);
    });
});

describe('verifyEmailSchema', () => {
    it('accepts valid token', () => {
        expect(verifyEmailSchema.safeParse({ token: 'verify-token' }).success).toBe(true);
    });
});

describe('createStudentSchema', () => {
    it('accepts valid student data with snake_case', () => {
        const result = createStudentSchema.safeParse({ name: 'Jane Doe', email: 'jane@ocms.edu', password: 'StudentPass1', department_id: 1, admission_no: 'STU-001', gender: 'FEMALE' });
        expect(result.success).toBe(true);
    });
    it('accepts camelCase fields', () => {
        const result = createStudentSchema.safeParse({ name: 'Jane Doe', email: 'jane@ocms.edu', password: 'StudentPass1', departmentId: 1, admissionNo: 'STU-001' });
        expect(result.success).toBe(true);
    });
    it('rejects invalid gender', () => {
        const result = createStudentSchema.safeParse({ name: 'Jane', email: 'jane@ocms.edu', password: 'StudentPass1', gender: 'INVALID' });
        expect(result.success).toBe(false);
    });
    it('rejects missing department_id', () => {
        const result = createStudentSchema.safeParse({ name: 'Jane', email: 'jane@ocms.edu', password: 'StudentPass1' });
        expect(result.success).toBe(false);
    });
});

describe('updateStudentSchema', () => {
    it('accepts partial update', () => {
        expect(updateStudentSchema.safeParse({ name: 'Updated Name' }).success).toBe(true);
    });
    it('accepts empty object', () => {
        expect(updateStudentSchema.safeParse({}).success).toBe(true);
    });
});

describe('updateStudentStatusSchema', () => {
    it('accepts status update', () => {
        expect(updateStudentStatusSchema.safeParse({ status: 'ACTIVE' }).success).toBe(true);
    });
    it('accepts empty object', () => {
        expect(updateStudentStatusSchema.safeParse({}).success).toBe(true);
    });
});

describe('createDepartmentSchema', () => {
    it('accepts valid department', () => {
        expect(createDepartmentSchema.safeParse({ name: 'Computer Science', code: 'CS', faculty_id: 1 }).success).toBe(true);
    });
    it('rejects empty name', () => {
        expect(createDepartmentSchema.safeParse({ name: '' }).success).toBe(false);
    });
});

describe('updateDepartmentSchema', () => {
    it('accepts partial update', () => {
        expect(updateDepartmentSchema.safeParse({ name: 'Updated' }).success).toBe(true);
    });
});

describe('createCourseSchema', () => {
    it('accepts valid course', () => {
        expect(createCourseSchema.safeParse({ title: 'Math 101' }).success).toBe(true);
    });
    it('rejects empty title', () => {
        expect(createCourseSchema.safeParse({ title: '' }).success).toBe(false);
    });
});

describe('createTeacherSchema', () => {
    it('accepts valid teacher', () => {
        const result = createTeacherSchema.safeParse({ name: 'Prof A', email: 'prof@ocms.edu', password: 'StrongPass1' });
        expect(result.success).toBe(true);
    });
    it('rejects missing name', () => {
        expect(createTeacherSchema.safeParse({ email: 'prof@ocms.edu', password: 'StrongPass1' }).success).toBe(false);
    });
    it('rejects invalid gender', () => {
        const result = createTeacherSchema.safeParse({ name: 'Prof A', email: 'prof@ocms.edu', password: 'StrongPass1', gender: 'BAD' });
        expect(result.success).toBe(false);
    });
});

describe('updateTeacherSchema', () => {
    it('accepts partial update', () => {
        expect(updateTeacherSchema.safeParse({ name: 'Updated Prof' }).success).toBe(true);
    });
});

describe('createExamScheduleSchema', () => {
    it('accepts valid exam schedule', () => {
        const result = createExamScheduleSchema.safeParse({ course_id: 1, title: 'Midterm', exam_date: '2026-08-15' });
        expect(result.success).toBe(true);
    });
    it('rejects missing title', () => {
        const result = createExamScheduleSchema.safeParse({ course_id: 1, exam_date: '2026-08-15' });
        expect(result.success).toBe(false);
    });
    it('rejects invalid status', () => {
        const result = createExamScheduleSchema.safeParse({ course_id: 1, title: 'Exam', exam_date: '2026-08-15', status: 'INVALID' });
        expect(result.success).toBe(false);
    });
});

describe('submitExamResultSchema', () => {
    it('accepts valid result', () => {
        const result = submitExamResultSchema.safeParse({ student_id: 1, course_id: 1 });
        expect(result.success).toBe(true);
    });
    it('rejects missing student_id', () => {
        expect(submitExamResultSchema.safeParse({ course_id: 1 }).success).toBe(false);
    });
});

describe('updateExamScheduleSchema', () => {
    it('accepts partial update', () => {
        expect(updateExamScheduleSchema.safeParse({ title: 'Updated Exam' }).success).toBe(true);
    });
});
