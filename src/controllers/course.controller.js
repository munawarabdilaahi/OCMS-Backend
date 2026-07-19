import prisma from '../config/db.js';

const courseDelegate = () => prisma.course;

const courseInclude = {
    department: { select: { name: true } },
    teacher: { select: { id: true, user: { select: { name: true } } } },
};

function serializeCourse(course) {
    if (!course) return null;
    return {
        id: course.id,
        code: course.code || '',
        title: course.title || '',
        credit_hours: course.credit_hours || null,
        semester: course.semester || '',
        status: course.status || 'ACTIVE',
        department: course.department?.name || '',
        department_id: course.department_id,
        teacher: course.teacher?.user?.name || '',
        teacher_id: course.teacher_id,
    };
}

export async function createCourse(req, res, next) {
    try {
        const { code, title, credit_hours, creditHours, semester, status = 'ACTIVE', department_id, departmentId, teacher_id, teacherId } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: 'Course title is required.' });
        }

        if (code) {
            const existing = await courseDelegate().findUnique({ where: { code } });
            if (existing) {
                return res.status(409).json({ success: false, message: 'A course with this code already exists.' });
            }
        }

        const course = await courseDelegate().create({
            data: {
                code,
                title,
                credit_hours: credit_hours || creditHours ? Number(credit_hours || creditHours) : null,
                semester,
                status,
                department_id: department_id || departmentId ? Number(department_id || departmentId) : null,
                teacher_id: teacher_id || teacherId ? Number(teacher_id || teacherId) : null,
            },
            include: courseInclude,
        });

        return res.status(201).json({ success: true, message: 'Course created successfully.', data: serializeCourse(course) });
    } catch (error) {
        next(error);
    }
}

export async function getCourses(req, res, next) {
    try {
        const page = Math.max(Number(req.query.page || 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
        const search = req.query.search?.trim();
        const status = req.query.status?.trim();
        const department_id = req.query.department_id ? Number(req.query.department_id) : undefined;
        const skip = (page - 1) * limit;

        const where = {
            ...(status ? { status } : {}),
            ...(department_id ? { department_id } : {}),
            ...(search
                ? {
                    OR: [
                        { code: { contains: search, mode: 'insensitive' } },
                        { title: { contains: search, mode: 'insensitive' } },
                        { department: { name: { contains: search, mode: 'insensitive' } } },
                    ],
                }
                : {}),
        };

        const [courses, total] = await Promise.all([
            courseDelegate().findMany({ where, include: courseInclude, skip, take: limit, orderBy: { created_at: 'desc' } }),
            courseDelegate().count({ where }),
        ]);

        return res.status(200).json({
            success: true,
            message: 'Courses retrieved successfully.',
            data: courses.map(serializeCourse),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
}

export async function getCourseById(req, res, next) {
    try {
        const course = await courseDelegate().findUnique({
            where: { id: Number(req.params.id) },
            include: courseInclude,
        });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }
        return res.status(200).json({ success: true, message: 'Course retrieved successfully.', data: serializeCourse(course) });
    } catch (error) {
        next(error);
    }
}

export async function updateCourse(req, res, next) {
    try {
        const courseId = Number(req.params.id);
        const existing = await courseDelegate().findUnique({ where: { id: courseId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }

        const { code, title, credit_hours, creditHours, semester, status, department_id, departmentId, teacher_id, teacherId } = req.body;

        if (code && code !== existing.code) {
            const dup = await courseDelegate().findUnique({ where: { code } });
            if (dup) {
                return res.status(409).json({ success: false, message: 'A course with this code already exists.' });
            }
        }

        const course = await courseDelegate().update({
            where: { id: courseId },
            data: {
                ...(code !== undefined ? { code } : {}),
                ...(title !== undefined ? { title } : {}),
                ...(credit_hours !== undefined || creditHours !== undefined ? { credit_hours: Number(credit_hours || creditHours) } : {}),
                ...(semester !== undefined ? { semester } : {}),
                ...(status !== undefined ? { status } : {}),
                ...(department_id !== undefined || departmentId !== undefined ? { department_id: Number(department_id || departmentId) } : {}),
                ...(teacher_id !== undefined || teacherId !== undefined ? { teacher_id: Number(teacher_id || teacherId) } : {}),
            },
            include: courseInclude,
        });

        return res.status(200).json({ success: true, message: 'Course updated successfully.', data: serializeCourse(course) });
    } catch (error) {
        next(error);
    }
}

export async function deleteCourse(req, res, next) {
    try {
        const courseId = Number(req.params.id);
        const existing = await courseDelegate().findUnique({ where: { id: courseId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }

        const examCount = await prisma.examSchedule.count({ where: { course_id: courseId } });
        if (examCount > 0) {
            return res.status(400).json({ success: false, message: `Cannot delete course with ${examCount} exam schedule(s). Remove exams first.` });
        }

        await courseDelegate().delete({ where: { id: courseId } });
        return res.status(200).json({ success: true, message: 'Course deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
