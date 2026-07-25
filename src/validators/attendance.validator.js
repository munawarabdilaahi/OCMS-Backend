import { z } from 'zod';

export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE'];

export const createAttendanceSchema = z.object({
    student_id: z.union([z.string(), z.number()]).optional(),
    studentId: z.union([z.string(), z.number()]).optional(),
    course_id: z.union([z.string(), z.number()]).optional(),
    courseId: z.union([z.string(), z.number()]).optional(),
    date: z.string().min(1, 'student_id, course_id, date, and status are required.'),
    status: z.string().min(1, 'student_id, course_id, date, and status are required.').refine(
        val => ATTENDANCE_STATUSES.includes(val.toUpperCase()),
        `Invalid status. Allowed: ${ATTENDANCE_STATUSES.join(', ')}`
    ),
}).refine(data => data.student_id || data.studentId, {
    message: 'student_id, course_id, date, and status are required.',
    path: ['student_id'],
}).refine(data => data.course_id || data.courseId, {
    message: 'student_id, course_id, date, and status are required.',
    path: ['course_id'],
});

export const bulkCreateAttendanceSchema = z.object({
    course_id: z.union([z.string(), z.number()]).optional(),
    courseId: z.union([z.string(), z.number()]).optional(),
    date: z.string().min(1, 'course_id, date, and records array are required.'),
    records: z.array(z.object({
        student_id: z.union([z.string(), z.number()]).optional(),
        studentId: z.union([z.string(), z.number()]).optional(),
        status: z.string().refine(
            val => ATTENDANCE_STATUSES.includes(val.toUpperCase()),
            `Invalid status. Allowed: ${ATTENDANCE_STATUSES.join(', ')}`
        ).optional(),
    })).min(1, 'course_id, date, and records array are required.'),
}).refine(data => data.course_id || data.courseId, {
    message: 'course_id, date, and records array are required.',
    path: ['course_id'],
});

export const updateAttendanceSchema = z.object({
    status: z.string().refine(
        val => ATTENDANCE_STATUSES.includes(val.toUpperCase()),
        `Invalid status. Allowed: ${ATTENDANCE_STATUSES.join(', ')}`
    ).optional(),
    remarks: z.string().optional(),
});
