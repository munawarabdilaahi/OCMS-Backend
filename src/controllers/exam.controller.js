import { buildPaginationMeta } from '../utils/pagination.js';
import { createExamSchedule as createExamScheduleService, getCourseExamById as getCourseExamByIdService, submitExamResult as submitExamResultService, getExamResults as getExamResultsService, getExamSchedules as getExamSchedulesService, getCourseExams as getCourseExamsService, createCourseExam as createCourseExamService, updateExamSchedule as updateExamScheduleService, deleteExamSchedule as deleteExamScheduleService } from '../services/exam.service.js';

export async function createExamSchedule(req, res, next) {
    try {
        const schedule = await createExamScheduleService(req.body, req.user);
        return res.status(201).json({ success: true, message: 'Exam schedule created successfully.', data: schedule });
    } catch (error) {
        next(error);
    }
}

export async function getExamSchedules(req, res, next) {
    try {
        const { schedules, total, page, limit } = await getExamSchedulesService(req.query, req.user);
        return res.status(200).json({
            success: true,
            message: 'Exam schedules retrieved successfully.',
            data: schedules,
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function updateExamSchedule(req, res, next) {
    try {
        const schedule = await updateExamScheduleService(req.params.id, req.body, req.user);
        return res.status(200).json({ success: true, message: 'Exam schedule updated successfully.', data: schedule });
    } catch (error) {
        next(error);
    }
}

export async function deleteExamSchedule(req, res, next) {
    try {
        await deleteExamScheduleService(req.params.id, req.user);
        return res.status(200).json({ success: true, message: 'Exam schedule cancelled successfully.' });
    } catch (error) {
        next(error);
    }
}

export async function submitExamResult(req, res, next) {
    try {
        const result = await submitExamResultService(req.body, req.user);
        return res.status(201).json({ success: true, message: 'Exam result submitted successfully.', data: result });
    } catch (error) {
        next(error);
    }
}

export async function getExamResults(req, res, next) {
    try {
        const { results, total, page, limit } = await getExamResultsService(req.query, req.user);
        return res.status(200).json({
            success: true,
            message: 'Exam results retrieved successfully.',
            data: results,
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function createCourseExam(req, res, next) {
    try {
        const courseExam = await createCourseExamService(req.body, req.user);
        return res.status(201).json({ success: true, message: 'Course exam created successfully.', data: courseExam });
    } catch (error) {
        next(error);
    }
}

export async function getCourseExams(req, res, next) {
    try {
        const { courseExams, total, page, limit } = await getCourseExamsService(req.query, req.user);
        return res.status(200).json({
            success: true,
            message: 'Course exams retrieved successfully.',
            data: courseExams,
            meta: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        next(error);
    }
}

export async function getCourseExamById(req, res, next) {
    try {
        const courseExam = await getCourseExamByIdService(req.params.id, req.user);
        if (!courseExam) {
            return res.status(404).json({ success: false, message: 'Course exam not found.' });
        }
        return res.status(200).json({ success: true, message: 'Course exam retrieved successfully.', data: courseExam });
    } catch (error) {
        next(error);
    }
}
