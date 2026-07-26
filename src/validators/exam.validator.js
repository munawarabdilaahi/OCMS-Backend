import { z } from 'zod';

export const ALLOWED_EXAM_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
export const ALLOWED_RESULT_STATUSES = ['DRAFT', 'PUBLISHED', 'REVIEWED'];
export const ALLOWED_COURSE_EXAM_STATUSES = ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'];

export const createExamScheduleSchema = z.object({
    course_id: z.union([z.string(), z.number()]).optional(),
    courseId: z.union([z.string(), z.number()]).optional(),
    title: z.string().min(1, 'course_id, title, and exam_date are required.'),
    exam_date: z.string().optional(),
    examDate: z.string().optional(),
    start_time: z.string().optional(),
    startTime: z.string().optional(),
    end_time: z.string().optional(),
    endTime: z.string().optional(),
    room: z.string().optional(),
    status: z.string().transform(val => val.toUpperCase()).refine(
        val => ALLOWED_EXAM_STATUSES.includes(val),
        `Invalid status. Allowed values: ${ALLOWED_EXAM_STATUSES.join(', ')}`
    ).optional(),
}).refine(data => data.course_id || data.courseId, {
    message: 'course_id, title, and exam_date are required.',
    path: ['course_id'],
}).refine(data => data.exam_date || data.examDate, {
    message: 'course_id, title, and exam_date are required.',
    path: ['exam_date'],
});

export const submitExamResultSchema = z.object({
    student_id: z.union([z.string(), z.number()]).optional(),
    studentId: z.union([z.string(), z.number()]).optional(),
    course_id: z.union([z.string(), z.number()]).optional(),
    courseId: z.union([z.string(), z.number()]).optional(),
    exam_schedule_id: z.union([z.string(), z.number()]).optional(),
    examScheduleId: z.union([z.string(), z.number()]).optional(),
    midterm_score: z.union([z.string(), z.number()]).optional(),
    midtermScore: z.union([z.string(), z.number()]).optional(),
    final_score: z.union([z.string(), z.number()]).optional(),
    finalScore: z.union([z.string(), z.number()]).optional(),
    activity_score: z.union([z.string(), z.number()]).optional(),
    activityScore: z.union([z.string(), z.number()]).optional(),
    remarks: z.string().optional(),
    status: z.string().transform(val => val.toUpperCase()).refine(
        val => ALLOWED_RESULT_STATUSES.includes(val),
        `Invalid status. Allowed values: ${ALLOWED_RESULT_STATUSES.join(', ')}`
    ).optional(),
}).refine(data => data.student_id || data.studentId, {
    message: 'student_id and course_id are required.',
    path: ['student_id'],
}).refine(data => data.course_id || data.courseId, {
    message: 'student_id and course_id are required.',
    path: ['course_id'],
});

export const createCourseExamSchema = z.object({
    course_id: z.union([z.string(), z.number()]).optional(),
    courseId: z.union([z.string(), z.number()]).optional(),
    title: z.string().min(1, 'course_id, title, and questions are required.'),
    instructions: z.string().optional(),
    duration_minutes: z.union([z.string(), z.number()]).optional(),
    durationMinutes: z.union([z.string(), z.number()]).optional(),
    questions: z.any(),
    status: z.string().transform(val => val.toUpperCase()).refine(
        val => ALLOWED_COURSE_EXAM_STATUSES.includes(val),
        `Invalid status. Allowed values: ${ALLOWED_COURSE_EXAM_STATUSES.join(', ')}`
    ).optional(),
}).refine(data => data.course_id || data.courseId, {
    message: 'course_id, title, and questions are required.',
    path: ['course_id'],
});

export const updateExamScheduleSchema = z.object({
    course_id: z.union([z.string(), z.number()]).optional(),
    courseId: z.union([z.string(), z.number()]).optional(),
    title: z.string().optional(),
    exam_type: z.string().optional(),
    examType: z.string().optional(),
    exam_date: z.string().optional(),
    examDate: z.string().optional(),
    start_time: z.string().optional(),
    startTime: z.string().optional(),
    end_time: z.string().optional(),
    endTime: z.string().optional(),
    room: z.string().optional(),
    status: z.string().transform(val => val.toUpperCase()).refine(
        val => ALLOWED_EXAM_STATUSES.includes(val),
        `Invalid status. Allowed values: ${ALLOWED_EXAM_STATUSES.join(', ')}`
    ).optional(),
});
