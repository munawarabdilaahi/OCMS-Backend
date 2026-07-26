import { buildPaginationMeta } from '../utils/pagination.js';
import { serializeStudent, createStudent as createStudentService, getStudents as getStudentsService, getStudentById as getStudentByIdService, deleteStudent as deleteStudentService, updateStudentStatus as updateStudentStatusService, updateStudent as updateStudentService, getStudentStats as getStudentStatsService } from '../services/student.service.js';

export async function createStudent(req, res, next) {
    try {
        const student = await createStudentService(req.body);
        return res.status(201).json({
            success: true,
            message: 'Student created successfully.',
            data: serializeStudent(student),
        });
    } catch (error) {
        next(error);
    }
}
export async function getStats(req, res, next) {
    try {
        const data = await getStudentStatsService();
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
}
export async function getStudents(req, res, next) {
    try {
        const { students, total, page, limit } = await getStudentsService(req.query, req.user);
        return res.status(200).json({
            success: true,
            message: 'Students retrieved successfully.',
            data: students.map(serializeStudent),
            meta: buildPaginationMeta(page, limit, total),
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getStudentById(req, res, next) {
    try {
        const student = await getStudentByIdService(req.params.id, req.user);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found.',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Student retrieved successfully.',
            data: {
                id: student.id,
                name: student.user?.name || '',
                email: student.user?.email || '',
                phone: student.user?.phone || '',
                gender: student.gender || '',
                department: student.department?.name || '',
                department_id: student.department_id,
                status: student.status || '',
                admission_no: student.admission_no || '',
                date_of_birth: student.date_of_birth || null,
                address: student.address || '',
                created_at: student.created_at,
            },
        });
    }
    catch (error) {
        next(error);
    }
}
export async function updateStudent(req, res, next) {
    try {
        const student = await updateStudentService(req.params.id, req.body);
        return res.status(200).json({
            success: true,
            message: 'Student updated successfully.',
            data: serializeStudent(student),
        });
    }
    catch (error) {
        next(error);
    }
}
export async function updateStudentStatus(req, res, next) {
    try {
        const student = await updateStudentStatusService(req.params.id, req.body);
        return res.status(200).json({
            success: true,
            message: 'Student status updated successfully.',
            data: serializeStudent(student),
        });
    }
    catch (error) {
        next(error);
    }
}
export async function deleteStudent(req, res, next) {
  try {
    const student = await deleteStudentService(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully.',
      data: serializeStudent(student),
    });
  } catch (error) {
    next(error);
  }
}
