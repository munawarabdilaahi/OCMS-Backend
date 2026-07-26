import { z } from 'zod';

export const createEnrollmentSchema = z.object({
    student_id: z.union([z.string(), z.number()]).optional(),
    studentId: z.union([z.string(), z.number()]).optional(),
    course_id: z.union([z.string(), z.number()]).optional(),
    courseId: z.union([z.string(), z.number()]).optional(),
}).refine((data) => (data.student_id || data.studentId) && (data.course_id || data.courseId), {
    message: 'student_id and course_id are required.',
});
