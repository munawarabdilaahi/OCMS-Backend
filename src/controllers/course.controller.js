import { buildPaginationMeta } from '../utils/pagination.js';
import { serializeCourse, createCourse as createCourseService, getCourses as getCoursesService, getCourseById as getCourseByIdService, updateCourse as updateCourseService, deleteCourse as deleteCourseService } from '../services/course.service.js';

export async function createCourse(req, res, next) {
    try {
        const course = await createCourseService(req.body);
        return res.status(201).json({ success: true, message: 'Course created successfully.', data: serializeCourse(course) });
    } catch (error) {
        next(error);
    }
}

export async function getCourses(req, res, next) {
    try {
        const { courses, total, page, limit } = await getCoursesService(req.query, req.user);
        return res.status(200).json({
            success: true,
            message: 'Courses retrieved successfully.',
            data: courses.map(serializeCourse),
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getCourseById(req, res, next) {
    try {
        const course = await getCourseByIdService(req.params.id, req.user);
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
        const course = await updateCourseService(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Course updated successfully.', data: serializeCourse(course) });
    } catch (error) {
        next(error);
    }
}

export async function deleteCourse(req, res, next) {
    try {
        await deleteCourseService(req.params.id);
        return res.status(200).json({ success: true, message: 'Course deleted successfully.' });
    } catch (error) {
        next(error);
    }
}
